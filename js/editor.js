'use strict';

var Saillog = Saillog || {};

Saillog.Editor = L.Class.extend({
	initialize: function (saillog) {
		this._saillog = saillog;
		this.map = saillog.map;

		this.initControls();
	},
	initControls: function () {
		var map = this.map;

		// var drawControl = new L.Control.Draw({
		// 	draw: {
		// 		polygon: false,
		// 		marker: true,
		// 		rectangle: false,
		// 		circle: false
		// 	}
		// }).addTo(map);

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
	}
});
