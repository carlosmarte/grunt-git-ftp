/*
 * grunt-git-ftp
 * http://gruntjs.com/
 *
 * Copyright (c) 2013 Roberto Carlos Marte, contributors
 * Licensed under the MIT license.
 */


module.exports = function(grunt) {
	"use strict";
	
	var Config = {}; 

	//jshint
	Config.jshint = {
		options: {
			jshintrc: '.jshintrc' 
		},
		packages: [
			'Gruntfile.js','package.json','.gitftppass'
		],javascript:[
			'tasks/git_ftp.js'
		]    
	};

	//Init Task
	grunt.initConfig(Config);

	// Actually load this plugin's task(s).
	grunt.loadTasks('tasks');

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-jshint');

	//Register the default tasks
	grunt.registerTask('default',[
		'jshint:packages'
	]);
};