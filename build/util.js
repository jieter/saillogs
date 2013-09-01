/*
 * Saillog build scripts util functions
 *
 */
'use strict';

// swap an [lat, lng]-array, or an array of [lat, lng]-arrays.
var swap = function (array) {
	if (array.length === 2 && typeof array[0] === 'number') {
		return [array[1], array[0]];
	} else {
		var ret = [];
		array.forEach(function (value) {
			ret.push(swap(value));
		});
		return ret;
	}
};

module.exports = {
	stringify: function (obj) {
		return JSON.stringify(obj, null, '\t');
	},

	// return a YYYY-mm-dd string for the current date or
	// for a supplied date string.
	getDate: function (d) {
		d = d ? new Date(d) : new Date();

		var pad = function (d) {
			return (d < 10) ? '0' + d : d;
		};
		return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
	},
	swap: swap
};

