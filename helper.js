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

	/*
	 * Looks in data/[]/orig/ for JPG files and generates
	 * a thumb and a bigger image from the original, leafing the
	 * original untouched.
	 */
	var thumbs = function () {
		var thumb = require('node-thumbnail').thumb;

		var prefix = __dirname + '/data/';

		var queue = [];
		fs.readdirSync(prefix).forEach(function (filename) {
			if (!fs.statSync(prefix + filename).isDirectory()) {
				return;
			}

			var origDir = prefix + filename + '/orig';
			if (!fs.existsSync(origDir)) {
				return;
			}
			if (fs.statSync(origDir).isDirectory()) {
				queue.push(filename);
			}
		});

		queue.forEach(function (item) {
			var source = prefix + item + '/orig';
			var destination = prefix + item;

			thumb({
				source: source,
				destination: destination,
				suffix: '.thumb',
				width: 200
			}, function () {
				console.log('All thumbs for ' + item + ' done!');
			});


			thumb({
				source: source,
				destination: destination,
				suffix: '',
				width: 1000
			}, function () {
				console.log('All big versions for for ' + item + ' done!');
			});

		});
	};

	var convertSailplanner = function (key) {
		var http = require('http');
		var url = 'http://sailplanner.nl/getLegs/key:' + key;

		http.get(url, function (res) {
			var data = '';

			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on('end', function () {
				var json = JSON.parse(data);
				var out = {
					title: json.data.options.comment,
					originalURL: json.url,
					legs: []
				};

				json.data.legs.forEach(function (leg) {
					out.legs.push({
						title: leg.options.comment,
						color: leg.options.color,
						path: leg.path,
						text: ''
					});
				});

				var filename = __dirname + '/data/' + key + '.json';
				fs.writeFile(filename, JSON.stringify(out, null, '\t'), function (err) {
					if (err) {
						throw err;
					}
					console.log('Saved sailplanner to saillog json format in ' + filename);
				});

			});
		}).on('error', function (event) {
			console.log('Got error: ' + event.message);
		});
	};

	if (process.argv.length > 2) {
		switch (process.argv[2]) {
		case 'compress':
			compress(process.argv[3]);
			break;
		case 'thumbs':
			thumbs();
			break;
		case 'convert':
			convertSailplanner(process.argv[3]);
			break;
		default:
			console.error('Unknown action:', process.argv[2]);
		}
	} else {
		console.log('Please choose an action');
	}
})();