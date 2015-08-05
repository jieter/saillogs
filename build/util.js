/*
 * Saillog build scripts util functions
 *
 */
'use strict';

// swap an [lat, lng]-array, or an array of [lat, lng]-arrays.
var swap = function (array) {
	if (typeof array[0] === 'number' && typeof array[1] === 'number') {
		return [array[1], array[0]];
	} else {
		var ret = [];
		array.forEach(function (value) {
			ret.push(swap(value));
		});
		return ret;
	}
};

function numberToRadius(number) {
	return number * Math.PI / 180;
}

function distanceAB(pt1, pt2) {
	var lon1 = pt1[0],
	    lat1 = pt1[1],
	    lon2 = pt2[0],
	    lat2 = pt2[1],
	    dLat = numberToRadius(lat2 - lat1),
	    dLon = numberToRadius(lon2 - lon1),
	    a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(numberToRadius(lat1)) *
	        Math.cos(numberToRadius(lat2)) * Math.pow(Math.sin(dLon / 2), 2),
	    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return (6371 * c) * 1000; // returns meters
}

function merge(list) {
	return require('geojson-merge')(list);
}

function stringify(obj, indent, flat) {
	var i, ret, key, first = true;
	indent = indent || 0;

	if (flat) {
		return JSON.stringify(obj);
	} else if (obj instanceof Array) {

		ret = '[';
		for (key in obj) {
			if (first) {
				first = false;
			} else {
				ret += ', \n';
				for (i = 0; i < indent; i++) {
					ret += '\t';
				}
			}
			ret += stringify(obj[key], indent);
		}
		for (i = 0; i <= indent; i++) {
			ret += '\t';
		}
		return ret + ']\n';
	} else if (obj instanceof Object) {
		ret = '{\n';
		for (key in obj) {
			if (obj[key] === undefined) {
				continue;
			}
			if (first) {
				first = false;
			} else {
				ret += ',\n';
			}
			for (i = 0; i <= indent; i++) {
				ret += '\t';
			}

			flat = (key === 'coordinates' || key === 'center');
			ret += '"' + key + '": ' + stringify(obj[key], indent + 1, flat);
		}
		ret += '\n';
		for (i = 0; i < indent; i++) {
			ret += '\t';
		}
		return ret + '}';
	} else {
		return JSON.stringify(obj);
	}
}

module.exports = {
	stringify: stringify,

	// return a YYYY-mm-dd string for the current date or
	// for a supplied date string.
	getDate: function (d) {
		d = d ? new Date(d) : new Date();

		var pad = function (d) {
			return (d < 10) ? '0' + d : d;
		};
		return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
	},

	swap: swap,

	lineDistance: function lineDistance(coords) {
		if (coords.length < 2) {
			return 0;
		}

		var distance = 0;
		for (var i = 1; i < coords.length; i++) {
			distance += distanceAB(coords[i - 1], coords[i]);
		}

		return Math.round(distance / 1852);
	},

	merge: merge
};
