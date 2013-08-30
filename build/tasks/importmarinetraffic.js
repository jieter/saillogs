/*
 * import track from marinetraffic
 */

module.exports = function (grunt) {
	'use strict';

	var _ = require('underscore');
	var fs = require('fs');
	var http = require('http');
	var util = require('../util');
	var async = grunt.util.async;

	var unix = Math.round(+new Date() / 1000);

	var dumpPath = 'data/dump/';

	grunt.registerTask('dump-marinetraffic', 'Dump track from marinetraffic.', function (mmsi) {
		if (!mmsi || mmsi.length === 0) {
			grunt.fail.fatal('Supply MMSI to dump (grunt dump-marinetraffic:<mmsi>)');
		}
		mmsi = util.name2mmsi(mmsi);

		var url = 'http://www.marinetraffic.com/ais/gettrackxml.aspx?mmsi=' + mmsi + '&date=&id=null';
		var filename = dumpPath + mmsi + '-' + unix + '.trk';

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
		var threshold = grunt.option('threshold') || 0.51;

		var done = this.async();

		var files = fs.readdirSync(dumpPath).filter(function (item) {
			return item.substring(0, mmsi.length) === mmsi && item.substr(-3) === 'trk';
		});
		grunt.log.writeln('Merging ' + files.length + ' files with threshold ' + threshold + 'kts...');

		var data = {};
		async.forEach(files, function (filename, callback) {
			util.marinetraffic2json(fs.readFileSync(dumpPath + filename, 'utf8'), function (err, result) {
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

			var filename = dumpPath + mmsi + '-' + unix + '-combined';
			grunt.file.write(filename + '.json', util.stringify(ret));
			grunt.file.write(dumpPath + mmsi + '.geojson', util.stringify(util.toGeojson(ret)));

			console.log('Wrote to ' + filename + '.json / ' + dumpPath + mmsi + '.geojson with ' + ret.length + ' trkpts');

			done();
		});
	});

	grunt.registerTask('import-marinetraffic', 'import marinetraffic into geojson file', function (mmsi) {
		if (!mmsi || mmsi.length === 0) {
			grunt.fail.fatal('Supply MMSI to merge (grunt merge-marinetraffic:<mmsi>)');
		}
		mmsi = util.name2mmsi(mmsi) + '';

		var src = JSON.parse(fs.readFileSync(dumpPath + mmsi + '.geojson', 'utf8'));
		var targetFile = 'data/2013-eendracht-papa.geojson';

		if (!fs.existsSync(targetFile)) {
			grunt.write(targetFile, util.stringify(src));
			return;
		}
		var json = JSON.parse(fs.readFileSync(targetFile));

		var within = function (x, lower, upper) {
			return (x && lower && upper) && x > lower && x < upper;
		};

		var matched;
		src.features.forEach(function (source) {
			// try to find a matching startTime in target
			matched = false;
			json.features.forEach(function (target, key) {
				if (source.properties.startTime === target.properties.startTime) {
					// leg startsTimes are equal, replace coords
					json.features[key].geometry.coordinates = source.geometry.coordinates;

					// update leg statistics
					_.extend(json.features[key].properties, source.properties);

					matched = true;
				}
				if (within(source.properties.startTime, target.properties.startTime, target.properties.endTime)) {
					// starts within an existing leg.
					// TODO: merge, skiping for now.
					matched = true;
				}
			});

			if (!matched) {
				var d = new Date(source.properties.startTime);
				_.extend(source.properties, {
					title: 'marinetraffic imported',
					text: '',
					date: d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
				});

				json.features.push(source);
			}
			matched = false;
		});

		grunt.file.write(targetFile, util.stringify(json));
		grunt.log.writeln('Updated ' + targetFile);
	});

};