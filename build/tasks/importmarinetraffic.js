/*
 * import track from marinetraffic.
 *
 * Keeps a cache in cachePath
 */

var cachePath = 'data/dump/';

module.exports = function (grunt) {
	'use strict';

	var _ = require('underscore');

	var util = require('../util');
	var marinetraffic = require('../../marinetraffic/index.js');
	var mmsi = require('../mmsi');

	var name2mmsi = function (name) {
		if (!name || name.length === 0) {
			grunt.fail.fatal('Supply MMSI or known name (task:<mmsi>)');
		}
		return mmsi.name2mmsi(name);
	};

	var date = util.getDate();

	grunt.registerTask('dump-marinetraffic', 'Dump track from marinetraffic.', function (vessel) {
		vessel = name2mmsi(vessel);

		var done = this.async();
		var filename = cachePath + vessel + '-' + date + '-cache.json';

		grunt.log.writeln('Importing from marinetraffic...');

		marinetraffic(vessel, function (err, result) {
			if (err) {
				done(err);
			}
			// if filename exists, merge.
			if (grunt.file.exists(filename)) {
				grunt.log.writeln(' - merging with existing file ' + filename);
				result.union(grunt.file.readJSON(filename));
			} else {
				grunt.log.writeln(' - created file: ' + filename);
			}

			grunt.file.write(filename, util.stringify(result.raw));
			grunt.log.writeln(' - wrote ' + result.raw.length + ' points.');
			done();
		});
	});

	grunt.registerTask('merge-marinetraffic', 'Merge marinetraffic files dumped by dump-marinetraffic', function (vessel) {
		vessel = name2mmsi(vessel);

		var files = grunt.file.expand(cachePath + '/' + vessel + '-*-cache.json');
		grunt.log.writeln('Merging ' + files.length + ' files...');

		var result = marinetraffic.fromJson([]);
		files.forEach(function (cache) {
			result.union(grunt.file.readJSON(cache));
		});

		var geojson = result.toGeoJson({
			speedThreshold: grunt.option('threshold') || 0.51
		});

		var prefix = cachePath + vessel + '-combined';

		grunt.file.write(prefix + '.json', util.stringify(result.raw));
		grunt.file.write(prefix + '.geojson', util.stringify(geojson));

		console.log('Wrote to ' + prefix + '.json / ' + prefix + '.geojson with ' + result.raw.length + ' trkpts');
	});

	grunt.registerTask('import-marinetraffic', 'import marinetraffic into geojson file', function (vessel) {
		vessel = name2mmsi(vessel);

		var srcFile = cachePath + vessel + '-combined.geojson';
		var targetFile = 'data/' + mmsi.mmsi2datafile(vessel);

		if (!grunt.file.exists(srcFile)) {
			grunt.fail.fatal('Source file does not exists: ' + srcFile);
		}
		var src = grunt.file.readJSON(srcFile);

		if (!grunt.file.exists(targetFile)) {
			src.title = mmsi.mmsi2name(vessel);

			src.features.forEach(function (value, key) {
				_.extend(src.features[key].properties, {
					title: 'marinetraffic imported',
					text: '',
					date: util.getDate(value.properties.startTime)
				});
			});
			grunt.file.write(targetFile, util.stringify(src));
			grunt.log.writeln('Created ' + targetFile);
			return;
		}

		// target file exists, extend it with the new tracks.
		var json = grunt.file.readJSON(targetFile);

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
				_.extend(source.properties, {
					title: 'marinetraffic imported',
					text: '',
					date: util.getDate(source.properties.startTime)
				});

				json.features.push(source);
			}
			matched = false;
		});

		grunt.file.write(targetFile, util.stringify(json));
		grunt.log.writeln('Updated ' + targetFile);
	});

};