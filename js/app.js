/**
 * Saillog main app.
 */
'use strict';

Saillog.Editor = {
	editor: function (editObj) {
		if (!this._story) {
			return;
		}
		console.log('editing', editObj);

		this._editObj = editObj;

		if (editObj === 'metadata') {
			this._editorWidget =
				new Saillog.Widget.StoryMetadataEditor(this.sidebar)
					.update(this._story.getProperties());
		} else {
			var legId = editObj;
			this._editLayer = this._story.getLayer(legId);

			this.sidebar.addClass('wide');
			this._editorWidget =
				new Saillog.Widget.LegMetadataEditor(this.sidebar)
					.update(this._story.getProperties(legId));

			this._startMapEditor();
		}

		this._editorWidget.on({
			'save': function () {
				this._save();
				this._stopEditing();
			},
			'cancel': this._stopEditing
		}, this);
	},

	_save: function () {
		var editObj = this._editObj;
		var story = this._story;

		if (editObj === 'metadata') {
			story.setProperties(L.extend(
				{},
				story.getProperties(),
				this._editorWidget.values()
			));
		} else {
			story.setProperties(editObj, L.extend(
				{},
				story.getProperties(editObj),
				this._editorWidget.values()
			));
		}


		story.save(function () {
			// TODO: notify user
			console.log('saved');
		});
	},

	_stopEditing: function () {
		this.sidebar.removeClass('wide');
		this.showStory();

		if (this._editObj !== 'metadata') {
			this._scrollTo(this._editObj, 0);
			delete this._editObj;

			this._stopMapEditor(this._editLayer);
			delete this._editLayer;
		}
	},

	_startMapEditor: function () {
		var layer = this._editLayer;
		if (!layer) {
			return;
		}
		if (layer instanceof L.Marker) {
			layer.dragging.enable();
		} else {
			if (layer.getLatLngs && layer.getLatLngs().length < 150) {
				layer.editing.enable();
			}
		}
		this._map.panTo(layer);
	},

	_stopMapEditor: function () {
		var layer = this._editLayer;
		if (!layer) {
			return;
		}
		if (layer.dragging) {
			layer.dragging.disable();
		} else {
			layer.editing.disable();
		}
	}
};

Saillog.App = L.Class.extend({
	initialize: function () {
		var app = this;
		this.sidebar = $('#sidebar');

		this._map = new Saillog.Map(this);
		this.indexWidget = new Saillog.Widget.Index(this.sidebar).on({
			'click-story create-story': function (e) {
				var id = e.id;
				window.location.hash = '#' + id;
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
				this.showEditor(event.legId);
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

	showEditor: function (what) {
		if (!this.editor) {
			L.extend(this, Saillog.Editor);
		}
		return this.editor(what);
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
				response.id = id; // TODO: put this in json response.

				app._story = new Saillog.Story(response);
				callback();
			},
			error: function () {
				app._story = new Saillog.Story({
					id: id,
					title: id,
					type: 'FeatureGroup',
					features: []
				});
				callback();
			}
		});
	}
});


window.saillog = new Saillog.App();

window.setTimeout(function () {
	if (window.location.hash === '#2013-zomerzeilen') {
		window.saillog.showEditor('metadata');
	}
}, 500);