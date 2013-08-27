/*
 * import track from marinetraffic
 */

module.exports = function (grunt) {
	'use strict';

	var fs = require('fs');
	var http = require('http');
	var util = require('../util');

	var unix = Math.round(+new Date() / 1000);

	grunt.registerTask('import-marinetraffic', 'Import track from marinetraffic.', function (mmsi) {
		if (!mmsi || mmsi.length === 0) {
			grunt.fail.fatal('Supply MMSI to import (grunt import-marinetraffic:<mmsi>)');
		}
		mmsi = util.name2mmsi(mmsi);

		var url = 'http://www.marinetraffic.com/ais/gettrackxml.aspx?mmsi=' + mmsi + '&date=&id=null';
		var filename = 'data/' + mmsi + '-' + unix + '.trk';

		grunt.log.writeln('Importing from ' + url + '...');

		var done = this.async();

		http.get(url, function (res) {
			var data = '';

			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on('end', function () {
				grunt.file.write(filename, data);

				util.marinetraffic2json(data, function (err, result) {
					grunt.file.write('test.json', util.stringify(result));
					grunt.file.write('test.geojson', util.stringify(util.toGeojson(result)));
					done();
				});
			});
		}).on('error', function (event) {
			grunt.fail.fatal('HTTP error: ' + event.message);
			done(false);
		});
	});

	grunt.registerTask('merge-marinetraffic', 'Merge marinetraffic files dumped by import-marinetraffic', function (mmsi) {
		if (!mmsi || mmsi.length === 0) {
			grunt.fail.fatal('Supply MMSI to import (grunt import-marinetraffic:<mmsi>)');
		}
		mmsi = util.name2mmsi(mmsi) + "";


		var done = this.async();
		var data = {};

		var files = fs.readdirSync('data/').filter(function (item) {
			return item.substring(0, mmsi.length) === mmsi && item.substr(-3) === 'trk';
		});
		grunt.log.writeln('Merging ' + files.join(', ') + '...');

		files.forEach(function (filename) {
			util.marinetraffic2json(fs.readFileSync('data/' + filename, 'utf8'), function (err, result) {
				console.log(filename, result.length);
				result.forEach(function (value) {
					data[value.timestamp] = value;
				});
			});
		});

		var ret = [];
		for (var i in data) {
			ret.push(data[i]);
		}


		var filename = 'data/' + mmsi + unix + '-combined';
		grunt.file.write(filename + '.json', util.stringify(ret));
		grunt.file.write(filename + '.geojson', util.stringify(util.toGeojson(ret)));

		console.log(filename, ret.length);
	});

};