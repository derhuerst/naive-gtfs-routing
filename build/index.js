'use strict'

const path = require('path')
const readCsv = require('gtfs-utils/read-csv')
const readTrips = require('gtfs-utils/read-trips')
const readServices = require('gtfs-utils/read-services-and-exceptions')
const computeSchedules = require('gtfs-utils/compute-schedules')
const fs = require('fs')

const dataDir = process.env.SAMPLE_FEED === 'true'
	? path.dirname(require.resolve('sample-gtfs-feed/gtfs/stops.txt'))
	: __dirname
console.info('using data from', dataDir)

const writeJSON = (file, data) => new Promise((resolve, reject) => {
	data = JSON.stringify(data)
	fs.writeFile(path.join(__dirname, '..', file), data, (err) => {
		if (err) reject(err)
		else resolve()
	})
})

const readFile = file => readCsv(path.join(dataDir, file + '.txt'))

const noFilters = {}

// todo: more compact storage markup
;(async () => {
	console.info('trip ID => service ID – services-by-trip.json')

	const servicesByTrip = await readTrips(readFile, () => true)
	for (let id of Object.keys(servicesByTrip)) {
		servicesByTrip[id] = servicesByTrip[id].service_id
	}
	await writeJSON('services-by-trip.json', servicesByTrip)

	console.info('service ID => days – services.json')

	const services = await readServices(readFile, 'Europe/Berlin')
	await writeJSON('services.json', services)

	console.info('schedule ID => schedule – schedules.json')

	const schedules = await computeSchedules(readFile, noFilters)
	for (let id of Object.keys(schedules)) {
		const schedule = schedules[id]

		const tripOffsets = {}
		for (let ref of schedule.trips) tripOffsets[ref.tripId] = ref.start
		schedule.tripOffsets = tripOffsets
		delete schedule.trips
	}

	await writeJSON('schedules.json', schedules)

	console.info('stop ID => schedule ID – schedules-at.json')

	const schedulesAt = Object.create(null)
	for (let id of Object.keys(schedules)) {
		const schedule = schedules[id]

		for (let stopId of schedule.stops) {
			const ids = schedulesAt[stopId]
			if (!ids) schedulesAt[stopId] = [id]
			else if (!ids.includes(id)) ids.push(id)
		}
	}

	await writeJSON('schedules-at.json', schedulesAt)
})()
.catch((err) => {
	console.error(err)
	process.exitCode = 1
})
