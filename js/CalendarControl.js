// Keep a calendar on the map with days with stories.

(function (L) {
	'use strict';

	L.CalendarControl = L.Control.extend({
		options: {
			position: 'topleft'
		},
		onAdd: function () {
			this._container = L.DomUtil.create('div', '');
			this._container.id = 'index';

			return this._container;
		},

		container: function () {
			return $(this._container);
		},

		addStory: function (story) {
			var container = this.container();

			var parts = story.date.split('-');
			var date = new Date(parts[0], parts[1] - 1, parts[2]);
			var day = parseInt(parts[2], 10);

			var item = $('<div class="leg"></div>');
			item.data({
				'leg': story
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
		}
	});
})(L);