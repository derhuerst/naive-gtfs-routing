'use strict'

const {inspect} = require('util')

const computeJourneys = require('.')

const berlin = 'FLIXBUS:1'
const stockholm = 'FLIXBUS:3978'
const oberstdorf = 'FLIXBUS:101'
const when = 1523037600 // 2018-04-06T18:00:00.000Z
const opt = {
	maxTransfers: 2,
	maxDuration: 2 * 24 * 60 * 60
}

const journeys = computeJourneys(stockholm, oberstdorf, when, opt)

for (let journey of journeys) {
	console.log({
		origin: journey.origin,
		departure: journey.departure,
		destination: journey.destination,
		arrival: journey.arrival,
		legs: journey.legs.map(l => l.tripId)
	})
}
