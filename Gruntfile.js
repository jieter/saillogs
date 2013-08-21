module.exports = function (grunt) {
	'use strict';

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		'connect': {
			server: {
				options: {
					port: 9999,
					base: '.'
				}
			}
		},
		'uglify': {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
				report: 'min'
			},
			build: {
				files: {
					'dist/saillogs.min.js': [
						'js/lib/Leaflet/leaflet.js',
						'js/lib/Leaflet.draw/leaflet-draw.js',
						'js/lib/jquery-*.min.js',
						'js/lib/jquery.scrollTo.js',
						'js/modal.js',
						'js/CalendarControl.js',
						'js/*.js'
					]
				}
			}
		},
		'jshint': {
			files: ['js/*.js', 'build/**/*.js'],
			options: {
				jshintrc: '.jshintrc'
			}
		},
		'jsonlint': {
			data: {
				src: ['data/*.geojson']
			}
		},
		'geojson-swap': {},
		'import-sailplanner': {},
		'saillog-thumbs': {
			files: {
				src: ['data/*']
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-jsonlint');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	// saillog specific tasks
	grunt.loadTasks('build/tasks');

	// Default
	grunt.registerTask('server', 'connect:server:keepalive');

	grunt.registerTask('default', ['jshint', 'jsonlint', 'uglify']);
};