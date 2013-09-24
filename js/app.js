/**
 * Saillog main app.
 */
'use strict';

Saillog.defaultStyles = {
	leg: {
		color: '#0000ff',
		opacity: 0.4,
		weight: 3
	},
	highlight: {
		opacity: 0.7,
		weight: 5
	},
	track: {
		color: '#000000',
		weight: 1,
		dashArray: [4, 4]
	}
};

Saillog.Editor = {
	editor: function (legId) {
		if (!this._story) {
			return;
		}
		console.log('editing', legId);

		this._editLegId = legId;
		var layer = this._editLayer = this._story.getLayer(legId);


		this.sidebar.addClass('wide');
		this.editorWidget = new Saillog.Widget.Editor(this.sidebar);

		this.editorWidget.on({
			'save': function () {
				this._save();
				this._stopEditing();
			},
			'cancel': this._stopEditing
		}, this);

		this.editorWidget
			.render()
			.loadLeg(this._story.getProperties(legId));

		if (layer) {
			if (layer instanceof L.Marker) {
				layer.dragging.enable();
			} else {
				if (layer.getLatLngs && layer.getLatLngs().length < 150) {
					layer.editing.enable();
				}
			}
			this._map.panTo(layer);
		}

	},

	_save: function () {
		console.log(this.editorWidget.values());

	},

	_stopEditing: function () {
		this.sidebar.removeClass('wide');
		this.showStory();

		this._scrollTo(this._editLegId, 0);
		delete this._editLegId;

		if (this._editLayer) {
			if (this._editLayer.dragging) {
				this._editLayer.dragging.disable();
			} else {
				this._editLayer.editing.disable();
			}
		}
		delete this._editLayer;
	}
};

Saillog.App = L.Class.extend({
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
		this.calendarControl = new Saillog.CalendarControl().addTo(this._map._map);

		this._attachLegActions(this.storyWidget);
		this.storyWidget.on({
			'edit-leg': function (event) {
				this.showEditor(event.legId);
			}
		}, this);

		this._attachLegActions(this.calendarControl);

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
	},

	showStory: function () {
		var story = this._story;
		this._attachLegActions(story);

		Saillog.util.imagePrefix = 'data/' + story.id + '/';

		this._map.addLayer('story', story);
		this._map.panTo(story);

		this.storyWidget.update(story);
		this.calendarControl.update(story);
	},

	showEditor: function (leg) {
		if (!this.editor) {
			L.extend(this, Saillog.Editor);
		}
		return this.editor(leg);
	},

	_attachLegActions: function (emitter) {
		emitter.on({
			'click-leg': this._legClick,
			'mouseover-leg': this._legHover,
			'mouseout-leg': function () {
				this._highlight();
			}
		}, this);
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

		$.getJSON('data/' + id + '.geojson', function (response) {
			response.id = id; // TODO: put this in json response.

			app._story = new Saillog.Story(response);
			callback();
		});
	}
});


window.saillog = new Saillog.App();

window.setTimeout(function () {
	window.saillog.showEditor(24);
}, 500);