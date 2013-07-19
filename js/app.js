
(function () {
	'use strict';
	/* global data:true */

	var map = setupMap();
	window.map = map;
	var lines;
	var story = $('#story');

	// present list of available stories
	if (location.hash === '') {
		renderIndex();
	} else {
		loadJSON(location.hash.slice(1));
	}
	$(window).bind('hashchange', function() {
		var hash = window.location.hash.slice(1);
		if (hash === '') {
			renderIndex();
		} else {
			loadJSON(hash);
		}
	});
	story.on('click', '[data-name]', function (event) {
		var name = $(this).data('name');
		location.hash = name;
	});

	function renderIndex() {
		story.find('h1').html('Kies een verhaal uit de lijst.');
		story.find('.leg').remove();
		story.find('#explanation').hide();
		var selector = $($.parseHTML('<ul class="selector">')).appendTo(story);

		$.each(index, function (key, value) {
			selector.append('<li data-name="' + key + '">' + value + '</li>');
		});

		if (lines instanceof L.FeatureGroup) {
			lines.clearLayers();
			if (map.hasLayer(lines)) {
				map.removeLayer(lines);
			}
		}
	};
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
			position: 'topleft',
			collapsed: false
		}).addTo(map);

		map.on('click', function (event) {
			console.log(event.latlng.toString());
		})
		return map;
	};


	function loadJSON(name) {
		$.ajax({
			url: 'data/' + name + '.json',
			dataType: 'json',
			success: function (response) {
				loadStory(name, response);
			},
			error: function (e) {
				console.log(e);
			}
		});
	};

	function loadStory(name, data) {

		document.title = data.title;
		story.find('.selector').hide();
		story.find('h1').html(data.title);
		story.find('#explanation').show();

		if (lines instanceof L.FeatureGroup) {
			map.removeLayer(lines);
			lines = null;
		}
		lines = L.featureGroup().addTo(map);

		var legs = data.legs;
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
			if (legs[i].marker) {
				var marker = L.marker(legs[i].marker).addTo(lines);
				legs[i]['_leaflet_id'] = L.stamp(marker);
			}
			if (legs[i].text) {
				var storyText = legs[i].text.replace(/src="/g, 'src="data/' + name + '/');

				// story for this leg.
				story.append(
					$('<div class="leg" id="leg' + i + '">').html(storyText)
				);
			}
		}
		if (lines.getLayers().length > 0) {
			map.fitBounds(lines.getBounds());
		}

		lines.off('click').on('click', function (event) {
			for (var i in legs) {
				if (L.stamp(event.layer) === legs[i]['_leaflet_id']) {
					$('#leg' + i).click();
				}
			}
		});

		$('#story').off('click', '.leg').on('click', '.leg', function (event) {
			if ($(event.target).is('img')) {
				return;
			}
			var id = $(this).attr('id').substr(3, 1);
			var leg = legs[id];
			console.log(legs);

			// clear highlight on all layers
			lines.eachLayer(function (layer) {
				if (layer.setStyle) {
					layer.setStyle(data.defaultStyle);
				}
			});

			if (leg && leg['_leaflet_id']) {
				var current = lines.getLayer(leg['_leaflet_id']);

				if (current) {
				 	if (current.getBounds) {
						var bounds = current.getBounds();
						lines.bringToFront(current);
						if (current.setStyle) {
							current.setStyle(data.highlightStyle);
						}

						// compensate bounds for story on the right.
						bounds.extend([
							bounds.getNorth(),
							bounds.getEast() + (bounds.getEast() - bounds.getWest())
						]);

						map.fitBounds(bounds);
					} else if (current.getLatLng) {
						map.panTo(current.getLatLng());
					}
				}
			}

			$('div.leg').not($(this)).removeClass('active');
			$(this).addClass('active');

			$.scrollTo($(this), 500);
		});
	};
})();