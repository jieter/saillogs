'use strict';

function countObj(obj) {
	var count = 0;
	/*jshint unused:true */
	for (var i in obj) {
		count++;
	}
	/*jshint unused:false */
	return count;
}

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
			countObj(story.getLegs()).should.eql(3);
		});

		it('gets default properties', function () {

			story.properties.should.contain.key('description', 'title', 'average');
		});

		it('adds distance to the properties of LineStrings', function () {
			var legs = story.getLegs();
			for (var id in legs) {
				if (legs[id].geometry && legs[id].geometry.type === 'LineString') {
					story.getProperties(id).should.contain.keys('distance', 'duration');
				} else {
					story.getProperties(id).should.not.contain.key('distance', 'duration');
				}
			}
		});
	});


	describe('getTimes()', function () {
		it('should report the correct timespan', function () {
			var times = story.getTimes();
			times.start.should.eql('2013-08-29T17:45:00');
			times.end.should.eql('2013-09-02T13:39:00');
			times.span.should.eql(330840);
		});
	});

	describe('addLeg()', function () {
		it('should add a leg', function () {
			var id = story.addLeg();

			var leg = story.getLegs()[id];
			leg.should.contain.keys('type', 'properties');
			leg.properties.should.contain.keys('title', 'date', 'text', 'color');
		});
	});

	describe('removeLeg()', function () {
		it('should remove the leg correctly', function () {
			var id = story.addLeg();
			story.removeLeg(id).should.equal(story);

			countObj(story.legs).should.eql(3);
		});
	});

	describe('getProperties', function () {
		it('returns story properties without arg', function () {
			var props = story.getProperties();
			props.should.contain.keys('description', 'title', 'average');
		});
		it('returns leg properties when called with id ', function () {
			var legs = story.getLegs();
			for (var id in legs) {
				var props = story.getProperties(id);

				props.should.equal(legs[id].properties);
				props.should.contain.keys('id', 'title');
				if (legs[id].geometry) {
					props.should.contain.keys('startTime', 'duration', 'endTime');
				}
			}
		});
	});

	describe('setProperties', function () {
		it('sets properties for story');
		it('sets properties for legs');
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
