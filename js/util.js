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

// explicit imagePath for Leaflet, needed when uglified with the rest.
L.Icon.Default.imagePath = '/js/lib/Leaflet/images';

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
		RGB.prototype.hue = function () {
			var r = this.r / 255;
			var g = this.g / 255;
			var b = this.b / 255;

			var max = Math.max(r, g, b);
			var min = Math.min(r, g, b);
			if (max === min) {
				return 0;
			}

			var d = max - min;
			var h;
			switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
			}
			return h * 60;
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

	formatDuration: function formatDuration(seconds) {
		var HOUR = 60 * 60;
		var hours = Math.floor(seconds / HOUR);
		var minutes = Math.floor((seconds - hours * HOUR) / 60);
		return hours + ':' + (minutes < 10 ? '0' : '') + minutes;
	},

	timeDiff: function timeDiff(a, b) {
		return Math.abs(new Date(a) - new Date(b)) / 1000;
	},

	isDev: function isDev() {
		return location.port === '9999' || location.pathname === '/saillog-refactor/';
	},

	// http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
	isArray: function isArray(o) {
		return Object.prototype.toString.call(o) === '[object Array]';
	},

	'default': function (dest, defaults) {
		for (var key in defaults) {
			if (defaults[key] !== undefined && dest[key] === undefined) {
				dest[key] = defaults[key];
			}
		}
		return dest;
	},

	liveReload: function () {
		var src = 'http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1';
		L.DomUtil.create('script', '', document).src = src;
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
