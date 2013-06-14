/*
 * grunt-git-ftp
 * https://github.com/robertomarte/grunt-git-ftp
 *
 * Copyright (c) 2013 Roberto Carlos Marte
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt){
  //Extend Array Class
  Array.prototype.clean = function(deleteValue) {
      for (var i = 0; i < this.length; i++) {
          if (this[i] === deleteValue) {         
              this.splice(i, 1);
              i--;
          }
      }
      return this;
  };

  grunt.util = grunt.util || grunt.utils;  
  var session = {}, 
  async = grunt.util.async,
  log = grunt.log, 
  _ = grunt.util._,
  file = grunt.file,
  fs = require('fs'),
  path = require('path'),
  Ftp_client = require('ftp'),
  cmd = require("child_process").exec,
  grunt_root_path = process.cwd(),
  str = require('string'),
  revision_number = null,
  remote_directories = [];

  grunt.registerMultiTask('git_ftp','queries last git commit and FTPs modified files to server', function(){

       
  });
};