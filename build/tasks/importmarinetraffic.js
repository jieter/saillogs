/*
 * import track from marinetraffic
 */

module.exports = function (grunt) {
	'use strict';

	var http = require('http');
	var util = require('../util');

	grunt.registerTask('import-marinetraffic', 'Import track from marinetraffic.', function (mmsi) {
		if (!mmsi || mmsi.length === 0) {
			grunt.fail.fatal('Supply MMSI to import (grunt import-marinetraffic:<mmsi>)');
		}
		mmsi = util.name2mmsi(mmsi);

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
				grunt.file.write(filename, data);

				util.marinetraffic2json(data, function (err, result) {
					grunt.file.write('test.json', JSON.stringify(result, null, 2));
					grunt.file.write('test.geojson', JSON.stringify(util.toGeojson(result), null, 2));
					done();
				});
			});
		}).on('error', function (event) {
			grunt.fail.fatal('HTTP error: ' + event.message);
			done(false);
		});
	});


};