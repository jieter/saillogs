/*
 * Helper script to create
 */
//jshint node:true

var fs = require('fs');

(function () {
	'use strict';

	var formatNum = function (num, digits) {
		var pow = Math.pow(10, digits || 5);
		return Math.round(num * pow) / pow;
	};


	var compress = function (filename) {
		if (!filename || filename.length === 0) {
			console.error('Please provide a name to compress...');
			process.exit();
		}

		console.log('Compressing ' + filename);

		fs.readFile(__dirname + '/' + filename, 'utf8', function (error, data) {
			if (error) {
				console.log('Error: ' + error);
				return;
			}

			data = JSON.parse(data);
			for (var i in data.legs) {
				if (data.legs[i].path && (typeof data.legs[i].path) !== 'string') {
					for (var j in data.legs[i].path) {
						data.legs[i].path[j] = [
							formatNum(data.legs[i].path[j][0], 5),
							formatNum(data.legs[i].path[j][1], 5)
						];
					}
					console.log(data.legs[i].date, JSON.stringify(data.legs[i].path));
					console.log();
				}
			}
		});
	};

	// generate thumbnails for all pics with a .thumb suffix.
	var thumbs = function () {

	};

	if (process.argv.length > 2) {
		switch (process.argv[2]) {
		case 'compress':
			compress(process.argv[3]);
			break;
		case 'thumbs':
			thumbs();
			break;
		default:
			console.error('Unknown action:', process.argv[2]);
		}
	} else {
		console.log('Please choose an action');
	}
})();