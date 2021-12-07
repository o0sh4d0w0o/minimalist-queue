const { Queue, QueueEvents, QueueTask } = require("../index");

let timeoutIDAst1 = 0;
let timeoutIDAst2 = 0;
let timeoutIDAst3 = 0;
let timeoutIDAst4 = 0;
let timeoutIDAst5 = 0;
let timeoutIDAst6 = 0;
let timeoutIDAst7 = 0;

const syncTask1 = () => 42;
const syncTask2 = () => 43;
const syncTask3 = () => 44;
const syncTask4 = () => 45;

const asyncTask1 = () =>
    new Promise((resolve) => (timeoutIDAst1 = setTimeout(() => resolve(42), 10)));
const asyncTask2 = () =>
    new Promise((resolve) => (timeoutIDAst2 = setTimeout(() => resolve(43), 20)));
const asyncTask3 = () =>
    new Promise((resolve) => (timeoutIDAst3 = setTimeout(() => resolve(44), 10)));
const asyncTask4 = () =>
    new Promise((resolve) => (timeoutIDAst4 = setTimeout(() => resolve(45), 20)));

const asyncTaskError1 = () =>
    new Promise(
        (resolve, reject) =>
            (timeoutIDAst5 = setTimeout(() => {
                try {
                    resolve(notExistingFct);
                } catch (error) {
                    reject(error);
                }
            }, 20))
    );

const awaitAsyncTask = async () => {
    const promise = new Promise((resolve, reject) => {
        timeoutIDAst6 = setTimeout(() => {
            resolve(42);
        }, 20);
    });

    return await promise;
};

const awaitAsyncTaskError = async () => {
    const promise = new Promise((resolve, reject) => {
        timeoutIDAst7 = setTimeout(() => {
            try {
                resolve(notExistingFct);
            } catch (error) {
                reject(error);
            }
        }, 20);
    });

    return await promise;
};

test("Queue auto-start", () => {
    return new Promise((resolve) => {
        const queue = new Queue({ autoStart: true });

        queue.on(QueueEvents.START, () => {
            expect(true).toBe(true);
            resolve();
        });

        queue.addTask(syncTask1);
    });
});

test("Queue timeout", () => {
    return new Promise((resolve, reject) => {
        const timeout = 10;
        const queue = new Queue({ timeout });
        let fallbackTimeoutID = 0;

        queue.on(QueueEvents.TASK_FAILED, (data) => {
            expect(data.result).toBeInstanceOf(Error);
            expect(data.result.message).toBe(`Task timeout (${timeout} ms)`);
            clearTimeout(timeoutIDAst2);
            clearTimeout(fallbackTimeoutID);
            resolve();
        });

        fallbackTimeoutID = setTimeout(() => {
            reject(`Should have timed out at ${timeout} ms`);
        }, timeout + 20);

        queue.addTask(asyncTask2);

        queue.start();
    });
});
test("Queue concurrency 1", () => {
    return new Promise((resolve, reject) => {
        const queue = new Queue({ concurrency: 1 });
        let counter = 0;

        queue.on(QueueEvents.START, () => {
            counter++;
        });

        queue.on(QueueEvents.DONE, () => {
            if (counter !== 4) {
                reject(`Got ${counter} but expected 3`);
            } else {
                resolve();
            }
        });

        queue.addTask(asyncTask1);
        queue.addTask(asyncTask2);
        queue.addTask(asyncTask3);
        queue.addTask(awaitAsyncTask);

        queue.start();
    });
});
test("Queue concurrency 2", () => {
    return new Promise((resolve) => {
        const queue = new Queue({ concurrency: 2 });
        let counter = 0;

        queue.on(QueueEvents.START, () => {
            counter++;
        });

        queue.on(QueueEvents.DONE, () => {
            if (counter !== 1) {
                reject(`Got ${counter} but expected 1`);
            } else {
                resolve();
            }
        });

        queue.addTask(asyncTask1);
        queue.addTask(awaitAsyncTask);
        queue.addTask(asyncTask3);
        queue.addTask(asyncTask4);

        queue.start();
    });
});

test("Queue addTask", () => {
    const queue = new Queue();

    queue.addTask(syncTask1);

    expect(queue.getTasks().length).toBe(1);

    queue.addTask(syncTask2);

    expect(queue.getTasks().length).toBe(2);
});

test("Queue removeTask", () => {
    const queue = new Queue();

    const queueTask1 = queue.addTask(syncTask1);
    const queueTask2 = queue.addTask(syncTask2);

    queue.removeTask(queueTask1);

    const tasks = queue.getTasks();

    expect(tasks[0]).toBe(queueTask2);

    const queueTask3 = queue.addTask(syncTask1);
    const queueTask4 = queue.addTask(syncTask2);

    const removedTask1 = queue.removeTask(queueTask4);
    const removedTask2 = queue.removeTask(queueTask3);

    expect(removedTask1).toBe(queueTask4);
    expect(removedTask2).toBe(queueTask3);
});

