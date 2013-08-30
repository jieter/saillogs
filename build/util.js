/*
 * Saillog build scripts util functions
 *
 */

(function () {
	'use strict';

	var fs = require('fs');

	var util = {
		formatNum: function (num, digits) {
			var pow = Math.pow(10, digits || 5);
			return Math.round(num * pow) / pow;
		},

		// return average for array of numbers,
		// or, if key is defined, for key in array of objects.
		average: function (array, key) {
			return array.reduce(function (a, b) {
				if (key) {
					return a + b[key];
				} else {
					return a + b;
				}
			}, 0) / array.length;
		},

		timeDiff: function (a, b) {
			return Math.abs((new Date(a) - new Date(b)) / 1000);
		},

		// swap x/y for geojson
		swap: function (array) {
			if (array.length === 2 && typeof array[0] === 'number') {
				return [array[1], array[0]];
			} else {
				var ret = [];
				array.forEach(function (value) {
					ret.push(util.swap(value));
				});
				return ret;
			}
		},

		/* Passes a minimal json representation of the marinetraffic XML to the callback.
		 * [{
		 *   latlng: [<>, <>],
		 *   speed: <>, // knots,
		 *   course: <>, // degrees
		 *   timestamp: "<>"
		 * }, {...}]
		 */
		marinetraffic2json: function (xml, callback) {
			require('xml2js').parseString(xml, function (err, result) {
				if (err) {
					callback(err, result);
					return;
				}
				if (!result.TRACK || !result.TRACK.POS) {
					callback(new Error('Unexpected xml contents'));
					return;
				}

				var track = [];
				result.TRACK.POS.forEach(function (point) {
					point = point.$;
					track.push({
						latlng: [parseFloat(point.LAT), parseFloat(point.LON)],
						speed: parseInt(point.SPEED, 10) / 10,
						course: parseInt(point.COURSE, 10),
						timestamp: point.TIMESTAMP
					});
				});

				callback(null, track);
			});
		},

		mmsiList: function (mmsi) {
			var list = fs.readFileSync('data/mmsi.csv', 'utf8')
				.split('\n')
				.map(function (item) {
					if (item[0] === '#') {
						return;
					} else {
						return item.trim().split(',');
					}
				}).filter(function (item) { return item && item.length >= 2; });

			if (mmsi) {
				return list.filter(function (item) {
					return item[0] === mmsi;
				})[0];
			} else {
				return list;
			}
		},

		name2mmsi: function (name) {
			if (!name || name.length < 1) {
				return name;
			}

			var vessel = util.mmsiList().filter(function (item) {
				return item[1] === name || item[1].toLowerCase() === name;
			})[0];

			if (vessel) {
				return vessel[0];
			} else {
				return name;
			}
		},

		mmsi2name: function (mmsi) {
			return util.mmsiList(mmsi)[1];
		},

		mmsi2datafile: function (mmsi) {
			var vessel = util.mmsiList(mmsi);

			if (vessel) {
				return vessel[2] ? vessel[2] : vessel[1] + '.geojson';
			} else {
				return mmsi + '.geojson';
			}
		},

		gjPoint: function (latlng, properties) {
			return {
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: util.swap(latlng)
				},
				properties: properties || {}
			};
		},

		gjLineString: function (latlngs, properties) {
			return {
				type: 'Feature',
				geometry: {
					type: 'LineString',
					coordinates: util.swap(latlngs),
				},
				properties: properties || {}
			};
		},

		points2lineString: function (points) {
			var latlngs = points.map(function (v) {
				return v.latlng;
			});

			var startTime = points[0].timestamp;
			var endTime = points[points.length - 1].timestamp;

			return util.gjLineString(latlngs, {
				'avg_sog': util.formatNum(util.average(points, 'speed'), 2),
				'avg_cog': Math.round(util.average(points, 'course')),
				'startTime': startTime,
				'endTime': endTime,
				'duration': util.timeDiff(endTime, startTime)
			});
		},


		toGeojson: function (json) {
			var options = {
				points: false,
				timeThreshold: 2 * 60 * 60 // 2h split = new leg.
			};
			var features = [];

			var prev, splitHere, lastPt;
			var line = [];

			json.forEach(function (value, key) {
				line.push(value);

				splitHere = prev ? util.timeDiff(prev.timestamp, value.timestamp) > options.timeThreshold : false;
				lastPt = (key === json.length - 1);

				if (line.length > 0 && (splitHere || lastPt)) {
					features.push(util.points2lineString(line));
					line = [];
				}

				prev = value;
			});

			return {
				type: 'FeatureCollection',
				features: features
			};
		},

		stringify: function (obj) {
			return JSON.stringify(obj, null, '\t');
		}
	};
	module.exports = util;
})();