'use strict';

Saillog.Story = L.Class.extend({
	includes: L.Mixin.Events,

	initialize: function (story) {
		var self = this;

		this._story = story;

		this.id = story.id;
		this.title = story.title;
		this.features = {};

		this.layer = L.featureGroup()
			.on({
				'click mouseover mouseout': function (event) {
					self.fire(event.type + '-leg', {
						legId: event.layer.feature.properties.id
					});
				}
			}, this);

		var id;
		story.features.forEach(function (feature) {
			if (feature.geometry) {
				feature.layer = L.geoJson(feature, {
					style: self._featureStyle
				}).getLayers()[0];

				self.layer.addLayer(feature.layer);

				id = L.stamp(feature.layer);
			} else {
				id = L.stamp({});
			}

			feature.properties.id = id;
			self.features[id] = feature;
		});

		if (story.trackGeojson) {
			this.track = L.geoJson(null, {
				style: Saillog.defaultStyles.track
			});
			this._loadTrack();
		}
	},

	getProperties: function (id) {
		this.features[id].properties;
	},

	getLayer: function (id) {
		return this.features[id].layer;
	},

	each: function (fn, context) {
		context = context || this;
		for (var key in this.features) {
			fn.call(context, this.features[key]);
		}
	},

	highlight: function (id) {
		var self = this;
		// clear highlights
		this.each(function (feature) {
			if (feature.layer && feature.layer.setStyle) {
				feature.layer.setStyle(self._featureStyle(feature));
			}
		});

		if (!id || !this.features[id] || !this.features[id].layer) {
			return this;
		}

		var current = this.features[id].layer;
		if (current.setStyle) {
			current.setStyle(Saillog.defaultStyles.highlight);
		}
		if (current.bringToFront) {
			current.bringToFront();
		}

		return this;
	},

	_featureStyle: function (feature) {
		var style = L.extend({}, Saillog.defaultStyles.leg);

		if (feature.properties.color) {
			L.extend(style, {
				color: feature.properties.color
			});
		}

		return style;
	},

	_loadTrack: function () {
		var self = this;
		$.ajax({
			url: 'data/' + this._story.id + '/track.geojson',
			dataType: 'json',
			success: function (geojson) {
				self.track.addData(geojson);

				// TODO add to layerControl
				// self.layerControl.addOverlay(self.trackLayer, 'Opgeslagen track');
			}
		});
	},

	getBounds: function () {
		var bounds;
		this.each(function (feature) {
			if (feature.layer && feature.layer.getBounds) {
				if (bounds) {
					bounds.extend(feature.layer.getBounds());
				} else {
					bounds = L.latLngBounds(feature.layer.getBounds());
				}
			}
		});

		return bounds;
	},

	onAdd: function (map) {
		if (this.track) {
			this.track.addTo(map);
		}
		this.layer.addTo(map);

		return this;
	},

	onRemove: function (map) {
		if (map.hasLayer(this.layer)) {
			map.removeLayer(this.layer);
		}
		if (map.hasLayer(this.track)) {
			map.removeLayer(this.track);
		}
		return this;
	},

	addTo: function (map) {
		this.onAdd(map);
	}
});