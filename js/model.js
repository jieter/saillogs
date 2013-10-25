'use strict';

Saillog.Model = L.Class.extend({
	includes: L.Mixin.Events,

	properties: {},
	defaultProperties: {},

	initialize: function (properties) {
		this.properties = Saillog.util.default(properties, this.defaultProperties);
	},

	getProperties: function () {
		return this.properties;
	},

	getProperty: function (key) {
		if (this.properties[key]) {
			return this.properties[key];
		} else {
			return this._calculatedProperty(key);
		}
	},

	setProperties: function (obj) {
		for (var key in obj) {
			this.setProperty(key, obj[key]);
		}
		return this;
	},

	setProperty: function (key, value) {
		if (value !== this.getProperty(key)) {
			this.properties[key] = value;
			this.fire('update', {
				property: key
			});
		}
		return this;
	},

	_calculatedProperty: function (key) {
		throw 'nothing implemented for key:' + key;
	}
});