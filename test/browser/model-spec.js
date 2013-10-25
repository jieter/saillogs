'use strict';

// disable Expected an assignment or function call and instead saw an expression.
/* jshint -W030 */

describe('Saillog.Model', function () {
	chai.should();


	describe('Constructing it without args', function () {
		var model = new Saillog.Model();

		model.properties = {
			foo: 'bar',
			bar: 'baz'
		};

		it('getProperty', function () {
			model.getProperty('foo').should.equal('bar');
		});

		describe('setProperty', function () {
			it('sets', function () {
				model.setProperty('foo', 'test123');
				model.getProperty('foo').should.equal('test123');
			});

			it('fires update event while setting', function () {
				var spy = sinon.spy();

				model.on('update', spy);

				model.setProperty('foo', 'cheese');

				spy.should.have.been.calledOnce;
			});
		});
	});
});