'use strict';

var delta = 1;

function countObj(obj) {
	var count = 0;
	for (var i in obj) {
		count++;
	}
	return count;
}

describe('story', function () {
	var json = {
		type: 'FeatureCollection',
		title: 'Test title',
		features: [
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
					foo: 'bar'
				}
			}
		]
	};

	describe('Constructing it', function () {
		it('can be constructed with json', function () {
			var story = new Saillog.Story(json);

			expect(story).to.be.a(Saillog.Story);
			expect(countObj(story.getFeatures())).to.be(1);
		});
	});
});
