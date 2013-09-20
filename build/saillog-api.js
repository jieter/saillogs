'use strict';

var fs = require('fs');
var util = require('./util.js');
var connectRoute = require('connect-route');

var geojsonhint = require('geojsonhint');

/*jshint unused:false */
module.exports = function (connect) {
	var dataPath = __dirname + '/../data';
	var indexFile = dataPath + '/index.json';
	console.log('Saillog API started with dataPath: ' + dataPath);

	function filename(id) {
		return dataPath + '/' + id + '.geojson';
	}

	var actions = {
		updateIndex: function (callback) {
			fs.readFile(indexFile, 'utf8', function (err, result) {
				if (err) {
					console.log(err);
					callback(err);
				}
				callback(null, JSON.parse(result));
			});
		},
		saveIndex: function (index, callback) {
			fs.writeFile(indexFile, util.stringify(index), function (err) {
				callback(err);
			});
		},

		setVisibility: function (id, visibility, callback) {
			actions.updateIndex(function (err, result) {
				if (err) {
					callback(err);
					return;
				}
				result.logs.forEach(function (log, key) {
					if (log.name === id) {
						result.logs[key].visible = visibility;
					}
				});
				actions.saveIndex(result, callback);
			});
		},

		load: function (id, callback) {
			fs.readFile(filename(id), 'utf8', function (err, result) {
				callback(err, JSON.parse(result));
			});
		},

		save: function (id, json, callback) {
			json.features.forEach(function (feature, key) {
				delete feature.properties.id;
				delete feature.properties.distance;

				json.features[key] = feature;
			});

			fs.writeFile(filename(id), util.stringify(json), callback);
		},

		exists: function (id) {
			return fs.existsSync(filename(id));
		}
	};

	function reply(res, err, json) {
		if (err) {
			res.writeHead(500);
			res.end(err);
		} else {
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.end(util.stringify(json));
		}
	}

	console.log(__dirname + '/../');
	return [
		connect.logger('dev'),
		connect.static(__dirname + '/../'),
		connect.bodyParser(),
		connectRoute(function (router) {
			router.get('/api/get/:id', function (req, res, next) {
				var id = req.params.id;

				if (!actions.exists(id)) {
					reply(res, null, {
						success: false,
						message: 'No such story'
					});
				} else {
					actions.load(id, function (err, result) {
						reply(res, null, result);
					});
				}
			});

			router.post('/api/create/', function (req, res, next) {
				console.log('API create');
				res.end('api create');
			});

			router.post('/api/save/:id', function (req, res, next) {
				console.log('API save ' + req.params.id);

				var id = req.params.id;
				var json = JSON.parse(req.body.data);

				actions.save(id, json, function (err) {
					reply(res, err, {success: true});
				});
			});

			router.get('/api/setVisible/:id', function (req, res, next) {
				var id = req.params.id;

				actions.setVisibility(id, true, function (err) {
					reply(res, err, {
						success: true,
						message: 'succesfully set visible'
					});
				});
			});
		})
	];
};
