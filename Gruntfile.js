module.exports = function (grunt) {
	'use strict';
	var scriptExtractor = require('script-extractor');

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
				report: 'min'
			},
			build: {
				files: {
					'dist/saillogs.min.js': scriptExtractor('index.html')
				}
			}
		},
		jshint: {
			files: ['js/*.js', 'build/**/*.js', 'test/**/*.js'],
			options: {
				jshintrc: '.jshintrc'
			}
		},
		geojsonhint: {
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
		connect: {
			server: {
				options: {
					port: 9999,
					open: true,
					middleware: require('./build/saillog-api.js')
				}
			}
		},
		less: {
			development: {
				files: {
					"style/saillog.css": "style/saillog.less"
				}
			},
			dist: {
				files: {
					"dist/style/saillog.css": "style/saillog.less"
				}
			}
		},
		watch: {
			data: {
				files: ['data/**/orig/*.jpg'],
				tasks: ['saillog-thumbs']
			},
			html: {
				files: ['*.html'],
				options: {
					livereload: true
				}
			},
			js: {
				files: [
					'.jshintrc',
					'js/*.js',
					'test/browser/*.js'
				],
				tasks: ['jshint'],
				options: {
					livereload: true
				}
			},
			less: {
				files: ['style/*.less'],
				tasks: ['less:development'],
				options: {
					spawn: false,
					livereload: true
				}
			},
			images: {
				files: ['data/**/orig/*'],
				tasks: ['saillog-thumbs']
			}
		},
		copy: {
			dist: {
				options: {
					processContent: function (content, srcpath) {
						if (srcpath !== 'index.html') {
							return content;
						}
						return content
							.replace(/(<script(.*)? src="(.*)"><\/script>(\n)?)/g, '')
							.replace('</body>', '\t<script src="saillogs.min.js' + '"></script>\n</body>');
					},
					processContentExclude: ['**/*.{png,gif,jpg,ico,psd,JPG,ttf,woff}']
				},
				files: [
					{
						expand: true,
						src: [
							'index.html',
							'js/lib/**/*.{css,png}',
							'style/**/*',
							'data/jieter.jpg',
							'data/*.geojson',
							'data/index.json',
							'data/**/*.*',
							'!data/dump/**',
							'!data/_old_format/**'
						],
						dest: 'dist/'
					}
				]
			}
		}
	});

	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

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


	grunt.registerTask('dist', [
		'jshint',
		'uglify',
		'less:dist',
		'copy'
	]);

	grunt.registerTask('dev', [
		'less:development',
		'jshint',
		'makeindex',
		'connect:server',
		'watch'
	]);
	grunt.registerTask('default', ['dev']);
};
