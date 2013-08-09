module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    jsonlint: {
    	data: {
    		src: ['data/*.geojson']
    	}
    },
    'import-sailplanner': {

    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-jsonlint');

  grunt.loadTasks('build/tasks');

  // Default
  grunt.registerTask('default', ['uglify', 'jsonlint']);
};