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

describe('Saillog.Story', function () {
	chai.should();

	var json = {
		id: 'test-story',
		type: 'FeatureCollection',
		title: 'Test title',
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

	describe('Constructing it', function () {
		it('can be constructed with json', function () {
			var story = new Saillog.Story(json);

			story.should.be.an.instanceof(Saillog.Story);
			countObj(story.getFeatures()).should.eql(3);
		});

		it('adds distance to the properties of LineStrings', function () {
			var story = new Saillog.Story(json);

			var legs = story.getFeatures();
			for (var id in legs) {
				if (legs[id].geometry && legs[id].geometry.type === 'LineString') {
					console.log(story.getProperties(id));
					story.getProperties(id).should.contain.keys('distance', 'duration');
				} else {
					story.getProperties(id).should.not.contain.key('distance', 'duration');
				}
			}
		});
	});

	describe('some methods', function () {
		var story = new Saillog.Story(json);

		it('should report the correct timespan', function () {
			var times = story.getTimes();
			times.start.should.eql('2013-08-29T17:45:00');
			times.end.should.eql('2013-09-02T13:39:00');
			times.span.should.eql(330840);
		});
	});

	describe('Saving it', function () {
		before(function () {
			sinon.spy($, 'ajax');
		});
		after(function () {
			$.ajax.restore();
		});

		it('should save the story to the API', function (done) {
			var story = new Saillog.Story(json);
			story.save(function () {
				$.ajax.calledOnce.should.be.true;

				done();

			});
		});
	});
});
