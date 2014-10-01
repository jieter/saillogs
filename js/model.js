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

	hasProperty: function (key) {
		return key in this.properties;
	},

	getProperty: function (key) {
		if (this.hasProperty(key)) {
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
		if (!this.hasProperty(key) || value !== this.getProperty(key)) {
			this.properties[key] = value;
			this.fire('update', {
				property: key
			});
		}
		return this;
	},

	_calculatedProperty: function (key) {
		throw 'nothing implemented for key:' + key;
	},

	template: function (str) {
		var self = this;
		return str.replace(/\{ *([\w_|]+) *\}/g, function (str, key) {
			var parts = key.split('|');

			if (parts.length === 2) {
				if (parts[1] in Saillog.util.format) {
					return Saillog.util.format[parts[1]](
						self.getProperty(parts[0])
					);
				}
				throw 'unknown formatter';
			} else {
				return self.getProperty(key);
			}
		});
	}
});
