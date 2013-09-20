/**
 * Saillog main app.
 */
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
		var container = this._container.empty()
		var story = this._story;

		var widget = this;

		$('<h1></h1>').html(story.title).appendTo(container);
		story.features.forEach(function (leg) {
			widget._renderLeg(leg.properties)
				.attr('id', 'leg-story-' + leg.id)
				.appendTo(container);
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
})

Saillog.App = L.Class.extend({
	includes: L.Mixin.Events,

	initialize: function () {
		var app = this;
		this.sidebar = $('#sidebar');

		this._map = new Saillog.Map(this);
		this.indexWidget = new Saillog.Widget.Index(this.sidebar).on({
			'click-story': function (e) {
				var id = e.id;
				window.location.hash = '#' + id;
			}
		});
		this.storyWidget = new Saillog.Widget.Story(this.sidebar);

		this.loadIndex(function (index) {
			// listen to hash changes.
			$(window).on('hashchange', function () {
				var hash = window.location.hash.slice(1);

				if (hash === '') {
					app.showIndex();
				} else {
					app.loadStory(hash, function (story) {
						app.showStory();
					});
				}
			}).trigger('hashchange');
		});
	},

	showIndex: function () {
		this._map.panTo(this._index.center, this._index.zoom);
		this._map.maxZoom(14);

		this.indexWidget.update(this._index);
	},

	showStory: function (id) {
		this._map.panTo(this._story);
		this.storyWidget.update(this._story);
	},

	sidebarPadding: function () {
		return this.sidebar.width() * 1.11;
	},

	loadIndex: function (callback) {
		var app = this;

		$.getJSON('data/index.json', function (index) {
			app._index = index;
			callback(index);
		});
	},
	loadStory: function (id, callback) {
		var app = this;

		$.getJSON('data/' + id + '.geojson', function (response) {
			response.id = id; // TODO: put this in json response.
			app._story = response;
			callback(response);
		});
	}
});


window.saillog = new Saillog.App();