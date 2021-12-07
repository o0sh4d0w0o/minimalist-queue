const EventEmitter = require("events");
const crypto = require("crypto");
const { types } = require("util");

function uuid4() {
    let rnd = crypto.randomBytes(16);
    rnd[6] = (rnd[6] & 0x0f) | 0x40;
    rnd[8] = (rnd[8] & 0x3f) | 0x80;
    rnd = rnd.toString("hex").match(/(.{8})(.{4})(.{4})(.{4})(.{12})/);
    rnd.shift();
    return rnd.join("-");
}

class QueueEvents {
    static get TASK_START() {
        return "Queue.task.start";
    }
    static get TASK_DONE() {
        return "Queue.task.done";
    }
    static get TASK_FAILED() {
        return "Queue.task.failed";
    }
    static get START() {
        return "Queue.start";
    }
    static get DONE() {
        return "Queue.done";
    }
}

class Queue extends EventEmitter {
    #tasks = [];
    #concurentTasks = [];
    #options = {
        concurrency: 5,
        timeout: 120000,
        autoStart: false,
    };

    constructor(options) {
        super();

        this.#options = { ...this.#options, ...options };
    }

    getTasks() {
        return this.#tasks.slice(0);
    }

    addTask(task) {
        const timeout = this.#options.timeout;
        const queueTask = new QueueTask(task, timeout);

        this.#tasks.push(queueTask);

        if (this.#options.autoStart) {
            this.start();
        }

        return queueTask;
    }

    removeTask(task) {
        const taskIndex = this.#tasks.indexOf(task);
        const concurentTaskIndex = this.#concurentTasks.indexOf(task);

        if (taskIndex > -1) {
            this.#tasks.splice(taskIndex, 1);
        }

        if (concurentTaskIndex > -1) {
            this.#concurentTasks.splice(concurentTaskIndex, 1);
        }

        return task;
    }

    start() {
        if (this.#tasks.length === 0) {
            return false;
        }

        if (this.#concurentTasks.length === 0) {
            this.emit(QueueEvents.START);
        }

        this.#tasks.forEach((task) => {
            if (this.#concurentTasks.length === this.#options.concurrency) {
                return;
            }

            const inExecQueue = this.#concurentTasks.includes(task);

            if (inExecQueue) {
                return;
            }

            const removeTask = () => {
                task.removeAllListeners();
                this.removeTask(task);
            };

            task.once(QueueEvents.TASK_START, (result) => {
                this.emit(QueueEvents.TASK_START, result);
            });

            task.once(QueueEvents.TASK_DONE, (result) => {
                removeTask();
                this.emit(QueueEvents.TASK_DONE, result);
                this.#emitOnQueueDone();
                this.start();
            });
            task.once(QueueEvents.TASK_FAILED, (result) => {
                removeTask();
                this.emit(QueueEvents.TASK_FAILED, result);
                this.#emitOnQueueDone();
                this.start();
            });

            this.#concurentTasks.push(task);
        });

        this.#concurentTasks.forEach((task) => {
            task.exec();
        });

        return true;
    }

    clear() {
        this.#tasks.length = 0;
    }

    #emitOnQueueDone() {
        if (this.#tasks.length === 0 && this.#concurentTasks.length === 0) {
            this.emit(QueueEvents.DONE);
        }
    }
}

class QueueTask extends EventEmitter {
    #startTime = 0n;
    #endTime = 0n;
    #job;
    #timeout;
    #timeoutID = -1;
    #timeoutError;

    constructor(job, timeout) {
        super();

        this.id = uuid4();
        this.isAsync = types.isAsyncFunction(job);
        this.#job = job;
        this.#timeout = timeout;
        this.#timeoutError = new Error(`Task timeout (${this.#timeout} ms)`);
    }

    async exec() {
        if (this.#startTime !== 0n) {
            return;
        }

        this.#startTime = process.hrtime.bigint();

        let promiseOrResult;

        try {
            promiseOrResult = this.#job();
        } catch (error) {
            this.emit(QueueEvents.TASK_FAILED, this.#jobEnd(error));
            return;
        }

        if (promiseOrResult instanceof Promise) {
            this.isAsync = true;
        }

        this.emit(QueueEvents.TASK_START, this.#createData(this));

        if (this.#timeout) {
            this.#timeoutID = setTimeout(() => {
                this.emit(QueueEvents.TASK_FAILED, this.#jobEnd(this.#timeoutError));
            }, this.#timeout);
        }

        if (this.isAsync) {
            try {
                this.emit(QueueEvents.TASK_DONE, this.#jobEnd(await promiseOrResult));
            } catch (error) {
                this.emit(QueueEvents.TASK_FAILED, this.#jobEnd(error));
            }
        } else {
            this.emit(QueueEvents.TASK_DONE, this.#jobEnd(promiseOrResult));
        }
    }

    #createData(result) {
        return {
            result,
        };
    }

    #createDoneData(result) {
        const completionTime = Number(this.#endTime - this.#startTime) / 10 ** 6;

        return {
            ...this.#createData(result),
            completionTime,
        };
    }

    #jobEnd(result) {
        this.#endTime = process.hrtime.bigint();

        clearTimeout(this.#timeoutID);

        return this.#createDoneData(result);
    }
}

module.exports.Queue = Queue;
module.exports.QueueEvents = QueueEvents;
module.exports.QueueTask = QueueTask;
