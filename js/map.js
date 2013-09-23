'use strict';

Saillog.Map = L.Class.extend({
	options: {
		center: [50, 2],
		zoom: 12
	},
	initialize: function (app) {
		this.app = app;

		this._map = L.map('map', {
			center: this.options.center,
			zoom: this.options.zoom,
			zoomControl: false,
		});

		this.initLayers();
	},

	initControls: function () {
		this.layerControl = L.control.layers({}, {
			OpenSeaMap: this.layers.openseamap
		}, {
			position: 'bottomleft',
			collapsed: false
		}).addTo(this._map);
	},

	initLayers: function () {
		var layers = this.layers = {};

		layers.base = L.tileLayer('http://a{s}.acetate.geoiq.com/tiles/acetate-hillshading/{z}/{x}/{y}.png', {
			attribution: '&copy;2012 Esri & Stamen, Data from OSM and Natural Earth',
			subdomains: '0123',
			minZoom: 2,
			maxZoom: 18
		}).addTo(this._map);

		layers.openseamap = L.tileLayer('http://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
			attribution: 'Map data: &copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors'
		});

	},

	map: function () {
		return this._map;
	},

	fitBounds: function (bounds) {
		this._map.fitBounds(bounds, {
			paddingBottomRight: [this.app.sidebarPadding(), 0]
		});
	},

	panTo: function (thing, zoom) {
		if (Saillog.util.isArray(thing)) {
			this._map.panTo(thing);
			if (zoom) {
				this._map.setZoom(zoom);
			}
			return;
		}
		if (thing.bringToFront) {
			thing.bringToFront();
		}
		if (thing.getBounds) {
			this.fitBounds(thing.getBounds());
		} else if (thing.getLatLng) {
			this._map.panTo(thing.getLatLng(), {
				paddingBottomRight: [this.app.sidebarPadding(), 0]
			});
		}
	},

	maxZoom: function (zoom) {
		if (this._map.getZoom() > zoom) {
			this._map.setZoom(zoom);
		}
		return this;
	},

	clear: function () {
		var map = this._map;

		if (map.hasLayer(this.layers.track)) {
			this.layerControl.removeLayer(this.layers.track);
			map.removeLayer(this.layers.track);
		}

		return this;
	},

	addLayer: function (name, layer) {
		this.layers[name] = layer;
		layer.addTo(this._map);
	},

	removeLayer: function (name) {
		if (this.layers[name]) {
			this.layers[name].onRemove(this._map);
		}
	}
});