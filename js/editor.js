'use strict';

var Saillog = Saillog || {};

Saillog.Editor = L.Class.extend({
	initialize: function (saillog) {
		this._saillog = saillog;
		this.map = saillog.map;

		this.initControls();
		if (window.location.hash !== '') {
			this.initStoryControls();
		}
		saillog.on({
			'loaded-story': this.initStoryControls
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

		$('#story').on('click', '.edit', function (e) {
			e.preventDefault();
			e.stopPropagation();
			console.log('edit clicked');
		});
	}
});
