'use strict';

Saillog.Map = L.Class.extend({
	initialize: function (app) {
		this.app = app;

		this._map = L.map('map', {
			center: [50, 2],
			zoom: 12,
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

		layers.baselayer = L.tileLayer('http://a{s}.acetate.geoiq.com/tiles/acetate-hillshading/{z}/{x}/{y}.png', {
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
			this._map.panTo(thing.getLatLng());
		}
	},

	maxZoom: function (zoom) {
		if (this._map.getZoom() > zoom) {
			this._map.setZoom(zoom);
		}
		return this;
	},

	clear: function () {
		// var map = this._map;
		// if (this.features instanceof L.FeatureGroup) {
		// 	this.features.clearLayers();
		// 	if (map.hasLayer(this.features)) {
		// 		map.removeLayer(this.features);
		// 	}
		// }
		// if (map.hasLayer(this.trackLayer)) {
		// 	this.layerControl.removeLayer(this.trackLayer);
		// 	map.removeLayer(this.trackLayer);
		// }
		// map.setView(this._index.center, this._index.zoom, {
		// 	animate: true
		// });

		// this.calendar.clear();
		return this;
	}
});