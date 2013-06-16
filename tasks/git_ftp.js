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
  done = null,
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
        this.revision_number = null;
        this.done = null;
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

 /*
  * Command function
  */  
  Grunt_git_ftp_class.prototype.cmd = function(command,cb,err){
    cmd(command,function(error, stdout, stderr){ 
      console.log(stdout.split(/\n/));        
        if(!error){
          cb(stdout);
        }else{
          err(error);
        }
    });
  }; 

 /*
  * Command function
  */  
  Grunt_git_ftp_class.prototype.cmd_split = function(split,command,cb,err){
    cmd(command,function(error, stdout, stderr){ 
      console.log(stdout);        
        if(!error){
          cb(stdout.split(/\n/));
        }else{
          err(error);
        }
    });
  };


 /*
  * Command function
  */  
  Grunt_git_ftp_class.prototype.git_cmd_err = function(err){  
    log.error(err);
    done(); 
  };  

 /*
  * take command output and return array of directories/files
  */  
  Grunt_git_ftp_class.prototype.extract_git_listing = function(list){
    var temp = typeof(list.split(/\n/));
    return temp; //String(list).split(/\n/);

  };

  App = new Grunt_git_ftp_class();

  grunt.registerMultiTask('git_ftp','queries last git commit and FTPs modified files to server',function(){

    //options with these defaults
    var options = this.options({
      'host_file':'.gitftppass',
      'host':'default'
    });

    done = this.async();

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

        //callbacks
        grunt.util.async.waterfall([
            function(callback){
              //get last commited revision number
              App.cmd('git rev-parse --verify HEAD',function(output){
                //revision_number trim and toString
                App.revision_number = str(output).toString(); 
                //check string length
                if(App.revision_number.length !== 0){
                  //notify user
                  log.ok('git last commit HASH: ' + App.revision_number.blue);
                  //get list of commited files/directories
                  App.cmd('git diff-tree --no-commit-id --name-only -r ' + App.revision_number,function(output){  
                    //check output length
                    if(output.length !== 0){
                      //Get List of commited items
                      App.last_commited_items = App.extract_git_listing(output); //App.extract_git_listing(str(output).toString());               
                      //next callback
                      callback(null,App.extract_git_listing(App.last_commited_items)); 
                    }else{
                      log.error('Error while getting Git Commited items');
                      callback(true);
                    }
                  },App.git_cmd_err);               
                }else{
                  log.error('Error while getting Git Commit Hash');
                  callback(true);
                }
              },App.git_cmd_err);
            },function(arg_last_commited,callback){ 
            

            console.log(arg_last_commited);               
              callback(null,1);                
            }],function(err,result){ //Completed
              console.log(result);
              done();               
            }
        );           
    });     
  });
};


