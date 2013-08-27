/*
 * Saillog build scripts util functions
 *
 */

(function () {
	'use strict';

	var fs = require('fs');

	var util = {
		decode: function (encoded) {
			var len = encoded.length;
			var index = 0;
			var latlngs = [];
			var lat = 0;
			var lng = 0;

			/*jshint bitwise:false */
			while (index < len) {
				var b;
				var shift = 0;
				var result = 0;
				do {
					b = encoded.charCodeAt(index++) - 63;
					result |= (b & 0x1f) << shift;
					shift += 5;
				} while (b >= 0x20);
				var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
				lat += dlat;

				shift = 0;
				result = 0;
				do {
					b = encoded.charCodeAt(index++) - 63;
					result |= (b & 0x1f) << shift;
					shift += 5;
				} while (b >= 0x20);
				var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
				lng += dlng;

				latlngs.push([lat * 1e-5, lng * 1e-5]);
			}
			/*jshint bitwise:true */

			return latlngs;
		},

		formatNum: function (num, digits) {
			var pow = Math.pow(10, digits || 5);
			return Math.round(num * pow) / pow;
		},

		average: function (array) {
			return array.reduce(function (a, b) {
				return a + b;
			}) / array.length;
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
						speed: parseInt(point.SPEED, 10),
						course: parseInt(point.COURSE, 10),
						timestamp: point.TIMESTAMP
					});
				});

				callback(null, track);
			});
		},

		name2mmsi: function (name) {
			var filename = 'data/mmsi.csv';
			if (!name || name.length < 1 || !fs.existsSync(filename)) {
				return name;
			}
			var list = fs.readFileSync(filename, 'utf8')
				.split('\n')
				.map(function (item) {
					if (item[0] === '#') {
						return;
					} else {
						return item.trim().split(',');
					}
				}).filter(function (item) { return item && item.length === 2; });

			for (var i in list) {
				var n = list[i][1];
				if (name === n || name === n.toLowerCase()) {
					return list[i][0];
				}
			}
			return name;
		},

		toGeojson: function (json, points) {
			if (points === undefined) {
				points = false;
			}

			var features = [];
			var lineCoords = [];

			var sogs = [];
			var cogs = [];

			json.forEach(function (value) {
				if (points) {
					features.push({
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: util.swap(value.latlng)
						},
						properties: {
							speed: Math.round(value.speed) / 10,
							course: value.course,
							timestamp: value.timestamp
						}
					});
				}
				lineCoords.push(util.swap(value.latlng));
				sogs.push(value.speed);
				cogs.push(value.course);
			});

			features.push({
				type: 'Feature',
				geometry: {
					type: 'LineString',
					coordinates: lineCoords,
				},
				properties: {
					'avg_sog': Math.round(util.average(sogs)) / 10,
					'avg_cog': Math.round(util.average(cogs))
				}
			});

			return {
				type: 'FeatureCollection',
				features: features
			};
		}
	};
	module.exports = util;
})();