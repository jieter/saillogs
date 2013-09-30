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
					foo: 'bar',
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

			expect(story).to.be.a(Saillog.Story);
			expect(countObj(story.getFeatures())).to.be(3);
		});

		it('adds distance to the properties of LineStrings', function () {
			var story = new Saillog.Story(json);

			var legs = story.getFeatures();
			for (var id in legs) {
				if (legs[id].geometry && legs[id].geometry.type === 'LineString') {
					expect(story.getProperties(id)).to.have.key('distance');
				} else {
					expect(story.getProperties(id)).to.not.have.key('distance');
				}
			}
		});
	});

	describe('some methods', function () {
		var story = new Saillog.Story(json);

		it('should report the correct timespan', function () {
			var times = story.getTimes();
			expect(times.start).to.be('2013-08-29T17:45:00');
			expect(times.end).to.be('2013-09-02T13:39:00');
			expect(times.span).to.be(330840);
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
				expect($.ajax.calledOnce).to.be.ok();

				done();

			});
		});
	});
});
