/*
 * import sailplanner
 */

module.exports = function (grunt) {
	'use strict';

	var util = require('../util');
	var polyUtil = require('polyline-encoded');
	var http = require('http');

	grunt.registerTask('import-sailplanner', 'Import sailplanner url.', function (key) {
		if (!key || key.length === 0) {
			grunt.fail.fatal('Supply key to import (grunt import-sailplanner:<key>)');
		}
		var url = 'http://sailplanner.nl/getLegs/key:' + key;
		var filename = 'data/' + key + '.geojson';

		grunt.log.writeln('Importing from ' + url + '...');

		var done = this.async();

		http.get(url, function (res) {
			var data = '';

			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on('end', function () {
				var json = JSON.parse(data);
				var features = [];

				if (json.success === false) {
					grunt.fail.fatal('Sailplanner.nl replied: ' + json.message);
					return;
				}

				json.data.legs.forEach(function (leg) {
					if (leg.options.comment) {
						leg.options.title = leg.options.comment;
						delete leg.options.comment;
					}
					// throw away stuff we do not need.
					delete leg.options.geodesic;
					delete leg.options.opacity;
					delete leg.options.width;
					delete leg.options.speed;

					features.push({
						type: 'Feature',
						geometry: {
							type: 'LineString',
							coordinates: util.swap(polyUtil.decode(leg.path))
						},
						properties: leg.options
					});
				});


				grunt.file.write(filename,
					util.stringify({
						type: 'FeatureCollection',
						options: {
							title: json.data.options.comment,
							originalURL: json.url
						},
						features: features
					})
				);

				grunt.log.writeln('...saved to geoJSON in ' + filename);

				done();
			});
		}).on('error', function (event) {
			grunt.fail.fatal('HTTP error: ' + event.message);
			done(false);
		});
	});


};
