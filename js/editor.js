'use strict';

Saillog.Editor = {
	showEditor: function (id) {
		if (!this._story) {
			return;
		}
		console.log('editing', id);

		this._edit = id;

		if (id === 'metadata') {
			this._editorWidget =
				new Saillog.Widget.StoryMetadataEditor(this.sidebar)
					.update(this._story.getProperties());
		} else {
			this._editLayer = this._story.getLayer(id);

			this.sidebar.addClass('wide');
			this._editorWidget =
				new Saillog.Widget.LegMetadataEditor(this.sidebar)
					.update(this._story.getProperties(id));

			this._startMapEditor();
		}

		this._editorWidget.once({
			'save': function () {
				this._save();
				this._stopEditing();
			},
			'cancel': this._stopEditing,
			'delete': function () {
				console.log('delete');
				this._story.removeLeg(id);
				delete this._edit;
				// todo refactor into _save
				this._story.save(function () {

				});
				this.showStory();
			}
		}, this);
	},

	_save: function () {
		var id = this._edit;
		var story = this._story;

		if (id === 'metadata') {
			story.setProperties(L.extend(
				{},
				story.getProperties(),
				this._editorWidget.values()
			));
		} else {
			story.setProperties(id, L.extend(
				{},
				story.getProperties(id),
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

		if (this._edit !== 'metadata') {
			this._scrollTo(this._edit, 0);
			delete this._edit;

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

Saillog.Editor.InitializeStory = L.Class.extend({
	initialize: {

	}
});