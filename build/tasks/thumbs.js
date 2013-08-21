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
var createQueue = function (options) {
	if (queue) {
		return;
	}
	queue = async.queue(function (task, callback) {
		var name = task.options.source;
		var ext = path.extname(name);
		var base = path.basename(name, ext);

		im.resize({
			srcPath: task.options.source,
			dstPath:
				task.options.destination + '/' +
				base + task.options.suffix + ext,

			width: task.options.width
		}, function () {
			callback();
		});
	}, settings.concurrency);

	if (options.drain) {
		queue.drain = options.drain;
	}

	return queue;
};

// put images in the queue
var run = function (options) {
	createQueue(options);

	var images = fs.readdirSync(options.source);
	images = _.reject(images, function (file) {
		return _.indexOf(settings.extensions, path.extname(file)) === -1;
	});

	_.each(images, function (image) {
		// only one thumb per image:
		if (typeof options.width === 'Number') {
			queue.push({options: _.defaults({}, options)}, function () {
				console.log(image);
			});
		} else {
			_.each(image.width, function (width, suffix) {
				queue.push({
					options: _.defaults({}, options, {
						width: width,
						suffix: suffix
					})
				});
			});
		}
	});
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

		if (this.files !== null) {
			this.filesSrc.filter(hasOrig).forEach(function (filepath) {

				thumb({
					source: filepath + '/orig',
					destination: filepath,
					width: {
						'.thumb': 200,
						'': 1000
					},
					drain: function () {
						done();
					}
				});
			});
		}
	});
};