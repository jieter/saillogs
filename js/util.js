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

// amend Marked to do some custom things:
/* globals marked:true */
marked.InlineLexer.prototype.outputLink = function (cap, link) {
	var href = link.href;
	var title = link.title ? ' title="' + link.title + '"'	: '';
	var body = cap[1];

	if (link.href.substr(0, 15) === 'http://youtu.be') {
		// special case for youtube links.
		return '<span class="youtube" data-youtube-url="' + href + '"' + title + '>' +
			'<i class="icon-youtube-play"></i> ' + body + '</span>';
	} else if (cap[0].charAt(0) !== '!') {
		// normal behaviour
		return '<a href="' + href + title + '>'	+ this.output(body) + '</a>';
	} else {
		// images get prefixed.
		href = Saillog.util.imagePrefix + href;
		var alt = body ? ' alt="' + body	+ '"' : '';
		return '<img src="' + href + '"' + alt + ' class="thumb"' + title + ' />';
	}
};


var Saillog = {};

Saillog.util = {
	imagePrefix: 'data/',

	// From http://stackoverflow.com/a/5624139
	hexToRgb: function hexToRgb(hex) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		if (!result) {
			return null;
		}
		var RGB = function (r, g, b) {
			this.r = r;
			this.g = g;
			this.b = b;
		};
		RGB.prototype.toArray = function () {
			return [this.r, this.g, this.b];
		};
		RGB.prototype.toString = function () {
			return this.toArray().join(',');
		};

		RGB.prototype.toRgba = function (alpha) {
			return 'rgba(' + this.toString() + ',' + alpha + ')';
		};
		return new RGB(
			parseInt(result[1], 16),
			parseInt(result[2], 16),
			parseInt(result[3], 16)
		);
	},

	formatDistance: function formatDistance(distance) {
		distance = L.Util.formatNum(distance, 1).toString().split('.');
		if (!distance[1]) {
			distance[1] = 0;
		}
		return distance.join('.');
	},

	timeDiff: function timeDiff(a, b) {
		return Math.abs(new Date(a) - new Date(b)) / 1000;
	},

	isDev: function isDev() {
		return location.port === '9999';
	},

	// http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
	isArray: function isArray(o) {
		return Object.prototype.toString.call(o) === '[object Array]';
	}
};

Saillog.defaultStyles = {
	leg: {
		color: '#0000ff',
		opacity: 0.4,
		weight: 3
	},
	highlight: {
		opacity: 0.7,
		weight: 5
	},
	track: {
		color: '#000000',
		weight: 1,
		dashArray: [4, 4]
	}
};
