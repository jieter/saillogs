/**
 * Saillog main app.
 */
'use strict';

Saillog.Story = L.Class.extend({
	initialize: function (story) {
		this._story = story;

		this.id = story.id;
		this.title = story.title;
		this.features = {};


		var id, layer;
		var self = this;
		story.features.forEach(function (feature) {
			if (feature.geometry) {
				feature.layer = L.geoJson(feature);
				id = L.stamp(feature);
			} else {
				id = L.stamp({});
			}

			feature.properties.id = id;
			console.log(feature);
			self.features[id] = feature;
		});
	},

	each: function (fn, context) {
		context = context || this;
		for (var key in this.features) {
			fn.call(context, this.features[key]);
		}
	},

	getBounds: function () {
		var bounds;
		this.each(function (feature) {
			if (feature.layer) {
				if (bounds) {
					bounds.extend(feature.layer.getBounds());
				} else {
					bounds = L.latLngBounds(feature.layer.getBounds());
				}
			}
		});

		return bounds;
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
			.on({'click-leg': this.legClick}, this);

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

		this.indexWidget.update(this._index);
	},

	showStory: function () {
		var story = this._story;

		Saillog.util.imagePrefix = 'data/' + story.id + '/';

		this._map.panTo(story);
		this.storyWidget.update(story);
	},

	showEditor: function () {

	},

	legClick: function (event) {
		var legId = event.legId;

		console.log(legId, event.target);
	},

	sidebarPadding: function () {
		return this.sidebar.width() * 1.11;
	},

	loadIndex: function (callback) {
		var app = this;

		$.getJSON('data/index.json', function (index) {
			app._index = index;
			callback(index);
		});
	},
	loadStory: function (id, callback) {
		var app = this;

		$.getJSON('data/' + id + '.geojson', function (response) {
			response.id = id; // TODO: put this in json response.
			// TODO: data structure here.
			app._story = new Saillog.Story(response);
			callback();
		});
	}
});


window.saillog = new Saillog.App();