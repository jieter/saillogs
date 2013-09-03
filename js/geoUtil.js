(function () {
	'use strict';

	if (L) {
		L.Polyline.include({
			_distanceMeters: function () {
				var latlngs = this.getLatLngs();

				if (latlngs.length < 2) {
					return 0;
				}

				var distance = 0;
				for (var i = 1; i < latlngs.length; i++) {
					distance += latlngs[i - 1].distanceTo(latlngs[i]);
				}

				return distance;
			},
			getDistance: function (metricSystem) {
				var meters = this._distanceMeters();

				switch (metricSystem || 'nautical') {
				case 'nautical':
					return meters / 1852;

				case 'imperial':
					return meters / 1609;

				default:
					return meters;
				}
			}
		});
	}

})();