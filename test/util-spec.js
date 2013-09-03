'use strict';

var expect = require('expect.js');

var util = require('../build/util.js');

describe('util.js', function () {

	// not really the scope of this project
	describe('stringify', function () {});

	describe('getDate', function () {
		var timestamp = '2013-08-30T15:51:00';

		it('returns the current date in YYYY-mm-dd format', function () {
			expect(util.getDate(timestamp)).to.equal('2013-08-30');
		});
	});

	describe('swap()', function () {
		it('swaps a [lat, lng]-array', function () {
			expect(util.swap([1, 4])).to.eql([4, 1]);
			expect(util.swap([4.8, 8.4])).to.eql([8.4, 4.8]);
		});

		it('discards superfluous elements', function () {
			expect(util.swap([1, 1, 2, 4])).to.eql([1, 1]);
		});

		it('swaps an array of arrays', function () {
			var arr = [[1, 2], [3, 4], [5, 6]];
			var expected = [[2, 1], [4, 3], [6, 5]];

			expect(util.swap(arr)).to.eql(expected);
		});
	});
});