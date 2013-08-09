/*
 * grunt-geojson-swap
 * swap geojson coords.
 *
 * TODO: recurse into featureCollections.
 *
 * jshint: node:true
 */

module.exports = function (grunt) {
	'use strict';

	var util = require('../util');

	grunt.registerTask('geojson-swap', 'Swap coords in geojson files.', function (file) {
		if (!file || file.length === 0) {
			grunt.fail.fatal('No filename supplied');
		}

		grunt.log.debug('Swapping "' + file + '"...');

		var json = grunt.file.readJSON(file);

		json.features.forEach(function (feature, key) {
			json.features[key].geometry.coordinates = util.swap(feature.geometry.coordinates);
		});

		grunt.file.write(file, JSON.stringify(json, null, '\t'));
	});
};