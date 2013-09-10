'use strict';

var Saillog = Saillog || {};

Saillog.Editor = L.Class.extend({
	initialize: function (saillog) {
		this.saillog = saillog;
		this.map = saillog.map;

		this.initControls();
		if (window.location.hash !== '') {
			this.initStoryControls();
		}
		saillog.off('loaded-story');
		saillog.on({
			'loaded-story': this.initStoryControls,
			'loaded-index': this.stopEditing
		}, this);
	},

	initControls: function () {
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
	},
	initStoryControls: function () {
		$('#story h3').each(function () {
			$('<span class="edit"></span>')
				.append('<i class="icon-edit-sign"></i></span>')
				.appendTo(this);
		});
		var self = this;

		$('#story').on('click', '.edit', function (e) {
			e.preventDefault();
			e.stopPropagation();
			console.log('edit clicked');

			self.editStory($(this).parents('.leg').data('leg'));
		});
	},

	editStory: function (story) {
		console.log(story,
			story.id);
		this.editLayer = this.saillog.features.getLayer(story.id);

		var editor = $('#editor');

		for (var key in story) {
			editor.find('[name=' + key + ']').val(story[key]);
		}
		$('#story').hide();
		editor.show();

		if (this.editLayer._latlngs.length < 150) {
			this.editLayer.editing.enable();
		}
	},

	stopEditing: function () {
		$('#story').show();
		$('#editor').hide();
		if (this.editLayer) {
			this.editLayer.editing.disable();
		}
	}

});

