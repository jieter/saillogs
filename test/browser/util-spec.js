'use strict';

describe('util', function () {
	chai.should();

	describe('marked monkeypatch', function () {
		it('converts youtube links', function () {
			Saillog.util.renderMarkdown('[foo](http://youtu.be/JIA_D_ZJ1dU)').should.eql(
				'<p><span class="youtube" data-youtube-url="http://youtu.be/JIA_D_ZJ1dU">' +
				'<i class="fa fa-youtube-play"></i> foo</span></p>\n'
			);
		});

		it('prefixes image urls', function () {
			Saillog.util.renderMarkdown('![](image.jpg)').should.eql(
				'<p><img src="data/image.jpg" class="thumb side-thumb" title="" /></p>\n'
			);
		});
		it('puts the body in the title attr of the img tag', function () {
			Saillog.util.renderMarkdown('![foo](image.jpg)').should.eql(
				'<p><img src="data/image.jpg" class="thumb side-thumb" title="foo" /></p>\n'
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
		describe('distance', function () {
			var distance = Saillog.util.format.distance;

			it('formats numbers with one decimal', function () {
				distance(4.1234).should.eql('4.1');
				distance(0.8).should.eql('0.8');
				distance(1.004).should.eql('1.0');
			});
		});

		describe('duration', function () {
			var HOUR = 60 * 60;
			var duration = Saillog.util.format.duration;

			it('formats seconds to hours:minutes', function () {
				duration(1).should.eql('0:00');
				duration(60).should.eql('0:01');
				duration(HOUR).should.eql('1:00');
				duration(HOUR * 3.5).should.eql('3:30');
				duration(HOUR * 46.25).should.eql('46:15');

			});
		});

		describe('time', function () {
			var time = Saillog.util.format.time;

			it('formats hh:mm for from dates', function () {
				time(0).should.equal('1:00');
				time('2011-10-21T18:00:00').should.equal('20:00');
				time('2011-10-21T18:12:00').should.equal('20:12');
			});
		});

		describe('date', function () {
			var date = Saillog.util.format.date;

			it('formats d-m from dates', function () {

				date('2012-06-18').should.equal('18-6');

				// leap day.
				date('2012-02-29').should.equal('29-2');
				date('2014-02-29').should.equal('1-3');
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
