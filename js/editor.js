'use strict';

var Saillog = Saillog || {};

Saillog.Editor = L.Class.extend({
	includes: L.Mixin.Events,

	initialize: function (saillog) {
		this.saillog = saillog;
		this.map = saillog.map;

		if (window.location.hash !== '') {
			this.initStoryControls();
		}
		saillog.off('loaded-story loaded-index');
		saillog.on({
			'loaded-story': this.initStoryControls,
			'loaded-index': this.stopEditing
		}, this);
		this.attachListeners();
	},

	initStoryControls: function () {
		$('#story h3').each(function () {
			$('<span class="edit"></span>')
				.append('<i class="icon-edit-sign"></i></span>')
				.appendTo(this);
		});
	},

	attachListeners: function () {
		var self = this;
		var map = this.map;

		map.on('draw:created', function (event) {
			var layer = event.layer;
			if (layer.setStyle) {
				layer.setStyle({
					color: '#000000'
				});
			}
			layer.addTo(map);
			console.log(JSON.stringify(layer.toGeoJSON(), null, '\t'));
		});

		$('#story').on('click', '.edit', function (e) {
			e.preventDefault();
			e.stopPropagation();

			self.editStory($(this).parents('.leg').data('leg'));
		});

		$('#editor').find('button').on('click', function () {
			self.stopEditing();
		});
	},

	editStory: function (story) {
		this._story = story;
		var layer = this._layer = this.saillog.features.getLayer(story.id);

		var editor = $('#editor');

		for (var key in story) {
			editor.find('[name=' + key + ']').val(story[key]);
		}


		if (layer) {
			var type = editor.find('.type').removeClass('marker polyline');

			if (layer instanceof L.Marker) {
				type.addClass('marker');
				layer.dragging.enable();
			} else {
				type.addClass('polyline')
					.css('border-color', story.color || '#00f');

				if (layer.getLatLngs && layer.getLatLngs().length < 150) {
					layer.editing.enable();
				}
			}
		}

		$('#sidebar').addClass('wide');
		$('#story').hide();
		editor.show();

		/* globals EpicEditor:true */
		var textEditor = new EpicEditor({
			basePath: '/js/lib/epiceditor'
		}).load();
		if (story.text) {
			textEditor.importFile('story', story.text);
		}
	},

	saveEdits: function () {

	},

	stopEditing: function () {
		$('#sidebar').removeClass('wide');
		$('#story').show();
		$('#editor').hide();

		if (this._layer) {
			this._layer.editing.disable();
		}

	}

});

