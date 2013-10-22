// Keep a calendar on the map with days with stories.

'use strict';

Saillog.Control = L.Control.extend({
	includes: L.Mixin.Events,

	container: function () {
		return $(this._container);
	},

	onAdd: function () {
		this._container = L.DomUtil.create('div', '');
		this._container.id = this.options.containerId;

		var control = this;

		this.container().on({
			'click mouseover mouseout': function (event) {
				control.fire(event.type + '-leg', {
					legId: $(event.target).data('legId')
				});
			}
		}, this);
		return this._container;
	},

	update: function (story) {
		this._story = story;
		return this.render();
	},

	render: function () {
		this.clear();
		if (!this._story) {
			return this;
		}

		this._story.each(function (leg) {
			if (leg.properties.date) {
				var type = leg.geometry ? leg.geometry.type : null;
				this.addLeg(leg.properties, type);
			}
		}, this);

		return this;
	},

	highlight: function (id) {
		var legs = this.container().find('.leg');
		legs.each(function (key, element) {
			element = $(element);
			if (id === element.data('legId')) {
				element.addClass('active');
			} else {
				element.removeClass('active');
			}
		});
		return this;
	},

	clear: function () {
		this._container.innerHTML = '';
		return this;
	},

	hide: function () {
		this.container().hide();
	},
	show: function () {
		this.container().show();
	}
});

Saillog.Control.Calendar = Saillog.Control.extend({
	options: {
		position: 'topleft',
		containerId: 'calendar'
	},

	addLeg: function (leg) {
		var container = this.container();

		var parts = leg.date.split('-');
		var date = new Date(parts[0], parts[1] - 1, parts[2]);
		var day = parseInt(parts[2], 10);

		var item = $('<div class="leg"></div>')
			.data({'legId': leg.id})
			.attr('title', leg.title)
			.html(day);

		var diff = null;
		// TODO: use absolute positioning to place legs
		if (container.children().length < 1) {
			item.css('margin-left', (date.getDay() * 21) + 'px');
		} else {
			var last = container.children().last();
			diff = day - last.html();
			if (diff > 1) {
				// insert empty days to align days properly
				for (var j = diff; j > 1; j--) {
					container.append('<div class="filler"></div>');
				}
			}
		}
		// make weekend-days bold
		if (date.getDay() === 0 || date.getDay() === 6) {
			item.addClass('weekend');
		}

		// do not insert to items for one day.
		if (diff !== 0) {
			item.appendTo(container);
		}
	}
});

Saillog.Control.Timeline = Saillog.Control.extend({
	options: {
		position: 'bottomleft',
		containerId: 'timeline',
		speed: 5,
		opacity: 0.6
	},

	render: function () {
		if (!this._story) {
			return this;
		}
		this._recalculateWidth();

		this._times = this._story.getTimes();
		this._times.pps = this._width / this._times.span;

		Saillog.Control.prototype.render.call(this);

		return this._updateLabels();
	},

	_recalculateWidth: function () {
		this._width = $(window).innerWidth() - ($('#sidebar').width() + 40);
		this.container().css('width', (this._width + 60) + 'px');
	},

	_updateLabels: function () {
		var story = this._story;

		function addDays(date, days) {
			if (!(date instanceof Date)) {
				date = new Date(date + 'T00:00:00');
			} else {
				date = new Date(date.getTime());
			}
			var DAY = 24 * 60 * 60 * 1000; //ms
			var UTC2CEST = 2 * 60 * 60 * 1000; // correct for timezone
			date.setTime(date.getTime() + days * DAY - UTC2CEST);
			return date;
		}

		var times = this._times;
		var spanDays = times.span / (24 * 60 * 60);
		var labels = [];
		for (var i = 0.75; i < spanDays + 0.75; i = i + 0.25) {
			labels.push(
				addDays(times.start.substr(0, 10), i)
			);
		}

		var offset = function (time) {
			return (Math.round(
				Saillog.util.timeDiff(time, times.start) * times.pps
			) * 100) / 100;
		};
		var container = $(this._labels);

		labels.forEach(function (label) {
			var css = {
				left: offset(label) + 'px'
			};

			var el = $('<div class="marker"></div>');

			// TODO fix timezone assumption here
			if (label.getHours() === 0) {
				el.html(label.getDate() + '-' + (label.getMonth() + 1));

				// daylight hours.
				var position = story.closestPosition(label);
				var today = SunCalc.getTimes(addDays(label, 0.5), position.lat, position.lng);
				var yesterday = SunCalc.getTimes(addDays(label, -0.5), position.lat, position.lng);

				var set = offset(yesterday.sunset);
				$('<div class="night"></div>')
					.css({
						left: set + 'px',
						width: (offset(today.sunrise) - set) + 'px'
					})
					.attr('title',
						'Sun sets: ' + yesterday.sunset.toLocaleTimeString('en-GB') +
						', rises: ' + today.sunrise.toLocaleTimeString('en-GB'))
					.appendTo(container);
			} else {
				// TODO this parameter needs tuning.
				// add time labels if we have enough horzontal space
				if (times.pps > 0.003) {
					el.html(label.getHours() + ':00');
				}
			}

			$(el).add('<div class="mark"></div>')
				// TODO fix timezone assumption here
				.addClass(label.getHours() === 0 ? 'major' : 'minor')
				.css(css)
				.attr('title', label.toGMTString())
				.appendTo(container);
		});

		return this;
	},

	onAdd: function (map) {
		var container = Saillog.Control.prototype.onAdd.call(this, map);

		this._reel = L.DomUtil.create('div', 'reel', container);
		this._labels = L.DomUtil.create('div', 'labels', container);

		var control = this;
		$(window).resize(function () {
			control._recalculateWidth();
			control.render();
		});
		return container;
	},

	clear: function () {
		this._reel.innerHTML = '';
		this._labels.innerHTML = '';
		return this;
	},

	show: function () {
		if (this._story.properties.showTimeline) {
			return Saillog.Control.prototype.show.call(this);
		}
		return this;
	},

	_legCss: function (leg) {
		var color = Saillog.util.hexToRgb(leg.color);

		var duration = leg.duration || this.options.speed * leg.distance * (60);

		var left = this._times.offset(leg.startTime) * this._times.pps;
		var width = duration * this._times.pps;

		return {
			'border': '4px solid ' + color.toRgba(this.options.opacity),
			left: Math.round(left) + 'px',
			width: Math.round(width) + 'px'
		};
	},

	addLeg: function (leg, type) {
		if (!type || type === 'Point') {
			return;
		}
		var reel = $(this._reel);

		var item = $('<div class="leg"></div>')
			.data({legId: leg.id})
			.attr('title', leg.title + ' ' +
				Saillog.util.formatTime(leg.startTime) + ' - ' +
				Saillog.util.formatTime(leg.endTime))
			.css(this._legCss(leg));

		item.appendTo(reel);
	}
});

