'use strict'

const is = v => v !== null && v !== undefined

const addTaskWithPriority = (queue, prio, task) => {
	if (!queue) throw new Error('missing queue.')
	if ('number' !== typeof prio) throw new Error('priority must be a number.')
	if (!is(task)) throw new Error('missing task.')

	let i
	for (i = 0; i < queue.length; i++) {
		if (prio < queue[i][0]) break
	}

	queue.splice(i, 0, [prio, task])
	return i
}

module.exports = addTaskWithPriority
