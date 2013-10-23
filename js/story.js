'use strict';

Saillog.Story = L.Class.extend({
	defaultProperties: {
		title: '',
		description: '',
		average: 5,
		showTimeline: true
	},
	defaultLegProperties: {
		title: '',
		text: '',
		date: '',
		color: '#ffffff'
	},
	includes: L.Mixin.Events,

	initialize: function (story) {
		var self = this;

		this.id = story.id;
		this.properties = Saillog.util.default(story.properties, this.defaultProperties);
		this.legs = {};

		this.layer = L.featureGroup()
			.on({
				'click mouseover mouseout': function (event) {
					self.fire(event.type + '-leg', {
						legId: event.layer.feature.properties.id
					});
				}
			}, this);

		story.features.forEach(this.addLeg, this);

		if (story.properties.showTrack) {
			this.track = L.geoJson(null, {
				style: Saillog.defaultStyles.track
			});
			this._loadTrack();
		}
	},

	addLeg: function (leg) {
		if (!leg) {
			leg = {
				type: 'Feature',
				properties: {}
			};
		} else {
			leg.properties._isSaved = true;
		}

		if (leg.geometry) {
			leg.layer = this._makeLayer(leg);

			this.layer.addLayer(leg.layer);
		}
		leg.properties.id =  L.stamp(leg.layer || {});

		this._augmentLegProperties(leg);

		this.legs[leg.properties.id] = leg;
		return leg.properties.id;
	},

	_makeLayer: function (leg) {
		return L.geoJson(leg, { style: this._legStyle }).getLayers()[0];
	},

	_augmentLegProperties: function (leg) {
		Saillog.util.default(leg.properties, this.defaultLegProperties);

		if (leg.geometry && leg.geometry.type === 'LineString') {
			// remove approximated stuff first
			if (leg.properties._isApprox) {
				leg.properties._isApprox.forEach(function (key) {
					delete leg.properties[key];
				});
			}

			leg.properties.distance = leg.layer.getDistance('nautical');
			leg.properties._isApprox = ['distance'];

			var hasDate = leg.properties.date || leg.properties.date === '';

			if (!leg.properties.startTime && hasDate) {
				leg.properties.startTime = leg.properties.date + 'T08:00:00';
				leg.properties._isApprox.push('startTime');
			}

			if (!leg.properties.endTime) {
				var d = new Date(leg.properties.startTime);
				var duration = (leg.properties.distance / this.properties.average) * 60 * 60;
				d.setTime(d.getTime() + duration * 1000);
				leg.properties.endTime = d.toJSON().substr(0, 19);
				leg.properties._isApprox.push('endTime');
			}
			if (!leg.properties.duration) {
				leg.properties.duration = Saillog.util.timeDiff(
					leg.properties.endTime,
					leg.properties.startTime
				);
				leg.properties._isApprox.push('duration');
			}
		}
	},

	each: function (fn, context) {
		context = context || this;
		for (var key in this.legs) {
			fn.call(context, this.legs[key]);
		}
		return this;
	},

	save: function (callback) {
		var data = {
			id: this.id,
			properties: this.properties,
			features: []
		};

		this.each(function (leg) {
			var legData = leg.layer ?
				leg.layer.toGeoJSON() :
				{ type: 'Feature' };
			delete legData.layer;

			legData.properties = L.extend({}, leg.properties);
			if (legData.properties._isApprox) {
				legData.properties._isApprox.forEach(function (key) {
					delete legData.properties[key];
				});
				delete legData.properties._isApprox;
			}
			delete legData.properties._isSaved;

			data.features.push(legData);
		});

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

	getLegs: function () {
		return this.legs;
	},

	length: function () {
		var length = 0;
		this.each(function () {
			length++;
		});
		return length;
	},

	removeLeg: function (id) {
		if (!this.legs[id]) {
			return this;
		}

		var leg = this.legs[id];

		if (this.layer.hasLayer(leg.layer)) {
			this.layer.removeLayer(leg.layer);
		}

		delete this.legs[id];
		return this;
	},

	getProperties: function (id) {
		if (id) {
			return this.legs[id].properties;
		} else {
			return this.properties;
		}
	},

	setProperties: function (id, properties) {
		if (!properties) {
			this.properties = id;
		} else {
			if (!this.legs[id]) {
				throw 'No such feature id:' + id;
			}
			var leg = this.legs[id];

			leg.properties = properties;

			// update color
			if (leg.layer && leg.layer.setStyle) {
				this.updateColor(id, properties.color);
			}

			// geometry is changed, update approximated values
			this._augmentLegProperties(this.legs[id]);
		}
		return this;
	},

	getLayer: function (id) {
		return this.legs[id].layer;
	},

	replaceLayer: function (id, newLayer) {
		var leg = this.getLegs()[id];
		var geojson = newLayer.toGeoJSON();

		if (leg.geometry && leg.geometry.type === geojson.geometry.type) {
			if (leg.geometry.type === 'Point') {
				leg.layer.setLatLng(newLayer.getLatLng());
			} else if (leg.geometry.type === 'LineString') {
				leg.layer.setLatLngs(newLayer.getLatLngs());
			}
		} else {
			// replace layer, but set original leaflet_id
			this.layer.removeLayer(leg.layer);

			newLayer = this._makeLayer(geojson);
			newLayer['_leaflet_id'] = (id + 0);

			leg.layer = newLayer;
			leg.geometry = geojson.geometry;

			this.layer.addLayer(newLayer);
			this._augmentLegProperties(leg);
		}

		return this;
	},

	updateColor: function (id, color) {
		var leg = this.getLegs(id);

		if (leg.layer && leg.layer.setStyle) {
			this.getLegs()[id].layer.setStyle({
				color: color
			});
		}
	},

	getTimes: function () {
		var first, last;
		this.each(function (leg) {
			if (!first && leg.properties.startTime) {
				first = leg.properties.startTime;
			}
			if (leg.properties.endTime) {
				if (!last || leg.properties.endTime > last) {
					last = leg.properties.endTime;

				}
			}
		});

		// add some margin.
		first = first ? first.substr(0, 11) + '00:00:00' : first;

		return {
			offset: function (timestamp) {
				return Saillog.util.timeDiff(timestamp, first);
			},
			start: first,
			end: last,
			span: Saillog.util.timeDiff(last, first)
		};
	},


	highlight: function (id) {
		var self = this;
		// clear highlights
		this.each(function (feature) {
			if (feature.layer && feature.layer.setStyle) {
				feature.layer.setStyle(self._legStyle(feature));
			}
		});

		if (!id || !this.legs[id] || !this.legs[id].layer) {
			return this;
		}

		var current = this.legs[id].layer;
		if (current.setStyle) {
			current.setStyle(Saillog.defaultStyles.highlight);
		}
		if (current.bringToFront) {
			current.bringToFront();
		}

		return this;
	},

	_legStyle: function (leg) {
		var style = L.extend({}, Saillog.defaultStyles.leg);

		if (leg.properties.color) {
			L.extend(style, {
				color: leg.properties.color
			});
		}

		return style;
	},

	_loadTrack: function () {
		var story = this;
		$.ajax({
			url: 'data/' + story.id + '/track.geojson',
			dataType: 'json',
			success: function (geojson) {
				story.track.addData(geojson);

				// TODO add to layerControl
				// self.layerControl.addOverlay(self.trackLayer, 'Opgeslagen track');
			}
		});
	},

	getBounds: function () {
		var bounds;
		this.each(function (leg) {
			if (leg.layer && leg.layer.getBounds) {
				if (bounds) {
					bounds.extend(leg.layer.getBounds());
				} else {
					bounds = L.latLngBounds(leg.layer.getBounds());
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
	},

	closestPosition: function (date) {
		date = new Date(date);

		var ret;
		this.each(function (leg) {
			var within = date >= (new Date(leg.properties.startTime)) &&
			             date <= (new Date(leg.properties.endTime));

			if (within) {
				ret = leg.layer.getBounds().getCenter();
			}
		});

		return ret || this.getBounds().getCenter();
	}
});

Saillog.Story.emptyStory = function (id) {
	return new Saillog.Story({
		id: id,
		properties: {
			title: id
		},
		type: 'FeatureGroup',
		features: []
	});
};