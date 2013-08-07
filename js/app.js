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

	// Simple media overlay...
	$.fn['mediaModal'] = function (options) {
		options = $.extend({
			selector: '.thumb',
			ytTemplate: '<iframe id="ytplayer" class="modal_content" type="text/html" ' +
				'src="http://www.youtube.com/embed/{id}?autoplay=1" frameborder="0"/>'
		}, options);

		var overlay = $('#modal_overlay');
		var modal = $('<div class="modal"><span class="modal_close">&times;</span></div>');
		modal.appendTo(overlay);

		var load = function (el) {
			var content;
			if (el.data('youtube-url')) {
				var ytId = el.data('youtube-url').substr(-11);

				modal.find('.modal_content').remove();
				var iframe = $(options.ytTemplate.replace('{id}', ytId));
				iframe.css({
					width: modal.innerWidth() + 'px',
					height: modal.innerHeight() + 'px'
				});

				content = iframe.appendTo(modal);
			} else {
				var src = el.attr('src').replace('.thumb', '');

				modal.find('iframe').remove();
				var img = modal.find('img');
				if (img.length !== 1) {
					img = $('<img src="' + src + '" class="modal_content" />').appendTo(modal);
				}
				content = img.attr('src', src);
			}

			// add caption
			if (el.attr('title') && el.attr('title') !== '') {
				var caption = modal.find('.caption');
				if (caption.length !== 1) {
					caption = $('<span class="caption"></span>').prependTo(modal);
				}
				caption.html(el.attr('title'));
			}
			return content;
		};

		var resize = function () {
			var content = modal.find('.modal_content');
			var border = parseInt(modal.css('border-left-width'), 10) * 2;
			modal.css({
				'width': content.width() + border,
				'height': content.height() + border
			});

			modal.css({
				'margin-left': -(modal.outerWidth() / 2) + 'px'
			});
		};
		var closeModal = function () {
			overlay.fadeOut(200, function () {
				overlay.css('display', 'none');
			});
			modal.fadeOut(200, function () {
				modal.find('img, iframe').remove();
			});
			overlay.add(modal).off('click');
		};

		return this.each(function () {
			var container = $(this);

			var jumpFrom = function (el, direction) {
				var thumbs = container.find(options.selector);
				var currentId = thumbs.index(el);
				var other;
				if (direction > 0) { // 39 = Right arrow
					other = thumbs.eq(currentId + 1);
				} else { // 37 = Left arrow
					other = thumbs.eq(currentId - 1)
				}
				if (other && other.length == 1) {
					load(other).on('load', resize);

					return other;
				}
				return el;
			};

			container.on('click', options.selector, function () {
				var el = $(this);
				var content = load(el);

				content.on('load', function () {
					overlay.show();
					modal.show().fadeTo(200, 1, resize);
				});

				// close handler
				overlay.add(modal).on('click', function (event) {
					var target = $(event.target);
					if (target.is('img.modal_content')) {
						var offset = target.offset();
						if (event.clientX - offset.left > target.width() / 2) {
							el = jumpFrom(el, 1);
						} else {
							el = jumpFrom(el, -1);
						}
						event.preventDefault();
						event.stopPropagation();
					} else {
						closeModal();
					}
				});

				// some keyboard controls
				$(window).on('keyup', function (event) {
					if (event.keyCode === 27) { // 27 = Escape
						closeModal();
						$(window).off('keyup');
					} else {
						event.preventDefault();

						if (event.keyCode === 39) { // 39 = Right arrow
							el = jumpFrom(el, 1)
						} else if (event.keyCode === 37) { // 37 = Left arrow
							el = jumpFrom(el, -1)
						}

					}
				});
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
			this.features = L.featureGroup();

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

			this.storyIndex = new StoryIndex().addTo(map);
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

			var list = $($.parseHTML('<ul class="selector">')).appendTo(story);
			$.each(logIndex.logs, function (key, log) {
				list.append('<li data-name="' + log.name + '">' + log.title + '</li>');
			});
			list.one('click', '[data-name]', function () {
				var name = $(this).data('name');
				location.hash = name;
			});
		},

		renderStory: function (name, data) {
			var story = this.story;

			data.styles = $.extend(data.styles, this.defaultStyles);
			this.imagePrefix = 'data/' + name + '/';

			document.title = data.title;
			story.find('.selector').remove();
			story.find('h1').html(data.title);
			story.find('#explanation').show();
			story.find('.leg').remove();

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
			this.features.addTo(this.map);
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

			if (leg.text !== undefined) {
				var storyText = this._markup(leg.text);

				// story for this leg.
				var legStory = $('<div class="leg">').html(storyText);

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

			// make click on .leg hightlight the leg.
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
