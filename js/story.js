'use strict';


Saillog.Story = Saillog.Model.extend({
	defaultProperties: {
		title: '',
		description: '',
		average: 5,
		showTimeline: true,
		showCalendar: true,
		units: 'nm'
	},

	initialize: function (story) {
		story.properties = story.properties || {};
		Saillog.Model.prototype.initialize.call(this, story.properties);

		var self = this;

		this.id = story.id;
		this.legs = [];

		this.layer = L.featureGroup()
			.on({
				'click mouseover mouseout': function (event) {
					self.fire(event.type + '-leg', {
						legId: L.stamp(event.layer)
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


	each: function (fn, context) {
		this.legs.forEach(fn, context);
	},

	getLegs: function () {
		return this.legs;
	},

	getLeg: function (id) {
		// make sure we are comparing numbers
		id = +id;

		var ret;
		this.each(function (leg) {
			if (leg.id === id) {
				ret = leg;
			}
		});
		return ret;
	},

	hasLeg: function (id) {
		return this.getLeg(id) !== undefined;
	},

	addLeg: function (leg) {
		if (!(leg instanceof Saillog.Leg)) {
			leg = new Saillog.Leg(leg);
		}
		this.legs.push(leg);
		this.fire('addleg', {
			leg: leg
		});

		if (leg.layer) {
			this.layer.addLayer(leg.layer);
		}

		return leg.id;
	},

	removeLeg: function (id) {
		var leg = this.getLeg(id);

		if (!leg) {
			return;
		}

		if (this.layer.hasLayer(leg.layer)) {
			this.layer.removeLayer(leg.layer);
		}

		this.legs.splice(this.legs.indexOf(leg));

		return this;
	},

	length: function () {
		return this.legs.length;
	},

	save: function (callback) {
		var data = this._toGeoJSON();
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

	_toGeoJSON: function () {
		var legs = [];
		this.each(function (leg) {
			legs.push(leg.toGeoJSON());
		});

		return {
			id: this.id,
			properties: this.properties,
			features: legs
		};
	},

	getLayer: function (id) {
		var leg = this.getLeg(id);
		if (leg && leg.layer) {
			return leg.layer;
		}
	},

	replaceLayer: function (id, newLayer) {
		var leg = this.getLeg(id);

		// If no newLayer supplied, revert to orignal state.
		if (!newLayer) {
			newLayer = leg.getOriginalLayer();
		}

		newLayer['_leaflet_id'] = id;
		leg.setLayer(newLayer);

		return newLayer;
	},

	updateColor: function (id, color) {
		this.getLeg(id).updateColor(color);
		return this;
	},

	getTimes: function () {
		var first, last, startTime, endTime;
		this.each(function (leg) {
			startTime = leg.getProperty('startTime');
			endTime = leg.getProperty('endTime');

			if (!first && startTime) {
				first = startTime;
			}

			if (endTime && (!last || endTime > last)) {
				last = endTime;
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
		this.each(function (leg) {
			if (id !== undefined && leg.id === id) {
				leg.highlight();
			} else {
				leg.unhighlight();
			}
		});
		return this;
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
			var within = date >= (new Date(leg.getProperty('startTime'))) &&
			             date <= (new Date(leg.getProperty('endTime')));

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
