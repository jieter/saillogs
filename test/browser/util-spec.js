'use strict';

describe('util', function () {
	chai.should();

	describe('marked monkeypatch', function () {
		it('converts youtube links', function () {
			marked('[foo](http://youtu.be/JIA_D_ZJ1dU)').should.eql(
				'<p><span class="youtube" data-youtube-url="http://youtu.be/JIA_D_ZJ1dU">' +
				'<i class="icon-youtube-play"></i> foo</span></p>\n'
			);
		});

		it('prefixes image urls', function () {
			marked('![](image.jpg)').should.eql(
				'<p><img src="data/image.jpg" class="thumb side-thumb" title="" /></p>\n'
			);
		});
	});

	describe('hexToRgb', function () {
		var colors = {
			'#000000': [0, 0, 0],
			'000000': [0, 0, 0],
			'ff0000': [255, 0, 0],
			'00ff00': [0, 255, 0],
			'ff0011': [255, 0, 17],
			'ffffff': [255, 255, 255],
			'#ffffff': [255, 255, 255]
		};
		it('translates colors', function () {
			for (var hex in colors) {
				var rgb = Saillog.util.hexToRgb(hex);

				rgb.toArray().should.eql(colors[hex]);
			}
		});
		it('converts to string', function () {
			var tester = function (hex) {
				return function () {
					return Saillog.util.hexToRgb(hex).toString();
				};
			};

			for (var hex in colors) {
				var testFn = tester(hex);
				if (colors[hex] === null) {
					testFn.should.throw();
				} else {
					testFn().should.eql(colors[hex].join(','));
				}
			}
		});
		it('converts to rgba-string', function () {
			for (var hex in colors) {
				if (colors[hex] === null) {
					continue;
				}

				Saillog.util.hexToRgb(hex).toRgba(0.4)
					.should.eql('rgba(' + colors[hex].join(',') + ',0.4)');
			}
		});
	});

	describe('formatters', function () {
		describe('formatDistance', function () {
			var formatDistance = Saillog.util.formatDistance;

			it('formats numbers with one decimal', function () {
				formatDistance(4.1234).should.eql('4.1');
				formatDistance(0.8).should.eql('0.8');
				formatDistance(1.004).should.eql('1.0');
			});
		});

		describe('formatDuration', function () {
			var HOUR = 60 * 60;
			var formatDuration = Saillog.util.formatDuration;

			it('formats seconds to hours:minutes', function () {
				formatDuration(1).should.eql('0:00');
				formatDuration(60).should.eql('0:01');
				formatDuration(HOUR).should.eql('1:00');
				formatDuration(HOUR * 3.5).should.eql('3:30');
				formatDuration(HOUR * 46.25).should.eql('46:15');

			});
		});

		describe('formatTime', function () {
			var formatTime = Saillog.util.formatTime;

			it('formats hh:mm for from dates', function () {
				formatTime(0).should.equal('1:00');
				formatTime('2011-10-21T18:00:00').should.equal('20:00');
				formatTime('2011-10-21T18:12:00').should.equal('20:12');
			});
		});
	});


	describe('isArray', function () {
		it('tests correctly for arrays', function () {
			Saillog.util.isArray([]).should.be.eql(true);
		});
	});

	describe('default', function () {

		it('does copy defaults', function () {
			var obj = {};
			var defaults = {
				foo: '',
				bar: 'foo'
			};

			Saillog.util.default(obj, defaults)
				.should.contain.keys('foo', 'bar');
		});
		it('does not overwrite values already in dest', function () {
			var obj = {
				foo: 'bar',
				bar: ''
			};
			var defaults = {
				foo: 'baz',
				bar: 'foo'
			};

			Saillog.util.default(obj, defaults);

			obj.should.contain.keys('foo', 'bar');
			obj.foo.should.eql('bar');
			obj.bar.should.eql('');
		});

	});

});
