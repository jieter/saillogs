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
	var decode = function (encoded) {
		var len = encoded.length;
		var index = 0;
		var latlngs = [];
		var lat = 0;
		var lng = 0;

		while (index < len) {
			var b;
			var shift = 0;
			var result = 0;
			do {
				b = encoded.charCodeAt(index++) - 63;
				result |= (b & 0x1f) << shift;
				shift += 5;
			} while (b >= 0x20);
			var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
			lat += dlat;

			shift = 0;
			result = 0;
			do {
				b = encoded.charCodeAt(index++) - 63;
				result |= (b & 0x1f) << shift;
				shift += 5;
			} while (b >= 0x20);
			var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
			lng += dlng;

			latlngs.push([lat * 1e-5, lng * 1e-5]);
		}

		return latlngs;
	};

	// swap x/y for geojson
	var swap = function (array) {
		if (array.length == 2 && typeof array[0] === 'number') {
			return [array[1], array[0]];
		} else {
			var ret = [];
			array.forEach(function (value) {
				ret.push(swap(value));
			})
			return ret;
		}
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
					type: 'FeatureCollection',
					title: json.data.options.comment,
					originalURL: json.url,
					features: []
				};

				json.data.legs.forEach(function (leg) {
					if (leg.options.comment) {
						leg.options.title = leg.options.comment;
						delete leg.options.comment;
					}
					delete leg.options.geodesic;
					delete leg.options.opacity;
					delete leg.options.width;
					delete leg.options.speed;

					out.features.push({
						type: "Feature",
						geometry: {
							type: 'LineString',
							coordinates: swap(decode(leg.path))
						},
						properties: leg.options
					});
				});

				var filename = __dirname + '/data/' + key + '.geojson';
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

	var toGeoJSON = function (filename) {
		if (!filename) {
			fs.readdirSync('data/').forEach(function (value) {
				if (value.substr(-5) == '.json') {
					toGeoJSON(value.substr(0, value.length - 5));
				}
			});
			return;
		}

		var prefix = __dirname + '/data/';
		var json = fs.readFileSync(prefix + filename + '.json', 'utf8');
		json = JSON.parse(json);

		var geojson = {
			type: 'FeatureCollection',
			title: json.title,
			features: []
		};
		if (json.trackGeojson === true) {
			geojson.trackGeojson = true;
		}

		json.legs.forEach(function (leg) {
			var type, coordinates;

			if (leg.marker) {
				type = 'Point';
				coordinates = swap(leg.marker)
			} else if (leg.path) {
				if (typeof leg.path === 'string') {
					leg.path = decode(leg.path);
				}
				type = 'LineString';
				coordinates = swap(leg.path);
			} else {
				geojson.features.push({
					type: "Feature",
					properties: leg
				});
				return;
			}

			delete leg.path;
			delete leg.marker;

			geojson.features.push({
				type: "Feature",
				geometry: {
					type: type,
					coordinates: coordinates
				},
				properties: leg
			});
		})

		fs.writeFileSync(prefix + filename + '.geojson', JSON.stringify(geojson, null, '\t'));
		console.log('wrote geojson: ' + filename);
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
		case 'toGeoJSON':
			toGeoJSON(process.argv[3]);
		break;
		default:
			console.error('Unknown action:', process.argv[2]);
		}
	} else {
		console.log('Please choose an action');
	}
})();;