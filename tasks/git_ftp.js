/*
 * grunt-git-ftp
 * https://github.com/robertomarte/grunt-git-ftp
 *
 * Copyright (c) 2013 Roberto Carlos Marte
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt){
 //Extend array function, remove matching values from array
  Array.prototype.remove = function(delete_matching_values){
    var index = null; //store array index
    //while loop through indexOf(delete_matching_values) values
    do{
      index = this.indexOf(delete_matching_values); //return index of matching value
      if(index > 0){  //if index if gt 0 remove
        this.splice(index, 1); //remove values from array
      }      
    } while(index > 0);
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
        this.done = null,
        this.local_directories = {},
        this.local_files = null;
      }else{
        log.error('Error, please check {' + host_name.red + '} or json file format');
      }
    }else{
        log.error('Error, ftp setting file not found in : ' + filename.red);
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
    this.commands(false,command,cb,err);
  }; 

 /*
  * Command function
  */  
  Grunt_git_ftp_class.prototype.cmd_split = function(split,command,cb,err){
    this.commands(split,command,cb,err);
  }; 

 /*
  * Command function
  */  
  Grunt_git_ftp_class.prototype.commands = function(should_split,command,cb,err){
    cmd(command,function(error, stdout, stderr){ 
        var temp = null;     
        if(!error){
          if(should_split === false){
            cb(stdout);
          }else{
            temp = stdout.split(should_split).remove('');
            cb(temp);
          }          
        }else{
          err(error);
        }
    });
  };

 /*
  * report errors
  */  
  Grunt_git_ftp_class.prototype.git_cmd_err = function(err){  
    if(err.toString().indexOf('Needed a single revision')){
     log.error('Git Needed a single revision, please run'.red);
     log.ok('git add .'.red);
     log.ok('git commit -m "your message goes here"'.red);
    }else{
     log.error(err);
    }
    done(); 
  };  

  /*
  * Create Remote Directory
  */  
  Grunt_git_ftp_class.prototype.create_remote_directory = function(list,cb){
    if(list.length){ 
        async.forEach(list,function(dir, next_array){
          ftp.mkdir('domains/project-v4.carlosmarte.me/git/tasks/',true,function(err){             
            log.ok('created remote directory: ' + dir);
            next_array();           
          });
        },function(err){
          cb(null);
        });
    }else{
      cb(true,'error while creating directory');
    }
  };

  /*
  * Upload local file to server
  */ 
  Grunt_git_ftp_class.prototype.upload_files = function(list,cb){
    var remote_root_path = App.ftp('remote_path'),
    host = App.ftp('host');
    if(list.length){ 
        async.forEach(list,function(filepath, next_array){
          ftp.put(grunt_root_path + '/' + filepath,path.normalize(remote_root_path + '/' + filepath),function(err){
            if(err){
              cb(true,err);
              throw err; 
            }      
            log.ok('Uploaded from: ' + filepath + ' >> ' + host.blue + '@' + path.normalize(remote_root_path + '/' + filepath).green);     
            ftp.end();
            next_array();
          }); 
        },function(err){
          cb(null);
        });
    }else{
      cb(true,'error while uploading file');
    }
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
        log.ok('Connected to ftp host: ' + App.ftp('host').blue + ' | root: ' + App.ftp('remote_path').blue );

        //callbacks
        grunt.util.async.waterfall([
            function(callback){ //handles git commands
              //get last commited revision number
              App.cmd('git rev-parse --verify HEAD',function(output){
                //revision_number trim and toString
                App.revision_number = str(output).toString(); 
                //check string length
                if(App.revision_number.length !== 0){
                  //notify user
                  log.ok('git last commit HASH: ' + App.revision_number.blue);

                  App.cmd("git log --pretty=format:'%h' | wc -l",function(output){
                    var total_revisions = parseInt(output,16);
                    //if first commit upload all files
                    if(total_revisions === 0){
                      //get list of commited files/directories
                      App.cmd_split(/\n/,'git show --pretty="format:" --name-only ' + App.revision_number,function(output){  
                        //check output length
                        if(output.length !== 0){
                          //Get List of commited items
                          App.last_commited_items = output;              
                          //next callback
                          callback(null,App.last_commited_items); 
                        }else{
                          log.error('Error while getting Git Commited items');
                          callback(true);
                        }
                      },App.git_cmd_err); 
                    }else{ //else only upload changes files
                      //get list of commited files/directories
                      App.cmd_split(/\n/,'git diff-tree --no-commit-id --name-only -r ' + App.revision_number,function(output){  
                        //check output length
                        if(output.length !== 0){
                          //Get List of commited items
                          App.last_commited_items = output;              
                          //next callback
                          callback(null,App.last_commited_items); 
                        }else{
                          log.error('Error while getting Git Commited items');
                          callback(true);
                        }
                      },App.git_cmd_err); 
                    }
                  });

                }else{
                  log.error('Error while getting Git Commit Hash');
                  callback(true);
                }
              },App.git_cmd_err);
            },function(arg_last_commited,callback){ //handles filtering files/directories
              var relative_path = null,
              remote_root_path = App.ftp('remote_path'); //get remote path from .gitftppass   

              if(remote_root_path.length === 0){
                log.error('Error, please check {remote path} in .gitftppass');
                return callback(true);
              }  

              //filter array and return remote filepath
              App.local_files = arg_last_commited.filter(function(filepath){
                if(fs.existsSync(grunt_root_path + '/' + filepath)){ 
                  //store directory as a key(path) value(successfully uploaded)
                  App.local_directories[path.normalize(path.dirname(remote_root_path + '/' + filepath) + '/')] = null;
                  //only return file OR files that start with (.)
                  return (path.extname(filepath) || filepath[0] === '.' ? true : false);
                }else{
                  return false;
                }
              });               
              callback(null,App);                
            },function(IO,callback){ //handles filtering files/directories
              //Create Remote Directories
              App.create_remote_directory(IO.local_directories,function(){
                App.upload_files(IO.local_files,function(){
                  callback(null,'Successfully uploaded ' + String(IO.local_files.length).blue + ' files from last committed id:' + App.revision_number.blue);
                });                
              });             
            }],function(err,result){ //Completed
              log.ok(result);
              done();               
            }
        );           
    });     
  });
};