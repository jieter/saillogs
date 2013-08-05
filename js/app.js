(function () {
	'use strict';
	/* global console:true, availableStories:true */

	// From http://stackoverflow.com/a/5624139
	function hexToRgb(hex) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? [
			parseInt(result[1], 16),
			parseInt(result[2], 16),
			parseInt(result[3], 16)
		] : null;
	}

	// make sure console exists
	if (!('console' in window)) {
		window.console = {
			log: function () {}
		};
	}

	// Simple img overlay...
	$.fn['imgModal'] = function () {
		var overlay = $('#modal_overlay');

		return this.each(function () {
			var el = $(this);
			el.on('click', function () {
				$('html,body').css('overflow', 'hidden');

				var img = $(this);
				var src = img.attr('src').replace('.thumb', '');

				var modal = $('<div class="modal"><span class="modal_close">&times;</span></div>');
				modal.appendTo(overlay);

				modal.css({
					'margin-left': -(modal.outerWidth() / 2) + 'px',
					'top': '100px'
				});

				modal.append('<img src="' + src + '" />');

				modal.add(overlay).one('click', function () {
					overlay.css('display', 'none');
					$('html,body').css('overflow', 'auto')
					modal.remove();
				})

				overlay.show();
				modal.show().fadeTo(200, 1);
			});
		});
	};

	// Keep a calendar with days with stories.
	var StoryIndex = L.Control.extend({
		options: {
			position: 'topleft'
		},
		onAdd: function () {
			this._container = L.DomUtil.create('div', '');
			this._container.id = 'index';

			return this._container;
		},

		container: function () {
			return $(this._container);
		},

		addStory: function (story) {
			var container = this.container();

			var parts = story.date.split('-');
			var date = new Date(parts[0], parts[1] - 1, parts[2]);
			var day = parseInt(parts[2], 10);

			var item = $('<div class="leg"></div>');
			item.data({
				'legId': story.id,
				'leg': story
			});
			item.attr('title', story.title);
			item.html(day);

			var diff = null;
			if (container.children().length < 1) {
				item.css('margin-left', (date.getDay() * 21) + 'px');
			} else {
				var last = container.children().last();
				diff = day - last.html();
				if (diff > 1) {
					// insert empty days to align days properly
					for (var j = diff; j > 1; j--) {
						container.append('<div class="filler"></div>');
					}
				}
			}
			// make weekend-days bold
			if (date.getDay() === 0 || date.getDay() === 6) {
				item.css('font-weight', 'bold');
			}
			// prevent insertion of two stories for one day.
			if (diff !== 0) {
				item.appendTo(container);
			}
		}
	});

	var Saillog = L.Class.extend({
		defaultStyles: {
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
		},

		initialize: function () {
			this.story = $('#story');
			this.index = $('#index');

			this.map = this.renderMap();
			this.features = L.featureGroup().addTo(this.map);

			// present list of available stories
			if (location.hash === '') {
				this.renderStorylist();
			} else {
				this.loadJSON(location.hash.slice(1));
			}
			var self = this;
			$(window).bind('hashchange', function () {
				var hash = window.location.hash.slice(1);
				if (hash === '') {
					self.renderStorylist();
				} else {
					self.loadJSON(hash);
				}
			});

			this.attachListeners();
		},

		loadJSON: function (name) {
			var self = this;
			$.ajax({
				url: 'data/' + name + '.json',
				dataType: 'json',
				success: function (response) {
					self.renderStory(name, response);
				},
				error: function (e) {
					console.log('Error in AJAX/parsing JSON', e);
				}
			});
		},

		renderMap: function () {
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

			this.layerControl = L.control.layers({}, {
				OpenSeaMap: OpenSeaMap,//.addTo(map),
				Labels: AcetateLabels.addTo(map)
			}, {
				position: 'bottomleft',
				collapsed: false
			}).addTo(map);


			this.storyIndex = new StoryIndex().addTo(map);

			return map;
		},

		clearMap: function () {
			var map = this.map;
			if (this.features instanceof L.FeatureGroup) {
				this.features.clearLayers();
				if (map.hasLayer(this.features)) {
					map.removeLayer(this.features);
				}
			}
			if (map.hasLayer(this.trackLayer)) {
				map.layerControl.removeLayer(this.trackLayer);
				map.removeLayer(this.trackLayer);
			}
		},

		renderStorylist: function () {
			this.clearMap();

			var story = this.story;

			document.title = 'Jieters zeilverslagen';
			story.find('h1').html('Kies een verhaal uit de lijst.');
			story.find('.leg').remove();
			story.find('#explanation').hide();
			this.index.html('');
			var selector = $($.parseHTML('<ul class="selector">')).appendTo(story);

			$.each(availableStories, function (key, value) {
				selector.append('<li data-name="' + key + '">' + value + '</li>');
			});

			story
				.off('click', '[data-name]')
				.on('click', '[data-name]', function () {
					var name = $(this).data('name');
					location.hash = name;
				});
		},

		renderStory: function (name, data) {
			var story = this.story;

			data.styles = $.extend(data.styles, this.defaultStyles);
			this.imagePrefix = name;

			document.title = data.title;
			story.find('.selector').hide();
			story.find('h1').html(data.title);
			story.find('#explanation').show();
			this.index.html('');
			// refresh selector.
			this.index = $(this.index.selector);

			for (var i in data.legs) {
				data.legs[i].id = i;
				var feature = this.renderLeg(data.legs[i], data.styles.leg);

				if (feature) {
					data.legs[i]['_leaflet_id'] = L.stamp(feature);
				}
			}

			if (data.trackGeojson) {
				var self = this;
				$.ajax({
					url: 'data/' + name + '/track.geojson',
					dataType: 'json',
					success: function (geojson) {
						self.trackLayer = L.geoJson(geojson, {
							style: data.styles.track
						}).addTo(self.map);
						self.layerControl.addOverlay(self.trackLayer, 'Opgeslagen track');
					}
				});
			}

			// Move map to newly loaded area.
			if (this.features.getLayers().length > 0) {
				this.map.fitBounds(this.features.getBounds().pad(0.2));
				if (this.map.getZoom() > 14) {
					this.map.setZoom(14);
				}
			}
		},

		renderLeg: function (leg, style) {
			var feature;

			if (leg.path) {
				if (leg.color) {
					L.Util.extend(style, { color: leg.color});
				}

				if (typeof leg.path === 'string') {
					feature = L.Polyline.fromEncoded(leg.path, style);
				} else {
					feature = L.polyline(leg.path, style);
				}
			}
			if (leg.marker) {
				feature = L.marker(leg.marker);
			}
			if (feature) {
				feature.addTo(this.features);
			}

			if (leg.text) {
				var storyText = this._markup(leg.text);

				// story for this leg.
				var legStory = $('<div class="leg">').html(storyText);

				legStory.find('img').imgModal();

				legStory.data({
					'legId': leg.id,
					'leg': leg
				});

				if (leg.title) {
					legStory.prepend('<h3>' + leg.title + '</h3>');
				}

				if (leg.date) {
					this.storyIndex.addStory(leg);

					var parts = leg.date.split('-');
					var date = parseInt(parts[2], 10) + '-' + parseInt(parts[1], 10);

					legStory.prepend('<div class="date">' + date + '</div>');
				}

				if (leg.color) {
					var rgb = hexToRgb(leg.color);
					var color = 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', 0.5)';
					legStory.css('border-left', '4px solid ' + color);
				}

				legStory.appendTo(this.story);
			}
			if (feature) {
				feature.legId = leg.id;
			}
			return feature;
		},

		attachListeners: function () {
			var self = this;
			// make clicks on polylines/markers refer to stories
			this.features.on('click', function (event) {
				if (event.layer.legId) {
					self.story.find('.leg').eq(event.layer.legId).click();
				}
			});

			$('#story, #index').on('click', '.leg', function (event) {
				if ($(event.target).is('img,a')) {
					return;
				}
				var leg = $(this).data('leg');

				// clear highlight on all layers
				self.features.eachLayer(function (layer) {
					if (layer.setStyle) {
						var style = self.defaultStyles.leg;
						// remove color while resetting...
						delete style.color;
						layer.setStyle(style);
					}
				});

				if (leg && leg['_leaflet_id']) {
					var current = self.features.getLayer(leg['_leaflet_id']);

					if (current) {
						if (current.getBounds) {
							var bounds = current.getBounds();
							self.features.bringToFront(current);
							if (current.setStyle) {
								current.setStyle(self.defaultStyles.highlight);
							}

							// compensate bounds for story on the right.
							bounds.extend([
								bounds.getNorth(),
								bounds.getEast() + (bounds.getEast() - bounds.getWest())
							]).pad(0.2);

							self.map.fitBounds(bounds);
						} else if (current.getLatLng) {
							self.map.panTo(current.getLatLng());
						}
					}
				}

				$('.leg').each(function () {
					var current = $(this);
					if (current.data('legId') === leg.id) {
						current.addClass('active');

						if (current.parent().is('#story')) {
							$.scrollTo(current, 500, {
								offset: {
									top: -20
								}
							});
						}
					} else {
						current.removeClass('active');
					}
				});
			});

		},

		_markup: function (string) {
			// prefix path with path to image dir.
			string = string.replace(/src="/g, 'src="data/' + this.imagePrefix + '/');

			// Markdown img syntax: ![Alt](src), also prefixed
			string = string.replace(/!\[([^\]]*)\]\(([^)]*)\)/g,
				'<img src="data/' + this.imagePrefix + '/$2" title="$1"/>');

			return string;
		},

		startEdit: function () {
			var drawControl = new L.Control.Draw({
				draw: {
					polygon: false,
					marker: false,
					rectangle: false,
					circle: false
				}
			});

			var map = this.map;

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
		}

	});

	return new Saillog();
})();
