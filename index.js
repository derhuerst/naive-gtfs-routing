'use strict'

const schedulesAt = require('./schedules-at.json')
const schedules = require('./schedules.json')
const services = require('./services.json')
const servicesByTrip = require('./services-by-trip.json')

const addTaskWithPriority = require('./lib/add-task-with-priority')
const segmentToJourney = require('./lib/segment-to-journey')

const hasProp = Object.prototype.hasOwnProperty
const is = v => v !== null && v !== undefined
const isObj = o => o !== null && 'object' === typeof o && !Array.isArray(o)

const defaults = {
	transferDuration: 30,
	maxTransfers: 3,
	maxDuration: 2 * 60 * 60,
	results: 10
}

const computeJourneys = (origin, destination, start, opt = {}) => {
	if (!is(origin)) throw new Error('missing origin.')
	if (!is(destination)) throw new Error('missing destination.')
	if ('number' !== typeof start) throw new Error('start must be a number.')
	if (!isObj(opt)) throw new Error('opt must be an object.')
	opt = Object.assign({}, defaults, opt)

	const firstSegment = {
		first: true,

		stop: origin,
		arrival: start - opt.transferDuration,
		duration: 0,
		tripId: null,

		timeLeft: opt.maxDuration,
		transfers: 0,
		blacklist: [origin],
		prevSegment: null
	}

	const queue = [[0, firstSegment]]
	const results = []

	const checkConnection = (s, sched, fromI, toI) => {
		const stop = sched.stops[toI]

		const depRelative = sched.departures[fromI]
		const arrRelative = sched.arrivals[toI]
		const duration = arrRelative - depRelative
		if (duration > s.timeLeft) return null

		for (let tripId in sched.tripOffsets) {
			if (!hasProp.call(sched.tripOffsets, tripId)) continue
			if (tripId === s.tripId) continue // don't visit twice

			const offset = sched.tripOffsets[tripId]
			const days = services[servicesByTrip[tripId]]
			for (let day of days) {
				// todo: optimise, because `days` is sorted

				const dep = day + offset + depRelative
				if (dep < (s.arrival + opt.transferDuration)) continue
				const arr = day + offset + arrRelative
				if (arr > (start + opt.maxDuration)) continue
				const sinceLastArr = arr - (s.first ? start : s.arrival)
				if (sinceLastArr > s.timeLeft) continue

				let blacklist = s.blacklist
				if (!blacklist.includes(stop)) blacklist = blacklist.concat(stop)

				const nextSegment = {
					stop,
					arrival: arr,
					duration,
					tripId,

					timeLeft: s.timeLeft - sinceLastArr,
					transfers: s.transfers + 1,
					blacklist,
					prevSegment: s,

					// additonal info for segmentToJourney
					schedule: sched
				}

				if (stop === destination) results.push(nextSegment)
				else if (nextSegment.transfers <= opt.maxTransfers) {
					const prio = s.transfers / opt.maxTransfers
					const i = addTaskWithPriority(queue, prio, nextSegment)
				}
			}
		}
	}

	const stopsVisited = Object.create(null) // timestamps, by stop ID

	while (queue.length > 0 && results.length < opt.results) {
		const s = queue.shift()[1]
		if (stopsVisited[s.stop] && stopsVisited[s.stop] < s.arrival) continue
		stopsVisited[s.stop] = s.arrival

		for (let schedId of schedulesAt[s.stop]) {
			const sched = schedules[schedId]

			const stopI = sched.stops.indexOf(s.stop)
			if (stopI === (sched.stops.length - 1)) continue // last stop

			const destI = sched.stops.indexOf(destination)
			if (destI > stopI) checkConnection(s, sched, stopI, destI)

			for (let i = stopI + 1; i < sched.stops.length; i++) {
				if (destI === i) continue
				if (s.blacklist.includes(sched.stops[i])) continue
				checkConnection(s, sched, stopI, i)
			}
		}
	}

	for (let i = 0; i < results.length; i++) {
		results[i] = segmentToJourney(results[i])
	}
	return results
}

module.exports = computeJourneys
