'use strict';

Saillog.Editor = {
	showEditor: function (id) {
		if (!this._story) {
			return;
		}

		this._edit = id;
		var story = this._story;
		var editObject = {
			id: id
		};

		console.log('start editing', id);

		this.sidebar.addClass('wide');

		if (id === 'metadata') {
			this._editorWidget = new Saillog.Widget.StoryMetadataEditor(this.sidebar);
			L.extend(editObject, story.getProperties());
		} else {
			this._editLayer = story.getLayer(id);

			this._editorWidget = new Saillog.Widget.LegMetadataEditor(this.sidebar);
			L.extend(editObject, story.getLeg(id).getProperties());

			this._startMapEditor();
		}
		this._editorWidget.update(editObject);

		this._editorWidget
			.once({
				'save': function () {
					this._save();
					this._stopEditing();
				},
				'cancel': function () {
					console.log('cancel', id);
					story.replaceLayer(id);

					// if (leg.is_not_yet_saved) {
					// 	story.removeLeg(id);
					// 	delete this._edit;
					// }

					this._stopEditing();
				},
				'delete': function () {
					console.log('delete', id);
					story.removeLeg(id);

					this._stopEditing();
					this._save();
				}
			}, this)
			.on({
				'update-color': function (event) {
					story.updateColor(id, event.color);
				},
				'change-type': function (event) {
					this._stopMapEditor();
					if (event.geometry === 'marker') {
						this._editLayer = new L.Draw.Marker(this._map);
					} else if (event.geometry === 'line') {
						this._editLayer = new L.Draw.Polyline(this._map);
					}
					this._editLayer.enable();

					this._map.once('draw:created', function (event) {
						story.replaceLayer(id, event.layer);

						//this._startMapEditor();
					}, this);
					return event;
				}
			}, this);
	},

	_save: function () {
		var story = this._story;

		var id = this._edit;

		if (id === undefined) {
			return;
		}

		var values = this._editorWidget.values();

		if (id === 'metadata') {
			story.setProperties(L.extend({}, story.getProperties(), values));
		} else {
			var leg = story.getLeg(id);

			leg.setProperties(L.extend({}, leg.getProperties(), values));
		}

		story.save(function () {
			// TODO: notify user
			console.log('saved', id);
		});
	},

	_stopEditing: function () {
		this.sidebar.removeClass('wide');
		this.showStory();

		if (this._edit !== 'metadata') {
			if (this._edit !== undefined) {
				this._scrollTo(this._edit, 0);
				delete this._edit;
			}

			this._stopMapEditor();
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
		var oldLayer = this._editLayer;
		if (!oldLayer) {
			return;
		}
		this._map.removeLayer(oldLayer);

		var id = L.stamp(oldLayer);
		var newLayer = this._story.getLayer(id);
		this._map.addLayer(newLayer);
	}
};

Saillog.Editor.InitializeStory = L.Class.extend({
	initialize: function (callback) {
		var id = window.prompt('Name for new story:');
		if (!id) {
			callback();
			return;
		}
		id = this._cleanId(id);

		var story = new Saillog.Story.emptyStory(id);
		story.save(function (response) {
			if (response.success) {
				callback(response.id);
			} else {
				console.error(response);
			}

		});
	},

	_cleanId: function (str) {
		return str.replace(' ', '-');
	}
});
