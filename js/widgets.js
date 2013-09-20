'use strict';

Saillog.Widget = L.Class.extend({
	includes: L.Mixin.Events,

	initialize: function (container) {
		this._container = container;
	},

	show: function () {
		this._container.show();
		return this;
	},

	hide: function () {
		this._container.hide();
		return this;
	},

	update: function () {
		return this;
	},

	render: function () {
		return this;
	}
});

Saillog.Widget.Index = Saillog.Widget.extend({
	update: function (index) {
		this._index = index;
		return this.render();
	},

	render: function () {
		var container = this._container.empty();
		if (!this._index) {
			container.html('No index loaded');
			return;
		}
		var index = this._index;

		$('<h1></h1>')
			.html(index.title)
			.appendTo(container);

		if (index.text) {
			$('<div class="preface"></div>')
				.html(marked(index.text))
				.appendTo(container);
		}

		var list = $('<ul class="selector"></ul>').appendTo(container);
		$.each(index.logs, function (key, log) {
			if (!log.visible && !Saillog.util.isDev()) {
				return;
			}
			var item = $('<li data-id="' + log.id + '">' + log.title + '</li>').appendTo(list);
			if (!log.visible) {
				item.addClass('disabled');
			}
		});
		var widget = this;
		list.one('click', '[data-id]', function () {
			widget.fire('click-story', {
				id: $(this).data('id')
			});
		});

		return this;
	}
});

Saillog.Widget.Story = Saillog.Widget.extend({

	update: function (story) {
		this._story = story;
		return this.render();
	},

	render: function () {
		var container = this._container.empty();
		var story = this._story;

		var widget = this;

		$('<h1></h1>').html(story.title).appendTo(container);

		story.each(function (leg) {
			widget._renderLeg(leg.properties)
				.attr('id', 'leg-story-' + leg.properties.id)
				.appendTo(container);
		});
		container.on('click', '.leg', function (event) {
			widget.fire('click-leg', {
				legId: $(this).attr('id').substr(10)
			});
		});
	},

	_renderLeg: function (leg) {
		var element = $('<div class="leg">');

		var title = $('<h3></h3>').appendTo(element);
		if (leg.title) {
			title.append(leg.title);
		}

		title.append('<span class="edit hidden"><i class="icon-edit-sign"></i></span>');

		if (leg.distance) {
			var tooltip = 'gevaren ';
			if (leg.duration) {
				var hour = 60 * 60;
				var hours = Math.floor(leg.duration / hour);
				var duration = hours + ':' + Math.floor((leg.duration - hours * hour) / 60);
				tooltip += 'in ' + duration + ' uur, ';
			}
			if (leg['avg_sog']) {
				tooltip += 'met een gemiddelde snelheid van ' + leg['avg_sog'] + 'kts';
			}
			title.append('<span class="distance" title="' + tooltip + '">' + leg.distance + ' NM</span>');
		}

		if (leg.date) {
			var parts = leg.date.split('-');
			var date = parseInt(parts[2], 10) + '-' + parseInt(parts[1], 10);

			element.prepend('<div class="date">' + date + '</div>');
		}

		if (leg.text !== undefined) {
			element.append(marked(leg.text));
		}

		if (leg.color) {
			var rgb = Saillog.util.hexToRgb(leg.color);
			var color = 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', 0.5)';
			element.css('border-left', '4px solid ' + color);
		}

		return element;
	}
});