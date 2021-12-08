# minimalist-queue
[![Version](https://img.shields.io/npm/v/minimalist-queue.svg)](https://www.npmjs.com/package/minimalist-queue)
[![Build Status](https://app.travis-ci.com/o0sh4d0w0o/minimalist-queue.svg?branch=main)](https://app.travis-ci.com/o0sh4d0w0o/minimalist-queue)
[![Coverage Status](https://coveralls.io/repos/github/o0sh4d0w0o/minimalist-queue/badge.svg?branch=main)](https://coveralls.io/github/o0sh4d0w0o/minimalist-queue?branch=main)

> A node minimalist queue module without dependencies

Allow you to queue CPU/memory intensive async (or sync) tasks.

## Install

```
$ npm install minimalist-queue
```

## Usage

Here is simple example of using queue.

```js
const { Queue, QueueEvents } = require("minimalist-queue");

const asyncTask = () => new Promise((resolve) => setTimeout(() => resolve("asyncTask"), 100));

const queue = new Queue();

queue.on(QueueEvents.TASK_DONE, (data) => {
    console.log(`Result : ${data.result}`);
});

queue.addTask(asyncTask);

queue.start();
```

## DOCUMENTATION

### Queue

Class used to managing tasks

#### options

##### concurrency

Type: `number`
Default: `5`

Number of simultaneous tasks.

##### timeout

Type: `number`
Default: `120000`

Time before task was forced to shutdown.

##### autoStart

Type: `boolean`
Default: `false`

Queue will start automatically when a new task is added to the queue.

#### constructor(options?)

Create a new instance of a queue with given options, or use defaults if no options are given.

#### .getTasks()

Type: `Function`

Return the list of added tasks.

#### .addTask(task&lt;function&gt;)

Type: `Function`

Create a new task with the given task function and add it to the queue

#### .removeTask(task&lt;QueueTask&gt;)

Type: `Function`

Remove a given task of the queue.

#### .start()

Type: `Function`

Start the queue.

#### .clear()

Type: `Function`

Clear the queue.


### QueueEvents

Class that containing all Queue events as static properties

##### TASK_START

Triggered when a task start

##### TASK_DONE

Triggered when a task is done

##### TASK_FAILED

Triggered when a task failed to execute or encounter the queue timeout

##### START

Triggered when queue is starting

##### DONE

Triggered when queue is done

## Advanced example

Here is  a full example or minimalist-queue usage with **sync** / **async** (**await** included) and failed tasks

```js
const { Queue, QueueEvents } = require("minimalist-queue");

const syncTask = () => "syncTask";

const asyncTask = () => new Promise((resolve) => setTimeout(() => resolve("asyncTask"), 100));

const awaitAsyncTask = async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("awaitAsyncTask"), 200));
    return await promise;
};

const syncTaskFailed = () => _syncTaskFailed;

const asyncTaskFailed = () =>
    new Promise((resolve, reject) =>
        setTimeout(() => {
            try {
                resolve(_asyncTaskFailed);
            } catch (error) {
                reject(error);
            }
        }, 100)
    );

const awaitAsyncTaskFailed = async () => {
    const promise = new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                resolve(_awaitAsyncTaskFailed);
            } catch (error) {
                reject(error);
            }
        }, 200);
    });
    return await promise;
};

const queue = new Queue();

queue.on(QueueEvents.START, () => {
    console.log("\n+-------------------");
    console.log("Queue started");
    console.log("-------------------+");
});

queue.on(QueueEvents.DONE, () => {
    console.log("\n=-------------------");
    console.log("Queue done");
    console.log("-------------------=");
});

queue.on(QueueEvents.TASK_DONE, (data) => {
    console.log(`\x1b[33mTask done ! Result : ${data.result} in ${data.completionTime} ms\x1b[0m`);
});

queue.on(QueueEvents.TASK_FAILED, (data) => {
    console.log("\nxxxxxxxxxxxxxxxxxxxx");
    console.log(`\x1b[31mTask failed ! Error : ${data.result.message}\x1b[0m`);
    console.log("xxxxxxxxxxxxxxxxxxxx\n");
});

queue.on(QueueEvents.TASK_START, (data) => {
    console.log("\nTask start ! task details :", data.result, "\n");
});

queue.addTask(awaitAsyncTask);
queue.addTask(syncTask);
queue.addTask(asyncTask);

queue.addTask(awaitAsyncTaskFailed);
queue.addTask(syncTaskFailed);
queue.addTask(asyncTaskFailed);

queue.start();
```