
'use strict';
/* global console:true */

// make sure console exists
if (!('console' in window)) {
	window.console = {
		log: function () {}
	};
}
var Saillog = Saillog || {};

Saillog.util = {
	// From http://stackoverflow.com/a/5624139
	hexToRgb: function hexToRgb(hex) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? [
			parseInt(result[1], 16),
			parseInt(result[2], 16),
			parseInt(result[3], 16)
		] : null;
	},

	formatDistance: function formatDistance(distance) {
		distance = L.Util.formatNum(distance, 1).toString().split('.');
		if (!distance[1]) {
			distance[1] = 0;
		}
		return distance.join('.');
	},

	isDev: function () {
		return location.port === '9999';
	}
};

Saillog.App = L.Class.extend({
	includes: L.Mixin.Events,
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
			color: '#000000',
			weight: 1,
			dashArray: [4, 4]
		}
	},

	initialize: function (index) {
		this._index = index;

		this.story = $('#story');
		this.index = $('#index');

		this.renderMap();

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
				console.log('Error in AJAX/parsing JSON, use `grunt geojsonhint to check geojson files.', e);
			}
		});
	},

	renderMap: function () {
		var map = this.map = L.map('map', {
			center: this._index.center,
			zoom: this._index.zoom,
			zoomControl: false,
		});

		this.baselayer = L.tileLayer('http://a{s}.acetate.geoiq.com/tiles/acetate-hillshading/{z}/{x}/{y}.png', {
			attribution: '&copy;2012 Esri & Stamen, Data from OSM and Natural Earth',
			subdomains: '0123',
			minZoom: 2,
			maxZoom: 18
		}).addTo(map);

		this.openseamap = L.tileLayer('http://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
			attribution: 'Map data: &copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors'
		});

		this.layerControl = L.control.layers({}, {
			OpenSeaMap: this.openseamap
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
				if (layer instanceof L.Polyline) {
					feature.properties['distance'] = Saillog.util.formatDistance(layer.getDistance());
				}
				self.renderLegStory(feature.properties);
			}
		});
		return this;
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
		map.setView(this._index.center, this._index.zoom, {
			animate: true
		});

		this.calendar.clear();
		return this;
	},

	renderStorylist: function () {
		this.clearMap();

		var story = this.story;

		document.title = 'Jieters zeilverslagen';
		this.calendar.clear();

		story.find('h1').html('Jieters zeilverslagen');
		story.find('.leg').remove();
		story.find('#explanation').hide();

		if (this._index.text !== undefined) {
			this.imagePrefix = 'data/';

			var preface = $('<div class="leg"></div>');
			preface.html(this._markup(this._index.text));
			preface.appendTo(story);
		}

		var list = $('<ul class="selector"></ul>').appendTo(story);
		$.each(this._index.logs, function (key, log) {
			if (!log.visible && !Saillog.util.isDev()) {
				return;
			}
			var item = $('<li data-name="' + log.name + '">' + log.title + '</li>').appendTo(list);
			if (!log.visible) {
				item.addClass('disabled');
			}

		});
		list.one('click', '[data-name]', function () {
			var name = $(this).data('name');
			location.hash = name;
		});
		this.fire('loaded-index');
	},

	renderStory: function (data) {
		var self = this;
		self.clearMap();

		var story = this.story;

		data.styles = $.extend(data.styles, this.defaultStyles);
		this.imagePrefix = 'data/' + data.name + '/';

		document.title = data.title;
		story.find('.selector').remove();
		story.find('h1').html(data.title);
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

		if (data.showOpenseamap) {
			this.openseamap.addTo(this.map);
		}

		// Move map to newly loaded area.
		if (this.features.getLayers().length > 0) {
			this.fitBounds(this.features.getBounds());
			if (this.map.getZoom() > 14) {
				this.map.setZoom(14);
			}
		}
		this.features.addTo(this.map);

		console.log('fire loaded-story');
		this.fire('loaded-story');
	},

	fitBounds: function (bounds) {
		this.map.fitBounds(bounds, {
			paddingBottomRight: [this.story.width() * 1.11, 0]
		});
	},

	renderLegStory: function (leg) {
		if (leg.text !== undefined) {
			var storyText = this._markup(leg.text);

			// story for this leg.
			var legStory = $('<div class="leg">').html(storyText);

			legStory.data('leg', leg);

			if (leg.title) {
				var title = $('<h3>' + leg.title + '</h3>');
				if (leg.distance) {
					var tooltip = 'gevaren ';
					if (leg.duration) {
						var hour = 60 * 60;
						var hours = Math.floor(leg.duration / hour);
						var duration = hours + ':' + Math.floor((leg.duration - hours * hour) / 60);
						tooltip += 'in ' + duration + ' uur, ';
					}
					if (leg['avg_sog']) {
						tooltip += 'met een gemiddelde snelheid van ' + leg['avg_sog'] + 'kts';
					}
					title.append('<span class="distance" title="' + tooltip + '">' + leg.distance + ' NM</span>');
				}
				title.prependTo(legStory);
			}

			if (leg.date) {
				this.calendar.addStory(leg);

				var parts = leg.date.split('-');
				var date = parseInt(parts[2], 10) + '-' + parseInt(parts[1], 10);

				legStory.prepend('<div class="date">' + date + '</div>');
			}

			if (leg.color) {
				var rgb = Saillog.util.hexToRgb(leg.color);
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
						self.fitBounds(current.getBounds());
						self.features.bringToFront(current);
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
				return '<span class="youtube" data-youtube-url="' + src + '" title="' + alt + '"><i class="icon-youtube-play"></i> ' + alt + '</span>';
			} else {
				return '<img src="' + prefix + src + '" class="thumb" title="' + alt + '"/>';
			}
		});

		return string;
	},

	startEdit: function () {
		this.editor = new Saillog.Editor(this);
		return this.editor;
	}
});

$.getJSON('data/index.json', function (index) {
	var saillog = window.saillog = new Saillog.App(index);

	if (Saillog.util.isDev()) {
		saillog.startEdit();

		// after 0,5s click on an
		setTimeout(function () {
			$('#story .edit').eq(3).click();
		}, 500);
	}
});

