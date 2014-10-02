/*
 * import sailplanner
 */

module.exports = function (grunt) {
	'use strict';

	var util = require('../util');

	grunt.registerTask('makeindex', 'Update index', function () {
		var filename = 'data/index.json';

		var index = grunt.file.readJSON(filename);

		var logs = index.logs;

		var files = grunt.file.expand('data/*.geojson');
		files.forEach(function (storyFilename) {
			var story = grunt.file.readJSON(storyFilename);
			if (!(story.id in logs)) {
				logs[story.id] = {
					"visible": false
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

function storyData (story) {
	var firstDate = 'zz';
	var dist = 0;
	if ('features' in story) {
		story.features.forEach(function(item) {
			if ('date' in item.properties && firstDate > item.properties.date) {
				firstDate = item.properties.date;
			}

			if ('geometry' in item && item.geometry.type === 'LineString') {
				dist += lineDistance(item.geometry.coordinates);
			}
		});

	}

	return {
		date: firstDate !== 'zz' ? firstDate : undefined,
		distance: dist
	};
}

function lineDistance (coords) {
	if (coords.length < 2) {
		return 0;
	}

	var distance = 0;
	for (var i = 1; i < coords.length; i++) {
		distance += distanceAB(coords[i - 1], coords[i]);
	}

	return Math.round(distance / 1852);
};

function numberToRadius (number) {
    return number * Math.PI / 180;
}
function distanceAB (pt1, pt2) {
    var lon1 = pt1[0],
      lat1 = pt1[1],
      lon2 = pt2[0],
      lat2 = pt2[1],
      dLat = numberToRadius(lat2 - lat1),
      dLon = numberToRadius(lon2 - lon1),
      a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(numberToRadius(lat1))
        * Math.cos(numberToRadius(lat2)) * Math.pow(Math.sin(dLon / 2), 2),
      c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (6371 * c) * 1000; // returns meters
 }
