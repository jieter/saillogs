'use strict';

var delta = 0.1;

var json = {
	id: 'test-story',
	type: 'FeatureCollection',
	properties: {
		title: 'Test title',
		showTimeline: true
	},
	features: [
		{
			type: 'Feature',
			properties: {
				text: 'Without geometry'
			}
		},
		{
			type: 'Feature',
			geometry: {
				type: 'LineString',
				coordinates: [
					[0, 1],
					[1, 1],
					[1, 0],
					[0, 1]
				]
			},
			properties: {
				startTime: '2013-08-29T17:45:00',
				endTime: '2013-08-30T13:39:00'
			}
		},
		{
			type: 'Feature',
			geometry: {
				type: 'LineString',
				coordinates: [
					[2, 2],
					[3, 4],
					[5, 6]
				]
			},
			properties: {
				startTime: '2013-09-01T17:45:00',
				endTime: '2013-09-02T13:39:00'
			}
		}
	]
};

var story;
beforeEach(function () {
	story = new Saillog.Story(json);
});
afterEach(function () {
	story = null;
});

describe('Saillog.Story', function () {
	chai.should();

	describe('Constructing it', function () {
		it('can be constructed with json', function () {
			story.should.be.an.instanceof(Saillog.Story);
			story.length().should.eql(3);
		});

		it('gets default properties', function () {
			story.properties.should.contain.key('description', 'title', 'average');
		});
	});

	describe('getTimes()', function () {
		it('should report the correct timespan', function () {
			var times = story.getTimes();

			times.start.should.eql('2013-08-29T00:00:00');
			times.end.should.eql('2013-09-02T13:39:00');
			times.span.should.eql(394740);
		});
	});

	describe('each()', function () {
		it('iterates over each leg', function () {
			var count = 0;

			story.each(function (leg) {
				leg.should.be.an.instanceof(Saillog.Leg);
				count++;
			});

			count.should.equal(story.length());
		});
	});

	describe('addLeg()', function () {
		it('should add a leg', function () {
			var id = story.addLeg();

			var leg = story.getLeg(id);
			leg.getType().should.eql('text');
			leg.properties.should.contain.keys('title', 'date', 'text', 'color');
		});
	});

	describe('removeLeg()', function () {
		it('should remove the leg correctly', function () {
			var id = story.addLeg();
			story.removeLeg(id).should.equal(story);

			story.length().should.eql(3);
		});
	});

	describe('replaceLayer', function () {
		var id, leg;

		beforeEach(function () {
			id = story.addLeg({
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [1, 1]
				},
				properties: {
					title: 'testPoint',
					date: '2013-10-25'
				}
			});
			leg = story.getLeg(id);
		});

		it('should replace the Point with a Point', function () {
			leg.getType().should.equal('Point');

			var newLayer = L.marker([2, 2]);
			story.replaceLayer(id, newLayer).should.equal(story);

			leg.getType().should.equal('Point');

			story.getLeg(id).id.should.equal(id);
			L.stamp(story.getLeg(id).layer).should.equal(id);

			var latlng = story.getLayer(id).getLatLng();
			latlng.lat.should.equal(2);
			latlng.lng.should.equal(2);
		});

		it('should replace the Point with a LineString', function () {
			leg.getType().should.equal('Point');

			var newLayer = L.polyline([[1, 1], [2, 2], [3, 3]]);
			story.replaceLayer(id, newLayer).should.equal(story);

			leg.getType().should.equal('LineString');

			L.stamp(story.getLeg(id).layer).should.equal(id);

			leg.getProperty('distance').should.be.closeTo(170, delta);
		});
	});

	describe('getProperties', function () {
		it('returns story properties without arg', function () {
			var props = story.getProperties();
			props.should.contain.keys('description', 'title', 'average');
		});
	});

	describe('setProperties', function () {
		it('sets properties for story');
		it('returns this');
	});

	describe('emptyStory', function () {
		it('returns a nice empty story');
	});

	describe('Saving it', function () {
	//  // TODO: fix fakeXHR stuff
	// 	// http://sinonjs.org/docs/#respond
	// 	var xhr, requests;
	// 	before(function () {
	// 		xhr = sinon.useFakeXMLHttpRequest();
	// 		requests = [];
	// 		xhr.onCreate = function (req) {
	// 			requests.push(req);
	// 		};
	// 	});

	// 	after(function () {
	// 		xhr.restore();
	// 	});

	// 	it('should save the story to the API', function (done) {
	// 		var callback = sinon.spy();

	// 		var story = new Saillog.Story(json);
	// 		story.save(callback);

	// 		requests.should.have.length(1);
	// 		//requests[0].url.should.match('/api/save/' + json.id);

	// 		requests[0].respond(200, {
	// 				"Content-Type": "application/json"
	// 			},
	// 			'{"success":true}'
	// 		);

	// 		callback.calledOnce.should.be.true;
	// 	});
	});
});
