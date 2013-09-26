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

				if (feature.geometry.type === 'LineString') {
					feature.properties.distance = feature.layer.getDistance('nautical');
				}

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

	save: function (callback) {
		var data = L.extend({}, this._story);
		data.features = [];

		var json;
		this.each(function (feature) {
			if (feature.layer) {
				json = feature.layer.toGeoJSON();
			} else {
				json = {
					type: 'Feature'
				};
			}
			delete json.layer;
			json.properties = L.extend({}, feature.properties);
			delete json.properties.distance;

			data.features.push(json);
		});

		console.log(data);

		$.ajax({
			url: '/api/save/' + data.id,
			method: 'post',
			dataType: 'json',
			data: {
				data: JSON.stringify(data)
			}
		}).success(function (response) {
			if (callback) {
				callback(response);
			}
		});
		return this;
	},

	getFeatures: function () {
		return this.features;
	},

	getProperties: function (id) {
		return this.features[id].properties;
	},

	setProperties: function (id, properties) {
		if (!this.features[id]) {
			throw 'No such feature id:' + id;
		}
		this.features[id].properties = properties;
		return this;
	},

	getLayer: function (id) {
		return this.features[id].layer;
	},

	each: function (fn, context) {
		context = context || this;
		for (var key in this.features) {
			fn.call(context, this.features[key]);
		}
		return this;
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