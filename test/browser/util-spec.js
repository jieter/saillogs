'use strict';

describe('util', function () {
	describe('hexToRgb', function () {

		it('translates colors', function () {
			var colors = {
				'#000000': [0, 0, 0],
				'000000': [0, 0, 0],
				'ff0000': [255, 0, 0],
				'00ff00': [0, 255, 0],
				'ff0011': [255, 0, 17],
				'ffffff': [255, 255, 255],
				'#ffffff': [255, 255, 255],

				'00ff0000': null
			};
			for (var hex in colors) {
				expect(Saillog.util.hexToRgb(hex)).to.eql(colors[hex]);
			}
		})
	});

	describe('formatDistance', function () {
		it('formats numbers with one decimal', function () {
			expect(Saillog.util.formatDistance(4.1234)).to.be('4.1');
			expect(Saillog.util.formatDistance(0.8)).to.be('0.8');
			expect(Saillog.util.formatDistance(1.004)).to.be('1.0');
		});
	});

	describe('isArray', function () {
		it('tests correctly for arrays', function () {
			expect(Saillog.util.isArray([])).to.be.ok();
		});
	});

});
