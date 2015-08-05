/**
 *
 */

'use strict';

var fs = require('fs');

var SCRIPT_RE = /<script(.*)? src="([a-zA-Z\/0-9.-]*)" ?(data-target="(.*)")?><\/script>/g;

module.exports = function (htmlFile, prefix, target) {

	prefix = prefix || '';
	target = target || false;

	var html = fs.readFileSync(htmlFile, 'utf8');
	var tags = html.match(SCRIPT_RE);

	var scripts = [];
	tags.forEach(function (tag) {
		var parts = tag.split(SCRIPT_RE);
		if (target !== false && parts[4] !== undefined && parts[4].indexOf(target) === -1) {
			return;
		}
		scripts.push(prefix + parts[2]);
	});

	return scripts;
};
