(function () {
	'use strict';
	/* global console:true, logIndex:true */

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


	var Saillog = L.Class.extend({
		defaultStyles: {
			leg: {
				color: '#0000ff',
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

			this.attachListeners();
		},

		loadJSON: function (name) {
			var self = this;
			$.ajax({
				url: 'data/' + name + '.geojson',
				dataType: 'json',
				success: function (response) {
					response.name = name;
					self.renderStory(response);
				},
				error: function (e) {
					console.log('Error in AJAX/parsing JSON, use `node helper.js lint to check', e);
				}
			});
		},

		renderMap: function () {
			var layer = L.tileLayer('http://a{s}.acetate.geoiq.com/tiles/acetate-hillshading/{z}/{x}/{y}.png', {
				attribution: '&copy;2012 Esri & Stamen, Data from OSM and Natural Earth',
				subdomains: '0123',
				minZoom: 2,
				maxZoom: 18
			});

			var OpenSeaMap = L.tileLayer('http://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
				attribution: 'Map data: &copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors'
			});

			var map = L.map('map', {
				center: logIndex.center,
				zoom: logIndex.zoom,
				zoomControl: false,
				layers: layer
			});

			this.layerControl = L.control.layers({}, {
				OpenSeaMap: OpenSeaMap//.addTo(map),
			}, {
				position: 'bottomleft',
				collapsed: false
			}).addTo(map);

			this.calendar = new L.CalendarControl().addTo(map);

			var self = this;
			this.features = L.geoJson(null, {
				style: function (feature) {
					var style = L.extend({}, self.defaultStyles.leg);

					if (feature.properties.color) {
						L.extend(style, {
							color: feature.properties.color
						});
					}

					return style;
				},
				onEachFeature: function (feature, layer) {
					feature.properties['id'] = L.stamp(layer);

					self.renderLegStory(feature.properties);
				}
			});
			return map;
		},

		// Remove all stuff for the stories from the map and pan to original state.
		clearMap: function () {
			var map = this.map;
			if (this.features instanceof L.FeatureGroup) {
				this.features.clearLayers();
				if (map.hasLayer(this.features)) {
					map.removeLayer(this.features);
				}
			}
			if (map.hasLayer(this.trackLayer)) {
				this.layerControl.removeLayer(this.trackLayer);
				map.removeLayer(this.trackLayer);
			}
			map.setView(logIndex.center, logIndex.zoom, {
				animate: true
			});
		},

		renderStorylist: function () {
			this.clearMap();

			var story = this.story;

			document.title = 'Jieters zeilverslagen';
			this.index.html('');

			story.find('h1').html('Jieters zeilverslagen');
			story.find('.leg').remove();
			story.find('#explanation').hide();

			if (logIndex.text !== undefined) {
				this.imagePrefix = 'data/';

				var preface = $('<div class="leg"></div>');
				preface.html(this._markup(logIndex.text));
				preface.appendTo(story);
			}

			var list = $('<ul class="selector"></ul>').appendTo(story);
			$.each(logIndex.logs, function (key, log) {
				if (log.disable && location.port !== '9999') {
					return;
				}
				var item = $('<li data-name="' + log.name + '">' + log.title + '</li>').appendTo(list);
				if (log.disable) {
					item.addClass('disabled');
				}

			});
			list.one('click', '[data-name]', function () {
				var name = $(this).data('name');
				location.hash = name;
			});
		},

		renderStory: function (data) {
			var self = this;
			var story = this.story;

			data.styles = $.extend(data.styles, this.defaultStyles);
			this.imagePrefix = 'data/' + data.name + '/';

			document.title = data.title;
			story.find('.selector').remove();
			story.find('h1').html(data.title);
			story.find('#explanation').show();
			story.find('.leg').remove();

			// refresh selector.
			this.index = $(this.index.selector);

			data.features.forEach(function (feature) {
				if (feature.geometry) {
					self.features.addData(feature);
				} else {
					// give a unique id to layers without geometry too
					feature.properties.id = L.stamp({});
					self.renderLegStory(feature.properties);
				}
			});

			if (data.trackGeojson) {
				$.ajax({
					url: 'data/' + data.name + '/track.geojson',
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
			this.features.addTo(this.map);
		},

		renderLegStory: function (leg) {
			if (leg.text !== undefined) {
				var storyText = this._markup(leg.text);

				// story for this leg.
				var legStory = $('<div class="leg">').html(storyText);

				legStory.data('leg', leg);

				if (leg.title) {
					legStory.prepend('<h3>' + leg.title + '</h3>');
				}

				if (leg.date) {
					this.calendar.addStory(leg);

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
		},

		attachListeners: function () {
			var self = this;

			// make clicks on polylines/markers refer to stories
			this.features.on('click', function (event) {
				self.story.find('.leg').each(function () {
					var leg = $(this);
					if (leg.data('leg') && leg.data('leg')['id'] === L.stamp(event.layer)) {
						leg.click();
					}
				});
			});
			this.features.on({
				mouseover: function (event) {
					var layer = event.layer;

					if (layer.setStyle) {
						layer.setStyle(self.defaultStyles.highlight);
						layer.bringToFront();
					}
					$('.leg').each(function () {
						var current = $(this);
						if (current.data('leg')['id'] === L.stamp(layer)) {
							current.addClass('hover');
						}
					});
				},
				mouseout: function (event) {
					self.features.resetStyle(event.layer);
					$('.leg').removeClass('hover');
				}
			});

			// make click on .leg highlight the leg.
			$('#story, #index').on('click', '.leg', function (event) {
				if ($(event.target).is('img, a')) {
					return;
				}
				var target = $(this);
				var leg = target.data('leg');

				// clear highlight on all layers
				self.features.eachLayer(function (layer) {
					if (layer.setStyle) {
						var style = self.defaultStyles.leg;
						// remove color while resetting...
						delete style.color;
						layer.setStyle(style);
					}
				});

				if (leg && leg['id']) {
					var current = self.features.getLayer(leg['id']);
					if (current) {
						if (current.setStyle) {
							current.setStyle(self.defaultStyles.highlight);
						}

						if (current.getBounds) {
							var bounds = current.getBounds();
							self.features.bringToFront(current);

							// compensate bounds for story on the right.
							bounds.extend([
								bounds.getNorth(),
								bounds.getEast() + 1.25 * (bounds.getEast() - bounds.getWest())
							]).pad(0.2);

							self.map.fitBounds(bounds);
						} else if (current.getLatLng) {
							self.map.panTo(current.getLatLng());
						}
					}
				}

				$('.leg').each(function () {
					var current = $(this);
					if (current.data('leg')['id'] === leg['id']) {
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

			// listen to hash changes.
			$(window).on('hashchange', function () {
				var hash = window.location.hash.slice(1);
				if (hash === '') {
					self.renderStorylist();
				} else {
					self.loadJSON(hash);
				}
			}).trigger('hashchange');

			// media modal on .thumb/.youtube
			$('body').mediaModal({
				selector: '.thumb, .youtube'
			});
		},

		// All text fields are processed by this method.
		_markup: function (string) {
			// prefix path with path to image dir.
			string = string.replace(/src="/g, 'class="thumb" src="' + this.imagePrefix);

			// Markdown img/youtube syntax: ![Alt](src), also prefixed
			var prefix = this.imagePrefix;
			string = string.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, function (match, alt, src) {
				alt = alt.trim();
				if (src.substr(0, 15) === 'http://youtu.be') {
					return '<span class="youtube" data-youtube-url="' + src + '" title="' + alt + '"><img src="style/youtube-play.png" /> ' + alt + '</span>';
				} else {
					return '<img src="' + prefix + src + '" class="thumb" title="' + alt + '"/>';
				}
			});

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

	window.saillog = new Saillog();
})();
