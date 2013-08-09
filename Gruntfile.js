module.exports = function (grunt) {
	'use strict';

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		'connect': {
			server: {
				options: {
					port: 9999,
					base: '.',
					keepalive: true
				}
			}
		},
		'uglify': {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			build: {
				src: 'src/<%= pkg.name %>.js',
				dest: 'build/<%= pkg.name %>.min.js'
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

	grunt.loadTasks('build/tasks');

	// Default
	grunt.registerTask('default', ['uglify', 'jsonlint']);
};