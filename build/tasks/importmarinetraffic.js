/*
 * import track from marinetraffic
 */

module.exports = function (grunt) {
	'use strict';

	var fs = require('fs');
	var http = require('http');
	var util = require('../util');

	var name2mmsi = function (name) {
		if (!name || name.length < 1) {
			return null;
		}
		var list = fs.readFileSync('data/mmsi.csv', 'utf8')
			.split('\n')
			.map(function (item) { return item.trim().split(','); });

		for (var i in list) {
			var n = list[i][1];
			if (name === n || name === n.toLowerCase()) {
				return list[i][0];
			}
		}
		return name;
	};

	var toGeojson = function (json) {
		var features = [];
		var lineCoords = [];

		json.forEach(function (value) {
			features.push({
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: util.swap(value.latlng)
				},
				properties: {
					speed: value.speed,
					course: value.course,
					timestamp: value.timestamp
				}
			});
			lineCoords.push(util.swap(value.latlng));
		});

		features.push({
			type: 'Feature',
			geometry: {
				type: 'LineString',
				coordinates: lineCoords,
			},
			properties: {}
		});

		return {
			type: 'FeatureCollection',
			features: features
		};
	};

	grunt.registerTask('import-marinetraffic', 'Import track from marinetraffic.', function (mmsi) {
		if (!mmsi || mmsi.length === 0) {
			grunt.fail.fatal('Supply MMSI to import (grunt import-marinetraffic:<mmsi>)');
		}
		mmsi = name2mmsi(mmsi);

		var url = 'http://www.marinetraffic.com/ais/gettrackxml.aspx?mmsi=' + mmsi + '&date=&id=null';
		var unix = Math.round(+new Date() / 1000);
		var filename = 'data/' + mmsi + '-' + unix + '.trk';

		grunt.log.writeln('Importing from ' + url + '...');

		var done = this.async();

		http.get(url, function (res) {
			var data = '';

			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on('end', function () {
				util.marinetraffic2json(data, function (err, result) {
					grunt.file.write('test.json', JSON.stringify(result, null, 2));
					grunt.file.write('test.geojson', JSON.stringify(toGeojson(result), null, 2));
					done();
				});
			});
		}).on('error', function (event) {
			grunt.fail.fatal('HTTP error: ' + event.message);
			done(false);
		});
	});


};