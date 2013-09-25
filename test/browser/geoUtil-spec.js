'use strict';

var distanceDelta = 1;
var bearingDelta = 1;
var NM_TO_METER = 1.852;

describe('geoUtil', function () {

	var tests = [
		{
			name: '60 NM on 0-meridian to North',
			latlngs: [[50, 0], [51, 0]],
			distance: 60 * NM_TO_METER,
			bearing: 0
		},
		{
			name: 'points on 0-meridian to South',
			latlngs: [[50, 0], [49, 0]],
			distance: 60 * NM_TO_METER,
			bearing: 180
		},
		{
			name: 'points on 45-meridian to South',
			latlngs: [[0, 45], [-1, 45]],
			distance: 60 * NM_TO_METER,
			bearing: 180
		},
		{
			name: 'points on equator to East',
			latlngs: [[0, 0], [0, 1]],
			distance: 60 * NM_TO_METER,
			bearing: 90
		},
		{
			name: 'London - Paris',
			latlngs: [[51.5000, -0.1167], [48.8667, 2.3333]],
			distance: 342,
			bearing: 148
		},
		{
			name: 'Amsterdam - Paris',
			latlngs: [[52.3500, 4.9167], [48.8667, 2.3333]],
			distance: 427.71,
			bearing: 206
		},
		{
			name: 'Londom - Amsterdam',
			latlngs: [[51.5000, -0.1167], [52.3500, 4.9167]],
			distance: 358,
			bearing: 72
		}
	];

	describe('L.PolyLine.getDistance()', function () {
		tests.forEach(function (testcase) {
			it('Approximate distance for: ' + testcase.name, function () {
				expect(
					L.polyline(testcase.latlngs).getDistance('kilometer')
				).to.be.within(
					testcase.distance - distanceDelta,
					testcase.distance + distanceDelta
				);
			});
		});
	});
	describe('L.LatLng().bearingTo()', function () {
		tests.forEach(function (testcase) {
			it('Approximate bearing for: ' + testcase.name, function () {
				expect(
					L.latLng(testcase.latlngs[0]).bearingTo(testcase.latlngs[1])
				).to.be.within(
					testcase.bearing - bearingDelta,
					testcase.bearing + bearingDelta
				);
			});
		});
	});

});
