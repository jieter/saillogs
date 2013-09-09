'use strict';

var connect = require('connect');
var port = 9999;

connect
	.apply(null, require('./saillog-api.js')(connect))
	.listen(port);

console.log('Started Saillog server on port ' + port + '...');
console.log('Press Ctrl + C to stop.');
