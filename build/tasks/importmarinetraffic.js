/*
 * import track from marinetraffic
 */

module.exports = function (grunt) {
	'use strict';

	var fs = require('fs');
	var http = require('http');
	var util = require('../util');
	var async = grunt.util.async;

	var unix = Math.round(+new Date() / 1000);

	grunt.registerTask('dump-marinetraffic', 'Dump track from marinetraffic.', function (mmsi) {
		if (!mmsi || mmsi.length === 0) {
			grunt.fail.fatal('Supply MMSI to dump (grunt dump-marinetraffic:<mmsi>)');
		}
		mmsi = util.name2mmsi(mmsi);

		var url = 'http://www.marinetraffic.com/ais/gettrackxml.aspx?mmsi=' + mmsi + '&date=&id=null';
		var filename = 'data/dump/' + mmsi + '-' + unix + '.trk';

		grunt.log.writeln('Importing from ' + url + '...');

		var done = this.async();

		http.get(url, function (res) {
			var data = '';

			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on('end', function () {
				grunt.file.write(filename, data);
				grunt.log.writeln('Dumped to ' + filename);

				done();
			});
		}).on('error', function (event) {
			grunt.fail.fatal('HTTP error: ' + event.message);
			done(false);
		});
	});

	grunt.registerTask('merge-marinetraffic', 'Merge marinetraffic files dumped by dump-marinetraffic', function (mmsi) {
		if (!mmsi || mmsi.length === 0) {
			grunt.fail.fatal('Supply MMSI to merge (grunt merge-marinetraffic:<mmsi>)');
		}
		mmsi = util.name2mmsi(mmsi) + '';

		// only save moving points
		var threshold = grunt.option('threshold') || 0.2;

		var path = 'data/dump/';
		var data = {};

		var done = this.async();

		var files = fs.readdirSync(path).filter(function (item) {
			return item.substring(0, mmsi.length) === mmsi && item.substr(-3) === 'trk';
		});
		grunt.log.writeln('Merging ' + files.length + 'files with threshold ' + threshold + 'kts...');

		async.forEach(files, function (filename, callback) {
			util.marinetraffic2json(fs.readFileSync(path + filename, 'utf8'), function (err, result) {
				console.log(filename, result.length);
				result.forEach(function (value) {
					data[value.timestamp] = value;
				});
				callback();
			});
		}, function (error) {
			if (error) {
				return done(error);
			}

			var ret = [];
			for (var i in data) {
				if (data[i].speed < threshold) {
					continue;
				}
				ret.push(data[i]);
			}

			var filename = path + mmsi + unix + '-combined';
			grunt.file.write(filename + '.json', util.stringify(ret));
			grunt.file.write(filename + '.geojson', util.stringify(util.toGeojson(ret)));

			console.log('Wrote to ' + filename + '.(geo)json with ' + ret.length + ' trkpts');

			done();
		});

	});

};