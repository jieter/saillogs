'use strict';

var delta = 0.1;

// disable Expected an assignment or function call and instead saw an expression.
/* jshint -W030 */

describe('Saillog.Leg', function () {
	chai.should();

	describe('Constructing it without args', function () {
		var leg = new Saillog.Leg();

		it('should get an id', function () {
			chai.expect(leg.id).to.be.defined;
		});

		it('should be of text type', function () {
			leg.getType().should.equal('text');
		});

		it('should have no layer', function () {
			var layer = leg.getLayer();
			chai.expect(layer).to.be.undefined;
		});

		it('should have no distance', function () {
			var distance = leg.getProperty('discance');

			chai.expect(distance).to.be.undefined;
		});
	});

	describe('Constructing a line-leg', function () {
		var leg = new Saillog.Leg({
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
		});

		var expectedDistance = 205.209267;
		var expectedDuration = (expectedDistance / 5) * 60 * 60;

		it('should get the same id as the layer stamp', function () {
			leg.id.should.equal(L.stamp(leg.layer));
		});

		it('should be of LineString type', function () {
			leg.getType().should.be.equal('LineString');
		});

		it('should return provide properties', function () {
			leg.getProperty('startTime').should.eql('2013-08-29T17:45:00');
			leg.getProperty('endTime').should.eql('2013-08-30T13:39:00');
		});

		it('should calculate a distance', function () {
			leg.getProperty('distance').should.be.closeTo(expectedDistance, delta);
		});

		it('should calculate a duration', function () {
			leg.getProperty('duration').should.be.closeTo(expectedDuration, delta);
		});
	});

	describe('Constructing a place-leg', function () {
		var leg = new Saillog.Leg({
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: [0, 1]
			},
			properties: {
				text: 'Foo bar'
			}
		});

		it('should be of Point type', function () {
			leg.getType().should.equal('Point');
		});

		it('should have text', function () {
			leg.getProperty('text').should.equal('Foo bar');
		});
	});

	describe('toGeoJSON', function () {
		// note that order is important here
		var geojson = {
			type: 'Feature',
			properties: {
				title: 'Test 123',
				text: 'Foo bar',
				average: 5,
				color: '#ff0000',
				date: '2013-10-25',
			},
			geometry: {
				type: 'Point',
				coordinates: [0, 1]
			}
		};

		it('converts to the same json it is constructed from', function () {
			var leg = new Saillog.Leg(geojson);

			JSON.stringify(leg.toGeoJSON()).should.equal(JSON.stringify(geojson));
		});
	});
});