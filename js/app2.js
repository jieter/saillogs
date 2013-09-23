/**
 * Saillog main app.
 */
'use strict';

Saillog.defaultStyles = {
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
};

Saillog.Story = L.Class.extend({
	includes: L.Mixin.Events,

	initialize: function (story) {
		var self = this;

		this._story = story;

		this.id = story.id;
		this.title = story.title;
		this.features = {};

		this.layer = L.featureGroup()
			.on({
				'click mouseover mouseout': function (event) {
					self.fire(event.type + '-leg', {
						legId: event.layer.feature.properties.id
					});
				//console.log(event.type)
				}
			}, this);

		var id;
		story.features.forEach(function (feature) {
			if (feature.geometry) {
				feature.layer = L.geoJson(feature, {
					style: self._featureStyle
				}).getLayers()[0];

				self.layer.addLayer(feature.layer);

				id = L.stamp(feature.layer);
			} else {
				id = L.stamp({});
			}

			feature.properties.id = id;
			self.features[id] = feature;
		});

		if (story.trackGeojson) {
			this.track = L.geoJson(null, {
				style: Saillog.defaultStyles.track
			});
			this._loadTrack();
		}
	},

	getLayer: function (id) {
		return this.features[id].layer;
	},

	each: function (fn, context) {
		context = context || this;
		for (var key in this.features) {
			fn.call(context, this.features[key]);
		}
	},

	highlight: function (id) {
		var self = this;
		// clear highlights
		this.each(function (feature) {
			if (feature.layer && feature.layer.setStyle) {
				feature.layer.setStyle(self._featureStyle(feature));
			}
		});

		if (id && !this.features[id].layer) {
			return this;
		}

		var current = this.features[id].layer;
		if (current.setStyle) {
			current.setStyle(Saillog.defaultStyles.highlight);
		}
		if (current.bringToFront) {
			current.bringToFront();
		}

		return this;
	},

	_featureStyle: function (feature) {
		var style = L.extend({}, Saillog.defaultStyles.leg);

		if (feature.properties.color) {
			L.extend(style, {
				color: feature.properties.color
			});
		}

		return style;
	},

	_loadTrack: function () {
		var self = this;
		$.ajax({
			url: 'data/' + this._story.id + '/track.geojson',
			dataType: 'json',
			success: function (geojson) {
				self.track.addData(geojson);

				// TODO add to layerControl
				// self.layerControl.addOverlay(self.trackLayer, 'Opgeslagen track');
			}
		});
	},

	getBounds: function () {
		var bounds;
		this.each(function (feature) {
			if (feature.layer && feature.layer.getBounds) {
				if (bounds) {
					bounds.extend(feature.layer.getBounds());
				} else {
					bounds = L.latLngBounds(feature.layer.getBounds());
				}
			}
		});

		return bounds;
	},

	onAdd: function (map) {
		if (this.track) {
			this.track.addTo(map);
		}
		this.layer.addTo(map);

		return this;
	},

	onRemove: function (map) {
		if (map.hasLayer(this.layer)) {
			map.removeLayer(this.layer);
		}
		if (map.hasLayer(this.track)) {
			map.removeLayer(this.track);
		}
		return this;
	},

	addTo: function (map) {
		this.onAdd(map);
	}
});

Saillog.App = L.Class.extend({
	includes: L.Mixin.Events,

	initialize: function () {
		var app = this;
		this.sidebar = $('#sidebar');

		this._map = new Saillog.Map(this);
		this.indexWidget = new Saillog.Widget.Index(this.sidebar).on({
			'click-story': function (e) {
				var id = e.id;
				window.location.hash = '#' + id;
			}
		});

		this.storyWidget = new Saillog.Widget.Story(this.sidebar)
			.on({
				'click-leg': this._legClick,
				'mouseover-leg': this._legHover,
				'mouseout-leg': this._clearHighlight
			}, this);

		this.loadIndex(function () {
			$(window).on('hashchange', function () {
				var hash = window.location.hash.slice(1);

				if (hash === '') {
					app.showIndex();
				} else {
					app.loadStory(hash, function () {
						app.showStory();
					});
				}
			}).trigger('hashchange');
		});

		$('body').mediaModal({
			selector: '.thumb, .youtube'
		});
	},

	showIndex: function () {
		Saillog.util.imagePrefix = 'data/';

		this._map.panTo(this._index.center, this._index.zoom);
		this._map.maxZoom(14);

		this._map.clear();
		if (this._story) {
			this._map.removeLayer('story');
		}

		this.indexWidget.update(this._index);
	},

	showStory: function () {
		var story = this._story;
		story
			.on({'click-leg': this._legClick}, this);

		Saillog.util.imagePrefix = 'data/' + story.id + '/';

		this._map.addLayer('story', story);
		this._map.panTo(story);

		this.storyWidget.update(story);
	},

	showEditor: function () {

	},

	_legClick: function (event) {
		var legId = event.legId;

		this._story.highlight(legId);
		this._map.panTo(this._story.getLayer(legId));

		$.scrollTo($('#leg-story-' + legId), 500, {
			offset: {
				top: -20
			}
		});
	},

	_legHover: function (event) {
		var legId = event.legId;
		console.log('hover', legId);

		this._story.highlight(legId);
	},

	_clearHighlight: function () {
		this._story.highlight();
	},

	sidebarPadding: function () {
		return this.sidebar.width() + 200;
	},

	loadIndex: function (callback) {
		var app = this;

		$.getJSON('data/index.json', function (index) {
			app._index = index;
			callback();
		});
	},

	loadStory: function (id, callback) {
		var app = this;

		$.getJSON('data/' + id + '.geojson', function (response) {
			response.id = id; // TODO: put this in json response.

			app._story = new Saillog.Story(response);
			callback();
		});
	}
});


window.saillog = new Saillog.App();