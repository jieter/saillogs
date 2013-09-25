'use strict';

var delta = 1;

describe('geoUtil', function () {

	describe('getDistance()', function () {

		var distanceTests = [
			{
				// London - Paris
				latlngs: [
					[51.5000, -0.1167],
					[48.8667, 2.3333]
				],
				expected: 342
			},
				// Amsterdam - Paris
			{	latlngs: [[52.3500, 4.9167], [48.8667, 2.3333]],
				expected: 427.71
			},

			// Londom - Amsterdam
			{ 	latlngs: [[51.5000, -0.1167], [52.3500, 4.9167]],
				expected: 358
			}
		];

		it('calculate approximate distances', function () {
			distanceTests.forEach(function (test) {

				expect(
					L.polyline(test.latlngs).getDistance('kilometer')
				).to.be.within(
					test.expected - delta,
					test.expected + delta
				);
			});
		});
	});
});
