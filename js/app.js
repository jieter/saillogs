/**
 * Saillog main app.
 */
'use strict';

Saillog.App = L.Class.extend({
	initialize: function () {
		var app = this;
		this.sidebar = $('#sidebar');

		this._map = new Saillog.Map(this);
		this.indexWidget = new Saillog.Widget.Index(this.sidebar).on({
			'click-story create-story': function (e) {
				var id = e.id;
				if (!id) {
					Saillog.Editor.InitializeStory(function (id) {
						window.location.hash = '#' + id;
					});
				} else {
					window.location.hash = '#' + id;
				}
			}
		});

		this.storyWidget = new Saillog.Widget.Story(this.sidebar);

		// TODO refactor this addTo(this._map._map);
		this.calendarControl = new Saillog.Control.Calendar().addTo(this._map._map);
		this.timelineControl = new Saillog.Control.Timeline().addTo(this._map._map);

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
					app.loadStory(hash, function () {
						app.showStory();
					});
				}
			}).trigger('hashchange');
		});

		$('body').mediaModal({
			selector: '.thumb, .youtube'
		});
	},

	showIndex: function () {
		Saillog.util.imagePrefix = 'data/';

		this._map.panTo(this._index.center, this._index.zoom);
		this._map.maxZoom(14);

		this._map.clear();
		if (this._story) {
			this._map.removeLayer('story');
		}

		this.indexWidget.update(this._index);

		this.calendarControl.hide();
		this.timelineControl.hide();
	},

	showStory: function () {
		var story = this._story;
		this._attachLegActions(story);

		Saillog.util.imagePrefix = 'data/' + story.id + '/';

		this._map.addLayer('story', story);
		this._map.panTo(story);

		this.storyWidget.update(story);

		this.calendarControl.update(story).show();
		if (story.properties.showTimeline) {
			this.timelineControl.update(story).show();
		}
	},

	_attachLegActions: function (emitter) {
		var actions = {
			'click-leg': this._legClick,
			'mouseover-leg': this._legHover,
			'mouseout-leg': function () {
				this._highlight();
			}
		};
		emitter.off(actions).on(actions, this);
		return emitter;
	},

	_legClick: function (event) {
		var legId = event.legId;

		this._highlight(legId);
		this._map.panTo(this._story.getLayer(legId));

		this._scrollTo(legId);
	},

	_legHover: function (event) {
		var legId = event.legId;
		this._highlight(legId);
	},

	_highlight: function (id) {
		this._story.highlight(id);
		this.storyWidget.highlight(id);
		this.calendarControl.highlight(id);
		this.timelineControl.highlight(id);
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

		$.ajax({
			url: 'data/' + id + '.geojson',
			method: 'get',
			dataType: 'json',
			success: function (response) {
				app._story = new Saillog.Story(response);
				callback();
			},
			error: function () {
				//TODO communicate network error to user.
			}
		});
	}
});

$(function () {
	var saillog = new Saillog.App();
	window.saillog = saillog;

	L.extend(saillog, Saillog.Editor);
	window.setTimeout(function () {
		if (window.location.hash === '#2013-zomerzeilen') {
			window.saillog.showEditor('metadata');
		}
	}, 500);
});
