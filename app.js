(function () {
	'use strict';
	/* global data:true */

	var map = setupMap();
	var story = $('#story');

	// present list of available stories
	if (location.hash === '') {
		var selector = $($.parseHTML('<ul class="selector">')).appendTo(story);
		$.each(index, function (key, value) {
			selector.append('<li data-name="' + key + '">' + value + '</li>');
		});
		story.on('click', '[data-name]', function (event) {
			var name = $(this).data('name');
			console.log(name);
			loadJSON(name);
		});
	} else {
		load(location.hash.slice(1));
	}

	function setupMap() {
		var layer =  L.tileLayer("http://a{s}.acetate.geoiq.com/tiles/terrain/{z}/{x}/{y}.png", {
			attribution: '&copy;2012 Esri & Stamen, Data from OSM and Natural Earth',
			subdomains: '0123',
			minZoom: 2,
			maxZoom: 18
		});

		var OpenSeaMap = L.tileLayer("http://tiles.openseamap.org/seamark/{z}/{x}/{y}.png", {
			attribution: 'Map data: &copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors'
		});
		var Acetate_labels = L.tileLayer("http://a{s}.acetate.geoiq.com/tiles/acetate-labels/{z}/{x}/{y}.png", {
			attribution: '&copy;2012 Esri & Stamen, Data from OSM and Natural Earth',
			subdomains: '0123',
			minZoom: 2,
			maxZoom: 18
		});

		var map = L.map('map', {
			center: [51.6, 3],
			zoom: 8,
			zoomControl: false,
			layers: layer
		});

		L.control.layers({}, {
			OpenSeaMap: OpenSeaMap.addTo(map),
			Labels: Acetate_labels.addTo(map)
		}, {
			position: 'topleft'
		}).addTo(map);
		return map;
	};


	function loadJSON(name) {
		console.log(name);
		$.ajax({
			url: 'data/' + name + '.json',
			dataType: 'json',
			success: function (response) {
				loadStory(response);
			},
			error: function (e) {
				console.log(e);
			}
		});
	};

	function loadStory(data) {
		var legs = data.legs;
		document.title = data.title;
		story.find('.selector').hide();
		story.find('h1').html(data.title);
		story.find('.explanation').show();


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
			story.append(
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

		$('#story').on('click', '.leg', function (event) {
			if ($(event.target).is('img')) {
				return;
			}
			var id = $(this).attr('id').substr(3, 1);
			var leg = legs[id];

			// clear highlight on all layers
			lines.eachLayer(function (layer) {
				layer.setStyle(data.defaultStyle);
			});

			if (leg['_leaflet_id']) {
				var currentPoly = lines.getLayer(leg['_leaflet_id']);
				var bounds = currentPoly.getBounds();

				lines.bringToFront(currentPoly);

				currentPoly.setStyle(data.highlightStyle);

				// compensate bounds for story on the right.
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
	};
})();