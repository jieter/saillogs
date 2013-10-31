'use strict';

// disable Expected an assignment or function call and instead saw an expression.
/* jshint -W030 */

describe('Saillog.Model', function () {
	chai.should();


	describe('Constructing it without args', function () {
		var model;

		beforeEach(function () {
			model = new Saillog.Model();

			model.properties = {
				foo: 'bar',
				bar: 'baz'
			};
		});

		describe('hasProperty', function () {
			it('has properties', function () {
				model.hasProperty('foo').should.be.true;
				model.hasProperty('bar').should.be.true;
			});

			it('does not have properties', function () {
				model.hasProperty('cats').should.be.false;
				model.hasProperty('dogs').should.be.false;
			});
		});

		describe('getProperty', function () {
			it('returns the value', function () {
				model.getProperty('foo').should.equal('bar');
			});

			it('Throws an exception for non-existant keys', function () {
				var foo = function () {
					model.getProperty('cavia');
				};

				foo.should.throw;
			});
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

		describe('template', function () {
			it('replaces properties in string', function () {
				model.template('test {foo}, {bar}').should.eql('test bar, baz');
			});

			it('formats replaced strings', function () {
				model.setProperty('test', '2013-08-28T18:10:00');

				//TODO fix timezone assumption
				model.template('test {test|time}').should.equal('test 20:10');
			});
		});
	});
});