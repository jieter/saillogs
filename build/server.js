'use strict';

var connect = require('connect');
var saillogAPI = require(__dirname + '/saillog-api.js');

var root = __dirname + '/../';
var port = 9999;

connect()
	.use(connect.logger('dev'))
	.use(connect.static(root))
	.use(saillogAPI(__dirname + '/../data'))
	.listen(port);

console.log('Started Saillog server on port ' + port + '...' +root);
console.log('Press Ctrl + C to stop.');
