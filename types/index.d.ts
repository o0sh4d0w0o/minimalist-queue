import { EventEmitter } from "events";

export interface Queue extends EventEmitter {
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

export interface QueueEvents {
    /**
     * Event string when a task start
     */
    get TASK_START(): string;

    /**
     * Event string when a task done
     */
    get TASK_DONE(): string;

    /**
     * Event string when a task failed
     */
    get TASK_FAILED(): string;

    /**
     * Event string when queue start
     */
    get START(): string;

    /**
     * Event string when queue is done
     */
    get DONE(): string;
}

export interface QueueTask extends EventEmitter {
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
