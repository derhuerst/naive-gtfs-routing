'use strict'

const formatDate = t => new Date(t * 1000) + ''

const segmentToJourney = (segment) => {
	// build segments list
	const segments = []
	let s = segment
	while (s) {
		if (s.prevSegment === s) {
			throw new Error('prevSegment has a circular reference.')
		}
		segments.unshift(s)
		s = s.prevSegment
	}
	if (segments.length < 2) throw new Error('at least 2 segments necessary.')

	// fix arrival of first segment
	segments[0] = Object.assign({}, segments[0]) // clone
	segments[0].arrival = segments[1].arrival - segments[1].duration

	const journey = {
		legs: [],
		origin: null,
		departure: null,
		destination: null,
		arrival: null
	}

	for (let i = 1; i < segments.length; i++) {
		const s = segments[i]

		const leg = {
			origin: segments[i - 1].stop, // todo: stop object
			departure: formatDate(s.arrival - s.duration),
			destination: s.stop, // todo: stop object
			arrival: formatDate(s.arrival),
			tripId: s.tripId,
			passed: []
		}

		leg.passed.push({
			station: leg.origin,
			departure: leg.departure
		})

		const sched = s.schedule
		const originI = sched.stops.indexOf(leg.origin)
		const destinationI = sched.stops.indexOf(leg.destination)
		for (let i = originI + 1; i < destinationI; i++) {
			leg.passed.push({
				station: sched.stops[i],
				arrival: formatDate(sched.arrivals[i]),
				departure: formatDate(sched.departures[i])
			})
		}

		leg.passed.push({
			station: leg.destination,
			arrival: leg.arrival
		})

		journey.legs.push(leg)
	}

	// add shorthands
	const lastLeg = journey.legs[journey.legs.length - 1]
	journey.origin = journey.legs[0].origin || null
	journey.departure = journey.legs[0].departure || null
	journey.destination = lastLeg.destination || null
	journey.arrival = lastLeg.arrival || null

	return journey
}

module.exports = segmentToJourney
