// Keep a calendar on the map with days with stories.

'use strict';

Saillog.CalendarControl = L.Control.extend({
	includes: L.Mixin.Events,

	options: {
		position: 'topleft'
	},
	onAdd: function () {
		this._container = L.DomUtil.create('div', '');
		this._container.id = 'calendar';

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

	container: function () {
		return $(this._container);
	},

	update: function (story) {
		this.container().empty();

		story.each(function (leg) {
			if (leg.properties.date) {
				this.addStory(leg.properties);

			}
		}, this);
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

	},

	addStory: function (story) {
		var container = this.container();

		var parts = story.date.split('-');
		var date = new Date(parts[0], parts[1] - 1, parts[2]);
		var day = parseInt(parts[2], 10);

		var item = $('<div class="leg"></div>');
		item.data({
			'legId': story.id
		});
		item.attr('title', story.title);
		item.html(day);

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
			item.css('font-weight', 'bold');
		}
		// prevent insertion of two stories for one day.
		if (diff !== 0) {
			item.appendTo(container);
		}
	},

	clear: function () {
		this._container.innerHTML = '';
	},

	hide: function () {
		this.container().hide();
	}
});