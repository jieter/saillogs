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
		}

		if (leg.geometry) {
			leg.layer = L.geoJson(leg, {
				style: this._legStyle
			}).getLayers()[0];

			this.layer.addLayer(leg.layer);

			leg.properties.id = L.stamp(leg.layer);
		} else {
			leg.properties.id = L.stamp({});
		}

		this._augmentLegProperties(leg);

		this.legs[leg.properties.id] = leg;
		return leg.properties.id;
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

			if (!leg.properties.startTime && leg.properties.date) {
				leg.properties.startTime = leg.properties.date + 'T08:00:00';
				leg.properties._isApprox.push('startTime');
			}

			if (!leg.properties.endTime) {
				var d = new Date(leg.properties.startTime);
				var duration = (leg.properties.distance / this.properties.average) * 60 * 60;
				if (isNaN(duration)) {
					throw 'error in duration calculation';
				}
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

			this.legs[id].properties = properties;
			// geometry is changed, sodate approximated values
			this._augmentLegProperties(this.legs[id]);
		}
		return this;
	},

	getLayer: function (id) {
		return this.legs[id].layer;
	},

	getTimes: function () {
		var first, last;
		this.each(function (leg) {
			if (!first && leg.properties.startTime) {
				first = leg.properties.startTime;
			}
			if (leg.properties.endTime) {
				last = leg.properties.endTime;
			}
		});

		return {
			offset: function (timestamp) {
				return Saillog.util.timeDiff(timestamp, first);
			},
			start: first,
			end: last,
			span: Saillog.util.timeDiff(last, first)
		};
	},

	each: function (fn, context) {
		context = context || this;
		for (var key in this.legs) {
			fn.call(context, this.legs[key]);
		}
		return this;
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