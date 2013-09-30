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
		this.clear();
		story.each(function (leg) {
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
		opacity: 0.6,
		width: $(window).innerWidth() - 100
	},

	update: function (story) {
		this._times = story.getTimes();
		this._times.pps = this.options.width / this._times.span;

		this._reel.width = this.options.width + 'px';

		this._updateLabels();

		Saillog.Control.prototype.update.call(this, story);
		return this;
	},

	_updateLabels: function () {
		var container = this.container();

		function addDays(date, days) {
			var date = new Date(date + 'T00:00:00');
			var DAY = 24 * 60 * 60 * 1000; //ms
			return date.setTime(date.getTime() + days * DAY);
		}

		var labels = [
			addDays(this._times.start.substr(0, 10), 1),
			addDays(this._times.end.substr(0, 10), -1)
		];

		var times = this._times;
		var offset = function (time) {
			return Saillog.util.timeDiff(time, times.start) * times.pps;
		};

		labels.forEach(function (label) {
			console.log(label);
			var el = $('<div class="mark"></div>').appendTo(container);
			el.css({
				left: offset(label)
			});
		})

	},

	onAdd: function (map) {
		var container = Saillog.Control.prototype.onAdd.call(this, map);


		this._reel = L.DomUtil.create('div', 'reel', container);

		return container;
	},

	clear: function () {
		// we clean the reel here, to not loose the control and label stuff
		this._reel.innerHTML = '';
		return this;
	},

	_legCss: function (leg) {
		var color = Saillog.util.hexToRgb(leg.color);

		var duration = leg.duration || this.options.speed * leg.distance;

		var left = this._times.offset(leg.startTime) * this._times.pps;
		var width = duration * this._times.pps;

		return {
			'background-color': color.toRgba(this.options.opacity),
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
			.attr('title', leg.title)
			.css(this._legCss(leg));

		item.appendTo(reel);
	}
});

