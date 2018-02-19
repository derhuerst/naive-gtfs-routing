# naive-gtfs-routing

**A naive routing engine for [GTFS](https://developers.google.com/transit/gtfs/) data.**

[![npm version](https://img.shields.io/npm/v/naive-gtfs-routing.svg)](https://www.npmjs.com/package/naive-gtfs-routing)
[![build status](https://api.travis-ci.org/derhuerst/naive-gtfs-routing.svg?branch=master)](https://travis-ci.org/derhuerst/naive-gtfs-routing)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/naive-gtfs-routing.svg)
[![chat with me on Gitter](https://img.shields.io/badge/chat%20with%20me-on%20gitter-512e92.svg)](https://gitter.im/derhuerst)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)


## Installing

Because this project is still a work in progress, you have to build the index by yourself.

```shell
git clone https://gtihub.com/derhuerst/naive-gtfs-routing.git
cd naive-gtfs-routing
npm install
npm run build
```


## Usage

```js
const computeJourneys = require('naive-gtfs-routing')

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
```


## Contributing

If you have a question or have difficulties using `naive-gtfs-routing`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/naive-gtfs-routing/issues).
