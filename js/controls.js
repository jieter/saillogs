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
	},

	update: function (story) {
		this._left = 0;
		this._time = story.getTimes();

		Saillog.Control.prototype.update.call(this, story);
		return this;
	},

	onAdd: function (map) {
		var container = Saillog.Control.prototype.onAdd.call(this, map);

		// TODO: left + right button,
		// date labels, etc.
		this._reel = L.DomUtil.create('div', 'reel', container);
		return container;
	},

	clear: function () {
		// we clean the reel here, to not loose the control and label stuff
		this._reel.innerHTML = '';
		return this;
	},

	addLeg: function (leg, type) {
		if (!type || type === 'Point') {
			return;
		}
		var reel = $(this._reel);
		var speed = 5;
		var duration = leg.duration || speed * leg.distance;
		var color = Saillog.util.hexToRgb(leg.color);

		var left = this._left;
		var width = duration / 5;

		this._left += width + 3;

		var item = $('<div class="leg"></div>')
			.data({legId: leg.id})
			.attr('title', leg.title)
			.css({
				'background-color': color.toRgba(0.6),
				left: left + 'px',
				width: width + 'px'
			});

		item.appendTo(reel);
	}
});