test("Queue clear", () => {
    const queue = new Queue();

    queue.addTask(syncTask1);
    queue.addTask(syncTask2);
    queue.addTask(syncTask1);
    queue.addTask(syncTask2);

    expect(queue.getTasks().length).toBe(4);

    queue.clear();

    expect(queue.getTasks().length).toBe(0);
});

test("Queue no start event if not tasks", () => {
    return new Promise((resolve, reject) => {
        const queue = new Queue();

        queue.on(QueueEvents.START, () => {
            reject("Should not start");
        });

        setTimeout(() => {
            resolve();
        }, 50);

        queue.start();
    });
});

test("Queue no done event if not tasks", () => {
    return new Promise((resolve, reject) => {
        const queue = new Queue();

        queue.on(QueueEvents.DONE, () => {
            reject("Should not be done");
        });

        setTimeout(() => {
            resolve();
        }, 50);

        queue.start();
    });
});

test("Queue task start event", () => {
    return new Promise((resolve, reject) => {
        const queue = new Queue();

        queue.on(QueueEvents.TASK_START, (data) => {
            expect(data.result).toBeInstanceOf(QueueTask);
            resolve();
        });

        queue.addTask(syncTask1);

        setTimeout(() => {
            reject("Task start event is not triggered");
        }, 10);

        queue.start();
    });
});

test("Queue task done event", () => {
    return new Promise((resolve, reject) => {
        const queue = new Queue();

        queue.on(QueueEvents.TASK_DONE, (data) => {
            expect(data.result).toBe(42);
            resolve();
        });

        queue.addTask(syncTask1);

        setTimeout(() => {
            reject("Task done event is not triggered");
        }, 10);

        queue.start();
    });
});

test("Queue task failed event", () => {
    return new Promise((resolve, reject) => {
        const queue = new Queue();

        queue.on(QueueEvents.TASK_FAILED, (data) => {
            expect(data.result).toBeInstanceOf(Error);
        });

        queue.on(QueueEvents.DONE, () => {
            resolve();
        });

        queue.addTask(asyncTaskError1);
        queue.addTask(awaitAsyncTaskError);
        queue.addTask("ok");

        setTimeout(() => {
            reject("Task failed event is not triggered");
        }, 100);

        queue.start();
    });
});

test("Queue start event", () => {
    return new Promise((resolve, reject) => {
        const queue = new Queue();

        queue.on(QueueEvents.START, (data) => {
            expect(data).toBe(undefined);
            resolve();
        });

        queue.addTask(syncTask1);

        setTimeout(() => {
            reject("start event is not triggered");
        }, 10);

        queue.start();
    });
});

test("Queue done event", () => {
    return new Promise((resolve, reject) => {
        const queue = new Queue();

        queue.on(QueueEvents.DONE, (data) => {
            expect(data).toBe(undefined);
            resolve();
        });

        queue.addTask(syncTask1);

        setTimeout(() => {
            reject("done event is not triggered");
        }, 10);

        queue.start();
    });
});

test("Queue tasks updated on task done and failed trigger", () => {
    return new Promise((resolve, reject) => {
        const queue = new Queue();
        let counter = 2;
        queue.on(QueueEvents.TASK_DONE, () => {
            if (queue.getTasks().length !== 0) {
                reject("Expected tasks length === 0");
            }

            if (--counter === 0) {
                resolve();
            }
        });

        queue.on(QueueEvents.TASK_FAILED, () => {
            if (queue.getTasks().length !== 1) {
                reject("Expected tasks length === 1");
            }

            if (--counter === 0) {
                resolve();
            }
        });

        queue.addTask("ok");
        queue.addTask(syncTask1);

        queue.start();
    });
});

test("Queue tasks should have an unique ID", () => {
    const queue = new Queue();

    for (let i = 0; i < 10000; i++) {
        queue.addTask(syncTask1);
    }

    const tasks = queue.getTasks();
    const ids = new Set(tasks.map((task) => task.id));

    expect(tasks.length).toBe(ids.size);
});

test("Queue tasks should have an unique ID", () => {
    const queue = new Queue();

    for (let i = 0; i < 10000; i++) {
        queue.addTask(syncTask1);
    }

    const tasks = queue.getTasks();
    const ids = new Set(tasks.map((task) => task.id));

    expect(tasks.length).toBe(ids.size);
});
