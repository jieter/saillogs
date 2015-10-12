'use strict';

Saillog.Map = L.Map.extend({
	options: {
		zoomControl: false,
		attributionControl: false,
		center: [52, 3],
		zoom: 7
	},
	initialize: function (app) {
		this.app = app;

		L.Map.prototype.initialize.call(this, 'map');

		this.initLayers();
		//this.initControls();
	},

	initControls: function () {
		this.layerControl = L.control.layers({}, {
			OpenSeaMap: this.layers.openseamap
		}, {
			position: 'bottomleft',
			collapsed: false
		}).addTo(this);
	},

	initLayers: function () {
		this.layers = {};
		this.layers.base = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', {
			attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			subdomains: '1234'
		}).addTo(this);

		this.layers.sat =  L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.{ext}', {
			type: 'sat',
			ext: 'jpg',
			attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency',
			subdomains: '1234'
		});

		this.layers.openseamap = L.tileLayer('http://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
			attribution: 'Map data: &copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors',
			minZoom: 9
		}).addTo(this);

		L.control.layers({
			'Kaart': this.layers.base,
			'Satelliet': this.layers.sat
		}, {
			'Open Seamap': this.layers.openseamap
		}, {
			position: 'topleft'
		}).addTo(this);
	},

	replaceBaseLayer: function (layer) {
		this.layers.oldbase = this.layers.base;
		this.layers.base = L.tileLayer(layer.url, layer.options);
	},

	fitBounds: function (bounds) {
		if (bounds) {
			L.Map.prototype.fitBounds.call(this, bounds, {
				paddingBottomRight: [this.app.sidebarPadding(), 0]
			});
		}
	},

	panTo: function (thing, zoom) {
		if (!thing) {
			return this;
		}

		if (Saillog.util.isArray(thing) && thing.length > 0) {
			return this.setView(thing, zoom);
		}
		if (thing.bringToFront) {
			thing.bringToFront();
		}
		if (thing.getBounds) {
			this.fitBounds(thing.getBounds());
		} else if (thing.getLatLng) {
			L.Map.prototype.panTo.call(this, thing.getLatLng(), {
				paddingBottomRight: [this.app.sidebarPadding(), 0]
			});
		}
		return this;
	},

	maxZoom: function (zoom) {
		if (this.getZoom() > zoom) {
			this.setZoom(zoom);
		}
		return this;
	}
});
