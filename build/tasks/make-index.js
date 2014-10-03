/*
 * import sailplanner
 */

'use strict';

var util = require('../util');

function storyData(story) {
	var firstDate = 'zz';
	var dist = 0;
	if ('features' in story) {
		story.features.forEach(function (item) {
			if ('date' in item.properties && firstDate > item.properties.date) {
				firstDate = item.properties.date;
			}

			if ('geometry' in item && item.geometry.type === 'LineString') {
				dist += util.lineDistance(item.geometry.coordinates);
			}
		});
	}

	return {
		date: firstDate !== 'zz' ? firstDate : undefined,
		distance: dist
	};
}

module.exports = function (grunt) {


	grunt.registerTask('makeindex', 'Update index', function () {
		var filename = 'data/index.json';

		var index = grunt.file.readJSON(filename);

		var logs = index.logs;

		var files = grunt.file.expand('data/*.geojson');
		files.forEach(function (storyFilename) {
			var story = grunt.file.readJSON(storyFilename);
			if (!(story.id in logs)) {
				logs[story.id] = {
					visible: false
				};
			}
			var item  =	logs[story.id];

			var data = storyData(story);

			item.title = story.properties.title;
			item.date = data.date;
			item.distance = data.distance;

		});
		grunt.file.write(filename, util.stringify(index));
	});
};


