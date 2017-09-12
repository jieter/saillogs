/*
 * saillog-thumbs
 *
 * Looks in <dir>/orig/ for JPG files and generates
 * a thumb and a bigger image from the original, leaving the
 * original untouched.
 *
 * Loosely inspired by https://github.com/honza/node-thumbnail
 */

'use strict';

// actual thumbing.
var fs = require('fs');
var path = require('path');
var async = require('async');
var im = require('imagemagick');
var _ = require('underscore');

var settings = {
	extensions: [
		'.jpg',
		'.jpeg',
		'.JPG',
		'.JPEG',
		'.png',
		'.PNG'
	],
	concurrency: 4
};


var queue;

// create a queue with a task to convert an image.
var createQueue = function () {
	if (queue) {
		return;
	}
	queue = async.queue(function (options, callback) {
		im.resize({
			srcPath: options.source,
			dstPath: options.destination,
			width: options.width
		}, function () {
			callback();
		});
	}, settings.concurrency);

	return queue;
};

// put images in the queue
var run = function (options) {
	createQueue();

	var images = fs.readdirSync(options.source);
	images = _.reject(images, function (file) {
		return _.indexOf(settings.extensions, path.extname(file)) === -1;
	});

	var thumbCount = 0;

	var addToQueue = function (options) {
		var name = options.source;
		var ext = path.extname(name);
		var base = path.basename(name, ext);

		options.destination = options.destination + '/' + base + options.suffix + ext;

		if (!fs.existsSync(options.destination) || options.force) {
			queue.push(options);
			thumbCount++;
		}
	};

	_.each(images, function (image) {
		var imageOptions = _.defaults({}, options);
		imageOptions.source = options.source + '/' + image;

		// only one thumb per image:
		if (typeof options.width === 'number') {
			addToQueue(imageOptions);
		} else {
			for (var i in options.width) {
				addToQueue(_.extend({}, imageOptions, {
					width: options.width[i],
					suffix: i
				}));
			}
		}
	});

	// attach drain after adding all tasks
	if (queue.length() > 0) {
		queue.drain = function () {
			if (options.drain) {
				options.drain();
			}
			console.log('Converted ' + thumbCount);
		};
	}
};

var thumb = function (options) {
	if (!(fs.existsSync(options.source) && fs.existsSync(options.destination))) {
		console.error('Source/destination does not exist.');
		return;
	}

	_.defaults(options, {
		width: 200,
		suffix: ''
	});

	run(options);
};


module.exports = function (grunt) {

	function hasOrig(dirname) {
		return grunt.file.isDir(dirname) && grunt.file.isDir(dirname + '/orig');
	}

	grunt.registerMultiTask('saillog-thumbs', 'Generate thumbs from originals.', function () {
		var done = this.async();

		var force = grunt.option('force');

		if (this.files !== null) {
			this.filesSrc.filter(hasOrig).forEach(function (filepath) {
				thumb({
					source: filepath + '/orig',
					destination: filepath,
					width: {
						'.thumb': 200,
						'': 1000
					},
					force: force,
					drain: function () {
						done();
					}
				});
			});
		}
	});
};
