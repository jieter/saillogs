(function () {
	'use strict';
	/* global data:true */

	var legs = data.legs;
	document.title = data.title;
	$('#story h1').html(data.title);

	var esri = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
		maxZoom: 16
	});
	var map = L.map('map', {
		center: [51.6, 4.4],
		zoom: 10,
		zoomControl: false,
		layers: esri
	});

	var lines = L.featureGroup().addTo(map);

	for (var i in legs) {
		if (legs[i].path) {
			var poly;
			var style = L.Util.extend({}, data.defaultStyle, {
				color: legs[i].color
			});

			if (typeof legs[i].path === 'string') {
				poly = L.Polyline.fromEncoded(legs[i].path, style);
			} else {
				poly = L.polyline(legs[i].path, style);
			}

			poly.addTo(lines);

			legs[i]['_leaflet_id'] = L.stamp(poly);
		}

		// story for this leg.
		$('#story').append(
			$('<div class="leg" id="leg' + i + '">').html(legs[i].text)
		);
	}

	lines.on('click', function (event) {
		for (var i in legs) {
			if (L.stamp(event.layer) === legs[i]['_leaflet_id']) {
				$('#leg' + i).click();
			}
		}
	});


	$('#story').on('click', '.leg', function () {
		var id = $(this).attr('id').substr(3, 1);
		var leg = legs[id];

		if (leg['_leaflet_id']) {
			var currentPoly = lines.getLayer(leg['_leaflet_id']);
			var bounds = currentPoly.getBounds();

			lines.bringToFront(currentPoly);
			lines.eachLayer(function (layer) {
				layer.setStyle(data.defaultStyle);
			});

			currentPoly.setStyle(data.highlightStyle);

			// Compensate bounds for story on the right.
			bounds.extend([
				bounds.getNorth(),
				bounds.getEast() + (bounds.getEast() - bounds.getWest())
			]);

			map.fitBounds(bounds);
		}

		$('div.leg').not($(this)).removeClass('active');
		$(this).addClass('active');

		$.scrollTo($(this), 500);
	});
})();