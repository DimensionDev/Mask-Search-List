/**
 * Type for a task function that returns a promise with a generic result type
 */
export type Task<T> = () => Promise<T>

/**
 * Error result interface for failed tasks
 */
export interface TaskError {
  error: unknown
}

/**
 * Type guard to check if a result is an error
 */
export function isTaskError(result: unknown): result is TaskError {
  return result !== null && typeof result === 'object' && 'error' in result
}

/**
 * Runs tasks in parallel with a maximum concurrency limit
 *
 * @param tasks - Array of functions that return promises
 * @param concurrencyLimit - Maximum number of tasks to run simultaneously
 * @returns Promise that resolves with an array of all task results
 */
export async function parallelLimit<T>(tasks: Task<T>[], concurrencyLimit: number): Promise<(T | TaskError)[]> {
  if (!Array.isArray(tasks)) {
    throw new Error('Tasks must be an array of functions')
  }

  if (!Number.isInteger(concurrencyLimit) || concurrencyLimit < 1) {
    throw new Error('Concurrency limit must be a positive integer')
  }

  const results: (T | TaskError)[] = new Array(tasks.length)
  const runningTasks: Set<Task<T>> = new Set()
  const taskQueue: Task<T>[] = [...tasks]

  // Helper function to run a task and manage the queue
  async function runTask(taskFn: Task<T>, index: number): Promise<void> {
    try {
      const result: T = await taskFn()
      results[index] = result
    } catch (error: unknown) {
      results[index] = { error }
    } finally {
      runningTasks.delete(taskFn)

      // Get next task from the queue
      if (taskQueue.length > 0) {
        const nextTask = taskQueue.shift()! // Non-null assertion as we check length > 0
        const nextIndex = tasks.indexOf(nextTask)
        runningTasks.add(nextTask)
        runTask(nextTask, nextIndex)
      }
    }
  }

  // Start initial batch of tasks up to the concurrency limit
  const initialBatch = taskQueue.splice(0, concurrencyLimit)
  for (const task of initialBatch) {
    const index = tasks.indexOf(task)
    runningTasks.add(task)
    runTask(task, index)
  }

  // Wait for all tasks to complete
  while (runningTasks.size > 0) {
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  return results
}
