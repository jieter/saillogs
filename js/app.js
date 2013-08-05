(function () {
	'use strict';
	/* global console:true, index:true */

	var map = setupMap();
	var lines;
	var trackLayer;
	var story = $('#story');
	var index = $('#index');

	// present list of available stories
	if (location.hash === '') {
		renderStorylist();
	} else {
		loadJSON(location.hash.slice(1));
	}
	$(window).bind('hashchange', function () {
		var hash = window.location.hash.slice(1);
		if (hash === '') {
			renderStorylist();
		} else {
			loadJSON(hash);
		}
	});
	story.on('click', '[data-name]', function () {
		var name = $(this).data('name');
		location.hash = name;
	});

	function renderStorylist() {
		document.title = 'Jieters zeilverslagen';
		story.find('h1').html('Kies een verhaal uit de lijst.');
		story.find('.leg').remove();
		story.find('#explanation').hide();
		index.html('');
		var selector = $($.parseHTML('<ul class="selector">')).appendTo(story);

		$.each(availableStories, function (key, value) {
			selector.append('<li data-name="' + key + '">' + value + '</li>');
		});

		if (lines instanceof L.FeatureGroup) {
			lines.clearLayers();
			if (map.hasLayer(lines)) {
				map.removeLayer(lines);
			}
		}
		if (map.hasLayer(trackLayer)) {
			map._layerControl.removeLayer(trackLayer);
			map.removeLayer(trackLayer);
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
			position: 'bottomleft',
			collapsed: false
		}).addTo(map);


		map._indexControl = new (L.Control.extend({
			options: {
				position: 'topleft'
			},
			onAdd: function () {
				var container = L.DomUtil.create('div', '');
				container.id = 'index';

				return container;
			}
		}))();

		map._indexControl.addTo(map);

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

		map.on('click', function (event) {
			console.log({
				click: event.latlng.toString(),
				center: map.getCenter().toString(),
				zoom: map.getZoom()
			});
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
		var defaultStyles = {
			leg: {
				color: '#00f',
				opacity: 0.4,
				weight: 3
			},
			highlight: {
				opacity: 0.7,
				weight: 5
			},
			track: {
				color: '#000',
				weight: 1,
				dashArray: [4, 4]
			}
		};

		data.styles = $.extend(data.styles, defaultStyles);

		document.title = data.title;
		story.find('.selector').hide();
		story.find('h1').html(data.title);
		story.find('#explanation').show();
		index.html('');

		if (lines instanceof L.FeatureGroup) {
			map.removeLayer(lines);
			lines = null;
		}
		lines = L.featureGroup().addTo(map);

		var legs = data.legs;
		for (var i in legs) {
			if (legs[i].path) {
				var poly;
				var style = L.Util.extend({}, data.styles.leg);
				if (legs[i].color) {
					L.Util.extend(style, { color: legs[i].color});
				}

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
				legStory.find('img').attr('title', 'Klik voor een grotere versie');
				legStory.data('legId', i);

				var legIndex = $('<div class="leg"></div>');
				legIndex.data('legId', i);

				if (legs[i].title) {
					legStory.prepend('<h3>' + legs[i].title + '</h3>');
					legIndex.attr('title', legs[i].title);
				}

				if (legs[i].date) {
					var dateParts = legs[i].date.split('-');
					var dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
					var month = parseInt(dateParts[1], 10);
					var day = parseInt(dateParts[2], 10);
					var date = day + '-' + month;

					legStory.prepend('<div class="date">' + date + '</div>');

					legIndex.html(day);

					var diff = null;
					if (index.children().length < 1) {
						legIndex.css('margin-left', (dateObj.getDay() * 21) + 'px');
					} else {
						var last = index.children().last();
						diff = day - last.html();
						if (diff > 1) {
							// insert empty days.
							for (var j = diff; j > 1; j--) {
								index.append('<div class="filler"></div>');
							}
						}
					}
					// make weekend-days bold
					if (dateObj.getDay() === 0 || dateObj.getDay() === 6) {
						legIndex.css('font-weight', 'bold');
					}
					if (diff !== 0) {
						legIndex.appendTo(index);
					}
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
					trackLayer = L.geoJson(geojson, {
						style: data.styles.track
					}).addTo(map);
					map._layerControl.addOverlay(trackLayer, 'Opgeslagen track');

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
					$('#story .leg').eq(i).click();
				}
			}
		});

		$('#story, #index').off('click', '.leg').on('click', '.leg', function (event) {
			if ($(event.target).is('img,a')) {
				return;
			}
			var id = $(this).data('legId');
			var leg = legs[id];

			// clear highlight on all layers
			lines.eachLayer(function (layer) {
				if (layer.setStyle) {
					var style = data.styles.leg;
					// remove color while resetting...
					delete style.color;
					layer.setStyle(style);
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
				if (leg.data('legId') === id) {
					leg.addClass('active');

					if (leg.parent().is('#story')) {
						$.scrollTo(leg, 500, {
							offset: {
								top: -20
							}
						});
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
