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
	var thumbs = function (dirname) {
		var thumb = require('node-thumbnail').thumb;

		var prefix = __dirname + '/data/';

		var hasOrig = function (dirname) {
			if (!fs.statSync(prefix + dirname).isDirectory()) {
				return false;
			}

			var origDir = prefix + dirname + '/orig';
			if (!fs.existsSync(origDir)) {
				return true;
			}
			return fs.statSync(origDir).isDirectory();
		};

		var queue = [];
		if (dirname) {
			if (hasOrig(dirname)) {
				console.log('Create pics for log ' + dirname + '...');
				queue.push(dirname);
			} else {
				console.log('No such log ' + dirname)
			}
		} else {
			// just process all
			fs.readdirSync(prefix).forEach(function (dirname) {
				if (hasOrig(dirname)) {
					queue.push(dirname);
				}
			});
			console.log('Create pics for all originals (' + queue.join(', ') + ')...')
		}


		queue.forEach(function (item) {
			var source = prefix + item + '/orig';
			var destination = prefix + item;

			thumb({
				source: source,
				destination: destination,
				quiet: true,
				suffix: '.thumb',
				width: 200
			}, function () {
				console.log('... done.');
			});

			thumb({
				source: source,
				destination: destination,
				quiet: true,
				suffix: '',
				width: 1000
			});

		});
	};

	var lint = function () {
		var clean = true;
		var JSONLint = require('json-lint');
		var prefix = __dirname + '/data/';
		fs.readdirSync(prefix).forEach(function (file) {
			if (file.substr(-5) == '.json') {
				var lint = JSONLint(fs.readFileSync(prefix + file, 'utf8'))
				if (lint.error) {
					console.log('Error in file ' + file, {
						error: lint.error,
						line: lint.line
					});
					clean = false;
				}
			}
		});

		if (clean) {
			console.log('No json lint errors');
		}
	}

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
			thumbs(process.argv[3]);
			break;
		case 'convert':
			convertSailplanner(process.argv[3]);
			break;
		case 'lint':
			lint();
		break;
		default:
			console.error('Unknown action:', process.argv[2]);
		}
	} else {
		console.log('Please choose an action');
	}
})();