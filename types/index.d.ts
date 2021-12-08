import { EventEmitter } from "events";

export class Queue extends EventEmitter {
    constructor(options: options);
    /**
     * Return the list of added tasks.
     */
    getTasks(): QueueTask[];

    /**
     * Create a new task with the given task function and add it to the queue
     *
     * @param {function} task Task function to be added to the queue.
     * @return {QueueTask}
     */
    addTask(task: Function): QueueTask;

    /**
     * Remove a given task of the queue.
     *
     * @param {QueueTask} task Task to remove of the queue
     * @return {QueueTask}
     */
    removeTask(task: QueueTask): QueueTask;

    /**
     * Start the queue.
     */
    start(): boolean;

    /**
     * Clear the queue.
     */
    clear(): void;
}

export interface options {
    /**
     * Number of simultaneous tasks.
     *
     * @default 5
     */
    concurrency?: number;

    /**
     * Time before task was forced to shutdown.
     *
     * @default 120000
     */
    timeout?: number;

    /**
     * Queue will start automatically when a new task is added to the queue.
     *
     * @default false
     */
    autoStart?: boolean;
}

export class QueueEvents {
    /**
     * Event string when a task start
     */
    static get TASK_START(): string;

    /**
     * Event string when a task done
     */
    static get TASK_DONE(): string;

    /**
     * Event string when a task failed
     */
    static get TASK_FAILED(): string;

    /**
     * Event string when queue start
     */
    static get START(): string;

    /**
     * Event string when queue is done
     */
    static get DONE(): string;
}

export class QueueTask extends EventEmitter {
    constructor(job: Function, timeout: number);
    /**
     * Id of the the queue task
     */
    id: string;

    /**
     * Queue is async or not
     */
    isAsync: boolean;

    /**
     * Execution function of the task
     */
    exec(): void;
}

export default Queue;
