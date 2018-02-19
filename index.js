'use strict'

const schedulesAt = require('./schedules-at.json')
const schedules = require('./schedules.json')
const services = require('./services.json')
const servicesByTrip = require('./services-by-trip.json')

const MAX_DURATION = 3600
const TRANSFER_DURATION = 30

const hasProp = Object.prototype.hasOwnProperty

const computeJourneys = (origin, destination, start) => {
	const results = []
	const queue = [{
		first: true,

		stop: origin,
		arrival: start - TRANSFER_DURATION,
		duration: 0,
		tripId: null,

		timeLeft: MAX_DURATION,
		transfers: 0,
		blacklist: [origin],
		prevSegment: null
	}]

	const stopsVisited = Object.create(null) // by ID

	const checkConnection = (s, sched, fromI, toI) => {
		const stop = sched.stops[toI]
		if (stopsVisited[sched.id + '\xff' + stop]) return null
		stopsVisited[stop] = true

		const depRelative = sched.departures[fromI]
		const arrRelative = sched.arrivals[toI]
		const duration = arrRelative - depRelative
		if (duration > MAX_DURATION) return null

		for (let tripId in sched.tripOffsets) {
			if (!hasProp.call(sched.tripOffsets, tripId)) continue
			if (tripId === s.tripId) continue // don't visit twice

			const offset = sched.tripOffsets[tripId]
			const days = services[servicesByTrip[tripId]]
			for (let day of days) {
				// todo: optimise, because `days` is sorted

				const dep = day + offset + depRelative
				if (dep < (s.arrival + TRANSFER_DURATION)) continue

				const arr = day + offset + arrRelative
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
					prevSegment: s
				}

				if (stop === destination) results.push(nextSegment)
				else queue.push(nextSegment)
			}
		}
	}

	// todo: priority queue
	while (queue.length > 0) {
		const s = queue.shift()
		for (let schedId of schedulesAt[s.stop]) {
			const sched = schedules[schedId]

			const stopI = sched.stops.indexOf(s.stop)
			if (stopI === (sched.stops.length - 1)) continue // last stop

			const destI = sched.stops.indexOf(destination)
			if (destI > stopI) checkConnection(s, sched, stopI, destI)

			for (let i = stopI + 1; i < sched.stops.length; i++) {
				if (destI === i) continue
				// todo: estimate priority by duration & GPS distance
				checkConnection(s, sched, stopI, destI)
			}
		}
	}

	return results
}

module.exports = computeJourneys
