'use strict';

var delta = 1;

function countObj(obj) {
	var count = 0;
	for (var i in obj) {
		count++;
	}
	return count;
}

describe('Saillog.Story', function () {
	var json = {
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
					foo: 'bar'
				}
			}
		]
	};

	describe('Constructing it', function () {
		it('can be constructed with json', function () {
			var story = new Saillog.Story(json);

			expect(story).to.be.a(Saillog.Story);
			expect(countObj(story.getFeatures())).to.be(2);
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
		})

	});
});
