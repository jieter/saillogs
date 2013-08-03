(function () {
	'use strict';
	/* global console:true, index:true */

	var map = setupMap();
	var lines;
	var story = $('#story');

	// present list of available stories
	if (location.hash === '') {
		renderIndex();
	} else {
		loadJSON(location.hash.slice(1));
	}
	$(window).bind('hashchange', function () {
		var hash = window.location.hash.slice(1);
		if (hash === '') {
			renderIndex();
		} else {
			loadJSON(hash);
		}
	});
	story.on('click', '[data-name]', function () {
		var name = $(this).data('name');
		location.hash = name;
	});

	function renderIndex() {
		document.title = 'Jieters zeilverslagen';
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
	}
	function setupMap() {
		var layer =  L.tileLayer('http://a{s}.acetate.geoiq.com/tiles/terrain/{z}/{x}/{y}.png', {
			attribution: '&copy;2012 Esri & Stamen, Data from OSM and Natural Earth',
			subdomains: '0123',
			minZoom: 2,
			maxZoom: 18
		});

		var OpenSeaMap = L.tileLayer('http://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
			attribution: 'Map data: &copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors'
		});
		var AcetateLabels = L.tileLayer('http://a{s}.acetate.geoiq.com/tiles/acetate-labels/{z}/{x}/{y}.png', {
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

		map._layerControl = L.control.layers({}, {
			OpenSeaMap: OpenSeaMap.addTo(map),
			Labels: AcetateLabels.addTo(map)
		}, {
			position: 'topleft',
			collapsed: false
		}).addTo(map);

		map.on('click', function (event) {
			console.log({
				click: event.latlng.toString(),
				center: map.getCenter().toString(),
				zoom: map.getZoom()
			});
		});
		console.log(map);
		return map;
	}

	window.startEdit = function () {
		var drawControl = new L.Control.Draw({
			draw: {
				polygon: false,
				marker: false,
				rectangle: false,
				circle: false
			}
		});

		drawControl.addTo(map);
		map.on('draw:created', function (event) {
			var layer = event.layer;
			layer.setStyle({
				color: '#000000'
			});
			map.addLayer(layer);

			var dump = [];
			var latLngs = layer.getLatLngs();
			for (var i in latLngs) {
				dump.push([
					L.Util.formatNum(latLngs[i].lat, 5),
					L.Util.formatNum(latLngs[i].lng, 5)
				]);
			}
			console.log(JSON.stringify(dump));
		});
	};

	function loadJSON(name) {
		$.ajax({
			url: 'data/' + name + '.json',
			dataType: 'json',
			success: function (response) {
				loadStory(name, response);
			},
			error: function (e) {
				console.log('Error in AJAX/parsing JSON', e);
			}
		});
	}

	function loadStory(name, data) {

		document.title = data.title;
		story.find('.selector').hide();
		story.find('h1').html(data.title);
		story.find('#explanation').show();
		$('#index').html('');

		if (lines instanceof L.FeatureGroup) {
			map.removeLayer(lines);
			lines = null;
		}
		lines = L.featureGroup().addTo(map);

		var legs = data.legs;
		for (var i in legs) {
			if (legs[i].path) {
				var poly;
				var style = L.Util.extend({}, data.styles.default, {
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
				var legStory = $('<div class="leg">').html(storyText);
				legStory.data('legId', i);

				if (legs[i].date) {
					var dateParts = legs[i].date.split('-');
					var date = dateParts[2] + '-' + parseInt(dateParts[1]);

					legStory.prepend('<div class="date">' + date + '</div>');

					var legIndex = $('<div class="leg">' + date + '</div>').appendTo($('#index'));
					legIndex.data('legId', i);
				}

				if (legs[i].title) {
					legStory.prepend('<h2>' + legs[i].title + '</h2>');
				}

				if (legs[i].color) {
					var rgb = hexToRgb(legs[i].color);
					var color = 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', 0.5)';
					legStory.css('border-left', '4px solid ' + color);
				}

				legStory.appendTo(story);
			}

		}

		if (data.trackGeojson) {
			$.ajax({
				url: 'data/' + name + '/track.geojson',
				dataType: 'json',
				success: function (geojson) {
					var track = L.geoJson(geojson, {
						style: data.styles.track
					});
					map._layerControl.addOverlay(track.addTo(map), 'track');

				}
			});
		}

		// Move map to newly loaded area.
		if (lines.getLayers().length > 0) {
			map.fitBounds(lines.getBounds().pad(0.2));
			if (map.getZoom() > 14) {
				map.setZoom(14);
			}
		}

		lines.off('click').on('click', function (event) {
			for (var i in legs) {
				if (L.stamp(event.layer) === legs[i]['_leaflet_id']) {
					$('#leg' + i).click();
				}
			}
		});

		$('#story, #index').off('click', '.leg').on('click', '.leg', function (event) {
			if ($(event.target).is('img')) {
				return;
			}
			var id = $(this).data('legId');
			var leg = legs[id];

			// clear highlight on all layers
			lines.eachLayer(function (layer) {
				if (layer.setStyle) {
					layer.setStyle(data.styles['default']);
				}
			});

			if (leg && leg['_leaflet_id']) {
				var current = lines.getLayer(leg['_leaflet_id']);

				if (current) {
					if (current.getBounds) {
						var bounds = current.getBounds();
						lines.bringToFront(current);
						if (current.setStyle) {
							current.setStyle(data.styles.highlight);
						}

						// compensate bounds for story on the right.
						bounds.extend([
							bounds.getNorth(),
							bounds.getEast() + (bounds.getEast() - bounds.getWest())
						]).pad(0.2);

						map.fitBounds(bounds);
					} else if (current.getLatLng) {
						map.panTo(current.getLatLng());
					}
				}
			}

			$('.leg').each(function () {
				var leg = $(this);
				if (leg.data('legId') == id) {
					leg.addClass('active');

					if (leg.parent().is('#story')) {
						$.scrollTo(leg, 500);
					}
				} else {
					leg.removeClass('active');
				}
			});


		});
	}

	// From http://stackoverflow.com/a/5624139
	function hexToRgb(hex) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? [
			parseInt(result[1], 16),
			parseInt(result[2], 16),
			parseInt(result[3], 16)
		] : null;
	}

	if (!('console' in window)) {
		window.console = {
			log: function () {}
		};
	}
})();
