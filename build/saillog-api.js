'use strict';

var fs = require('fs');
var util = require('./util.js');
var connectRoute = require('connect-route');

/*jshint unused:false */
module.exports = function (dataPath) {
	console.log('Saillog API started with dataPath: ' + dataPath);

	var indexFile = dataPath + '/index.json';

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

	return connectRoute(function (router) {
		router.get('/api/get/:id', function (req, res, next) {

		});

		router.get('/api/create/', function (req, res, next) {
			res.end('api create');
		});

		router.get('/api/save/:id', function (req, res, next) {
			res.end('api save ' + req.params.id);
		});

		router.get('/api/setVisible/:id', function (req, res, next) {
			var id = req.params.id;

			actions.setVisibility(id, true, function (err) {
				reply(res, err, {success: true, message: 'succesfully set visible'});
			});
		});
	});
};
