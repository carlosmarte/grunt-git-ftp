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
  ftp = new Ftp_client(),
  remote_directories = [],
  Grunt_git_ftp_class = function(){  
    this.host_config = null;
 
    return this;
  },App = null; 

 /*
  * Get host file and parse json
  */  
  Grunt_git_ftp_class.prototype.get_host_file = function(host_name,filename){  
    //check if file exist
    if(fs.existsSync(filename)){
      //check key value
      if(host_name != null){        
        this.host_config = grunt.file.readJSON(filename); 
        this.host_config._key = host_name;
      }else{
        log.error('Error, please check {' + host_name.red + '} or json file format');
      }
    }else{
        log.error('Error, json file not found:' + filename.red);
    }    
    return this.host_config;
  };  

 /*
  * Get/Set FTP Key Values
  */  
  Grunt_git_ftp_class.prototype.ftp = function(key,val){  
    if(arguments.length === 2){
      this.host_config[this.host_config._key][key] = val;
    }
    return (this.host_config[this.host_config._key][key] ? this.host_config[this.host_config._key][key] : null);
  };  

  App = new Grunt_git_ftp_class();

  grunt.registerMultiTask('git_ftp','queries last git commit and FTPs modified files to server',function(){

    //options with these defaults
    var options = this.options({
      'host_file':'.gitftppass',
      'host':'default'
    }),done = this.async();

    //get host file 
    if(App.get_host_file(options.host,options.host_file) === null){
      //return if json file is not parse
      return this;
    }

    //login to FTP
    ftp.connect({
        host: App.ftp('host'),
        port: App.ftp('port'),
        user: App.ftp('user'),
        password: App.ftp('password')         
    });

    //FTP is ready
    ftp.on('ready',function(){
        log.ok('Connected to ftp host: ' + App.ftp('host').green);
        done();  
    });



     
  });
};