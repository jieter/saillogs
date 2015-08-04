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
		this.layers.base = L.tileLayer('http://a{s}.acetate.geoiq.com/tiles/acetate-hillshading/{z}/{x}/{y}.png', {
			attribution: '&copy;2012 Esri & Stamen, Data from OSM and Natural Earth',
			subdomains: '0123',
			minZoom: 2,
			maxZoom: 18
		}).addTo(this);

		this.layers.openseamap = L.tileLayer('http://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
			attribution: 'Map data: &copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors',
			minZoom: 9
		}).addTo(this);
	},

	replaceBaseLayer: function (layer) {
		var base = this.layers.base;

		for (var key in layer.options) {
			base.options[key] = layer.options[key];
		}
		base.setUrl(layer.url);
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
