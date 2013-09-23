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

Saillog.App = L.Class.extend({
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

		this.storyWidget = new Saillog.Widget.Story(this.sidebar);
		this.calendarControl = new Saillog.CalendarControl().addTo(this._map._map);

		this._attachLegActions(this.storyWidget);
		this._attachLegActions(this.calendarControl);

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
		this.calendarControl.hide();
	},

	showStory: function () {
		var story = this._story;
		var app = this;
		this._attachLegActions(story);

		Saillog.util.imagePrefix = 'data/' + story.id + '/';

		this._map.addLayer('story', story);
		this._map.panTo(story);

		this.storyWidget.update(story);
		this.calendarControl.update(story);
	},

	showEditor: function () {

	},

	_attachLegActions: function (emitter) {
		emitter.on({
			'click-leg': this._legClick,
			'mouseover-leg': this._legHover,
			'mouseout-leg': function () {
				this._highlight();
			}
		}, this);
	},

	_legClick: function (event) {
		var legId = event.legId;

		this._highlight(legId);
		this._map.panTo(this._story.getLayer(legId));

		$.scrollTo($('#leg-story-' + legId), 500, {
			offset: {
				top: -20
			}
		});
	},

	_legHover: function (event) {
		var legId = event.legId;
		this._highlight(legId);
	},

	_highlight: function (id) {
		this._story.highlight(id);
		this.storyWidget.highlight(id);
		this.calendarControl.highlight(id);
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