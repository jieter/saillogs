module.exports = function (grunt) {
	'use strict';

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
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
		'geojsonhint': {
			data: [
				'data/*.geojson',
				'data/**/*.geojson'
			]
		},
		'saillog-thumbs': {
			files: {
				src: ['data/*']
			}
		},
		'connect': {
			server: {
				options: {
					port: 9999,
					middleware: function (connect, options) {
						return [
							connect.logger('dev'),
							connect.static(__dirname),
							require('./build/saillog-api.js')('./data')
						]
					},
					open: true
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-geojsonhint');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-connect');

	// saillog specific tasks
	grunt.loadTasks('build/tasks');

	var ships = [
		'eendracht',
		'lutgerdina', 'beatrix',
		'toxiq', 'xquise'
	];
	ships.forEach(function (ship) {
		grunt.registerTask(ship, [
			'dump-marinetraffic:' + ship,
			'merge-marinetraffic:' + ship,
			'import-marinetraffic:' + ship
		]);
	});
	grunt.registerTask('all-ships', ships);
	grunt.registerTask('hint', ['jshint', 'geojsonhint']);

	grunt.registerTask('default', ['jshint', 'jsonlint', 'uglify']);

	grunt.registerTask('server', ['connect:server:keepalive'])
};