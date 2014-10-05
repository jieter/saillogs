'use strict';

Saillog.Leg = Saillog.Model.extend({
	defaultProperties: {
		title: '',
		text: '',
		date: '',
		color: '#000000',
		average: 5
	},

	initialize: function (json) {
		json = json || {
			properties: {}
		};
		this._originalJson = json;

		Saillog.Model.prototype.initialize.call(this, json.properties);

		this.geometry = json.geometry || {};
		this.layer = this._makeLayer(json);

		this.id = L.stamp(this.layer || {});
	},

	getType: function () {
		return this.geometry.type || 'text';
	},

	getOriginalLayer: function () {
		return this._makeLayer(this._originalJson);
	},

	getLayer: function () {
		return this.layer;
	},

	setLayer: function (layer) {
		var newLayer = this._makeLayer(layer.toGeoJSON());
		newLayer['_leaflet_id'] = L.stamp(layer);

		this.geometry = newLayer.feature.geometry;
		this.layer = newLayer;
		return this.fire('updatelayer');
	},

	highlight: function () {
		if (this.layer && this.layer.setStyle) {
			this.layer.setStyle(Saillog.defaultStyles.highlight);
			if (this.layer.bringToFront) {
				this.layer.bringToFront();
			}
		}
		return this;
	},

	unhighlight: function () {
		if (this.layer && this.layer.setStyle) {
			this.layer.setStyle(this._style());
		}
		return this;
	},

	updateColor: function (color) {
		if (this.layer) {
			this.setProperty('color', color);
			if (this.getType() === 'LineString') {
				this.layer.setStyle(this._style());
			}
		}
	},

	toGeoJSON: function () {
		var json = {
			type: 'Feature',
			properties: this.getProperties()
		};

		var layer = this.getLayer();
		if (layer) {
			layer = layer.toGeoJSON();

			json.geometry = layer.geometry;
		}

		return json;
	},

	_calculatedProperty: function (key) {
		if (this.geometry.type !== 'LineString') {
			return;
		}

		switch (key) {
		case 'distance':
			return this.layer.getDistance('nautical');

		case 'startTime':
			// only defined if it has a date.
			var date = this.getProperty('date');
			if (date && date !== '') {
				return date + 'T08:00:00';
			}
			break;
		case 'endTime':
			// only defined with startTime
			var startTime = this.getProperty('startTime');
			if (startTime && startTime !== '') {
				var d = new Date(startTime);
				var duration = this.getProperty('duration');
				d.setTime(d.getTime() + duration * 1000);

				return  d.toJSON().substr(0, 19);
			}
			break;
		case 'duration':
			if (this.hasProperty('startTime') && this.hasProperty('endTime')) {
				return Saillog.util.timeDiff(
					this.getProperty('startTime'),
					this.getProperty('endTime')
				);
			}
			var distance = this.getProperty('distance');
			var average = this.getProperty('average');
			return (distance / average) * 60 * 60;
		}
	},

	_makeLayer: function (leg) {
		if (leg.geometry) {
			var self = this;

			return L.geoJson(leg, {
				style: function () {
					return self._style();
				}
			}).getLayers()[0];
		}
	},

	_style: function () {
		var style = L.extend({}, Saillog.defaultStyles.leg);

		var color = this.getProperty('color');
		if (color && color !== '') {
			L.extend(style, {
				color: color
			});
		}

		return style;
	}
});
