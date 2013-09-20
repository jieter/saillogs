/**
 * Saillog util
 */

'use strict';

// make sure console exists
if (!('console' in window)) {
	window.console = {
		log: function () {}
	};
}

var Saillog = {};

Saillog.util = {
	// From http://stackoverflow.com/a/5624139
	hexToRgb: function hexToRgb(hex) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? [
			parseInt(result[1], 16),
			parseInt(result[2], 16),
			parseInt(result[3], 16)
		] : null;
	},

	formatDistance: function formatDistance(distance) {
		distance = L.Util.formatNum(distance, 1).toString().split('.');
		if (!distance[1]) {
			distance[1] = 0;
		}
		return distance.join('.');
	},

	isDev: function () {
		return location.port === '9999';
	}
};