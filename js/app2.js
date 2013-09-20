/**
 * Saillog main app.
 */
'use strict';

Saillog.Widget = {};


Saillog.Widget.Index = L.Class.extend({
	includes: L.Mixin.Events,

	initialize: function (container) {
		this._container = container;
	},

	update: function (index) {
		this._index = index;
		this.render();
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
		var self = this;
		list.one('click', '[data-id]', function () {
			self.fire('click-story', {
				id: $(this).data('id')
			});
		});

		this.fire('rendered');
	}
});

Saillog.App2 = L.Class.extend({
	includes: L.Mixin.Events,

	initialize: function () {
		this.sidebar = $('#sidebar');

		this._map = new Saillog.Map(this);
		this.indexWidget = new Saillog.Widget.Index(this.sidebar);

		var self = this;
		this.loadIndex(function (index) {
			self.indexWidget.update(index);
		});
	},

	showIndex: function () {
		this._widgets.index.render();
	},

	showStory: function (id) {

	},

	sidebarPadding: function () {
		return this.sidebar.width() * 1.11;
	},

	loadIndex: function (callback) {
		var self = this;

		$.getJSON('data/index.json', function (index) {
			self._index = index;
			callback(index);
		});

	}
});


window.saillog = new Saillog.App2();