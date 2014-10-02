/**
 * Saillog main app.
 */
'use strict';

Saillog.App = L.Class.extend({
	initialize: function () {
		var app = this;
		this.sidebar = $('#sidebar');

		var map = this._map = new Saillog.Map(this);
		this.indexWidget = new Saillog.Widget.Index(this.sidebar).on({
			'click-story create-story': function (e) {
				var id = e.id;

				if (!id) {
					return new Saillog.Editor.InitializeStory(function (id) {
						window.location.hash = '#' + id;
					});
				} else {
					window.location.hash = '#' + id;
				}
			}
		});

		this.storyWidget = new Saillog.Widget.Story(this.sidebar);

		this.calendarControl = new Saillog.Control.Calendar().addTo(map);
		this.timelineControl = new Saillog.Control.Timeline().addTo(map);

		this._attachLegActions(this.storyWidget);
		this.storyWidget.on({
			'edit-metadata': function () {
				this.showEditor('metadata');
			},
			'create-leg edit-leg': function (event) {
				var legId = event.legId;
				if (!legId) {
					legId = this._story.addLeg();
				}

				this.showEditor(legId);
			}
		}, this);

		this._attachLegActions(this.calendarControl);
		this._attachLegActions(this.timelineControl);

		this.loadIndex(function () {
			$(window).on('hashchange', function () {
				var hash = window.location.hash.slice(1);

				if (hash === '') {
					app.showIndex();
				} else {
					app.loadStory(hash, function (success, err) {
						if (success) {
							app.showStory();
						} else {
							console.log('Story ' + hash + ' could not be loaded: ' + err);
							// TODO: notify user.
							window.location.hash = '#';
						}
					});
				}
			}).trigger('hashchange');
		});

		$('body').mediaModal({
			selector: '.thumb, .youtube'
		});

		// sidebar toggle
		$('<div id="sidebar-handle">')
			.prop('title', 'Toggle sidebar')
			.append('<i class="icon-circle-arrow-right"></i>')
			.append('<i class="icon-circle-arrow-right"></i>')
			.append('<i class="icon-circle-arrow-right"></i>')
			.insertAfter(this.sidebar)
			.on('click', function () {
				if (app.sidebar.is(':visible')) {
					app.sidebar.hide(500);
				} else {
					app.sidebar.show(500);
				}
				$(this).children('i')
					.toggleClass('icon-circle-arrow-right icon-circle-arrow-left');
			});
	},

	showIndex: function () {
		Saillog.util.imagePrefix = 'data/';

		this._map
			.setView(this._index.center, this._index.zoom)
			.maxZoom(14);

		if (this._story) {
			this._map.removeLayer(this._story);
		}

		this.indexWidget.update(this._index);

		[
			this.calendarControl,
			this.timelineControl
		].forEach(function (it) {
			it.hide();
		});
	},

	showStory: function () {
		var story = this._attachLegActions(this._story);

		Saillog.util.imagePrefix = 'data/' + story.id + '/';

		this._map
			.addLayer(story)
			.panTo(story);

		[
			this.storyWidget,
			this.calendarControl,
			this.timelineControl
		].forEach(function (it) {
			it.update(story).show();
		});
	},

	_attachLegActions: function (emitter) {
		var actions = {
			'click-leg': this._legClick,
			'mouseover-leg': this._legHover,
			'mouseout-leg': function () {
				this._highlight();
			}
		};
		return emitter
			.off(actions)
			.on(actions, this);
	},

	_legClick: function (event) {
		var legId = event.legId;

		this._highlight(legId);
		this._map.panTo(this._story.getLayer(legId));

		this._scrollTo(legId);
	},

	_legHover: function (event) {
		this._highlight(event.legId);
	},

	_highlight: function (id) {
		[
			this._story,
			this.storyWidget,
			this.calendarControl,
			this.timelineControl
		].forEach(function (it) {
			it.highlight(id);
		});
	},

	_scrollTo: function (id, duration) {
		duration = duration || 500;

		$.scrollTo('#leg-story-' + id, {
			duration: duration,
			offset: {
				top: -20
			}
		});
		return this;
	},

	sidebarPadding: function () {
		return this.sidebar.width() + 200;
	},

	loadIndex: function (callback) {
		var app = this;

		$.getJSON('data/index.json', function (index) {
			app._index = index;
			callback();
		});
	},

	loadStory: function (id, callback) {
		var app = this;

		if (this._story) {
			this._map.removeLayer(this._story);
		}

		$.ajax({
			url: 'data/' + id + '.geojson',
			method: 'get',
			dataType: 'json',
			success: function (response) {
				app._story = new Saillog.Story(response);
				callback(true);
			},
			error: function (_, err) {

				callback(false, err);
			}
		});
	}
});

$(function () {
	var saillog = new Saillog.App();
	window.saillog = saillog;

	L.extend(saillog, Saillog.Editor);
	if (Saillog.util.isDev()) {
		Saillog.util.liveReload();

		window.setTimeout(function () {
			if (window.location.hash === '#2013-zomerzeilen') {
				window.saillog.showEditor(23);
			}
		}, 500);
	}
});
