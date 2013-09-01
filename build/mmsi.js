'use strict';

var fs = require('fs');

var list = fs.readFileSync('data/mmsi.csv', 'utf8')
	.split('\n')
	.map(function (item) {
		if (item[0] === '#') {
			return;
		} else {
			return item.trim().split(',');
		}
	}).filter(function (item) { return item && item.length >= 2; });

module.exports = {
	get: function (mmsi) {
		return list.filter(function (item) {
			return item[0] === mmsi;
		})[0];
	},

	name2mmsi: function (name) {
		var vessel = list.filter(function (item) {
			return item[1] === name || item[1].toLowerCase() === name;
		})[0];

		return vessel ? vessel[0] : name;
	},

	mmsi2name: function (mmsi) {
		return this.get(mmsi)[1];
	},

	mmsi2datafile: function (mmsi) {
		var vessel = this.get(mmsi);

		if (vessel) {
			return vessel[2] ? vessel[2] : vessel[1] + '.geojson';
		} else {
			return mmsi + '.geojson';
		}
	}
};