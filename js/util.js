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

var icon = function (icon) {
	switch (icon) {
	case 'edit':
		icon = 'fa-pencil-square';
		break;
	case 'create':
		icon = 'fa-plus';
		break;
	case 'github':
		icon = 'fa-github';
		break;
	case 'marker':
		icon = 'fa-map-marker';
		break;
	case 'youtube':
		icon = 'fa-youtube-play';
		break;
	}

	return '<i class="fa ' + icon + '"></i>';
};

// amend Marked to do some custom things:
/* globals marked:true */
marked.Renderer.prototype.image = function (href, title, text) {
	// images get prefixed.
	return L.Util.template('<img src="{href}" class="{className}" title="{title}" />', {
		href: href = Saillog.util.imagePrefix + href,
		className: 'thumb ' +  (title === 'inline' ? 'inline-thumb' : 'side-thumb'),
		title: text
	});
};

marked.Renderer.prototype.link = function (href, title, text) {
	// console.log(arguments);
	if (href.substr(0, 15) === 'http://youtu.be') {
		// special case for youtube links.
		if (text === '') {
			// no text, full width.
			return '<iframe id="ytplayer" class="modal_content" type="text/html" ' +
				'src="http://www.youtube.com/embed/{id}?autoplay=0&wmode=transparent" frameborder="0"/>'
					.replace('{id}', href.substr(-11));
		} else {
			return '<span class="youtube" data-youtube-url="' + href + '">' +
				icon('youtube') + ' ' + text + '</span>';
		}
	} else {
		// normal behaviour
		title = title ? ' title="' + title + '"' : '';
		return '<a href="' + href + '"' + title + '>'	+ text + '</a>';
	}
};

// explicit imagePath for Leaflet, needed when uglified with the rest.
L.Icon.Default.imagePath = 'js/lib/Leaflet/images';

var Saillog = {};

Saillog.util = {
	keyCodes: {
		enter: 13,
		escape: 27
	},
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

	format: {
		distance: function formatDistance(distance) {
			distance = L.Util.formatNum(distance, 1).toString().split('.');
			if (!distance[1]) {
				distance[1] = 0;
			}
			return distance.join('.');
		},

		duration: function formatDuration(seconds) {
			var HOUR = 60 * 60;
			var hours = Math.floor(seconds / HOUR);
			var minutes = Math.floor((seconds - hours * HOUR) / 60);
			return hours + ':' + (minutes < 10 ? '0' : '') + minutes;
		},

		time: function formatTime(time) {
			time = new Date(time);
			var minutes = time.getMinutes();
			return time.getHours() + ':' + (minutes < 10 ? '0' : '') + minutes;
		},

		date: function formatDate(date) {
			if (!(date instanceof Date)) {
				date = new Date(date);
			}
			return date.getDate() + '-' + (date.getMonth() + 1);
		}
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
		L.DomUtil.create('script', '', document.body).src = src;
	},

	renderMarkdown: function (text) {
		return marked(text, {
			renderer: new marked.Renderer()
		});
	},

	icon: icon
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
