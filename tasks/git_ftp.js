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
  Array.prototype.remove = function(deleteMatchingValues){
    var index = null; //store array index
    //while loop through indexOf(deleteMatchingValues) values
    do{
      index = this.indexOf(deleteMatchingValues); //return index of matching value
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
  FtpClient = require('ftp'),
  cmd = require("child_process").exec,
  gruntRootPath = process.cwd(),
  ftp = new FtpClient(),
  remoteDirectories = [],
  done = null,
  GruntGitFtp = function(){  
    this.hostConfig = null; 
 
    return this;
  }; 

 /*
  * Get host file and parse json
  */  
  GruntGitFtp.prototype.getHostFile = function(hostName,filename){  
    //check if file exist
    if(fs.existsSync(filename)){
      //check key value
      if(hostName != null){        
        this.hostConfig = grunt.file.readJSON(filename); 
        this.hostConfig._key = hostName;
        this.revisionNumber = null;
        this.done = null,
        this.localDirectories = {},
        this.localFiles = null;
      }else{
        log.error('Error, please check {' + hostName.red + '} or json file format');
      }
    }else{
        log.error('Error, ftp configuration file not found in : ' + gruntRootPath + '/' + filename.red);
    }    
    return this.hostConfig;
  };  

 /*
  * Get/Set FTP Key Values
  */  
  GruntGitFtp.prototype.ftp = function(key,val){  
    //if key isn't 
    if(this.hostConfig._key === undefined || typeof(this.hostConfig[this.hostConfig._key]) !== 'object'){
      log.error('Error, please check that { \n' + 
      ' "'+ this.hostConfig._key.red +'": {  \n' + 
      '  "host": "ftp.host-address.com",  \n' + 
      '    "port": 21,  \n' + 
      '    "user": "ftp-username",  \n' + 
      '    "password": "ftp-account-password",  \n' + 
      '    "remotePath": "ftp-basepath"  \n' + 
      '  }  \n' + 
      '} exist your ftp configuration file');
      throw 'key not found in .gitftppass'; 
    }

    //get host config key
    if(arguments.length === 2){
      this.hostConfig[this.hostConfig._key][key] = val;
    }

    return (this.hostConfig[this.hostConfig._key][key] ? this.hostConfig[this.hostConfig._key][key] : null);
  };  

 /*
  * Command function return string
  */  
  GruntGitFtp.prototype.cmd = function(command,cb,err){
    this.commands(false,command,cb,err);
  }; 

 /*
  * Command function return array
  */  
  GruntGitFtp.prototype.cmdSplit = function(split,command,cb,err){
    this.commands(split,command,cb,err);
  }; 

 /*
  * Command wrapper function
  */  
  GruntGitFtp.prototype.commands = function(shouldSplit,command,cb,err){
    cmd(command,function(error, stdout, stderr){ 
        var temp = null;     
        if(!error){
          if(shouldSplit === false){
            cb(stdout);
          }else{
            temp = stdout.split(shouldSplit).remove('');
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
  GruntGitFtp.prototype.gitCmdErr = function(err){  
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
  GruntGitFtp.prototype.createRemoteDirectory = function(list,cb){
    var remoteRootPath = this.ftp('remotePath');     
    if(Object.keys(list).length){ 
        async.forEach(Object.keys(list),function(dir, nextArray){
          ftp.mkdir(dir,true,function(err){             
            log.ok('created remote directory: ' + dir);
            nextArray();           
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
  GruntGitFtp.prototype.uploadFiles = function(list,cb){
    var remoteRootPath = this.ftp('remotePath'),
    host = this.ftp('host');
    if(list.length){ 
        async.forEach(list,function(filepath, nextArray){
          ftp.put(gruntRootPath + '/' + filepath,path.normalize(remoteRootPath + '/' + filepath),function(err){
            if(err){
              cb(true,err);
              throw err; 
            }      
            log.ok('Uploaded from: ' + filepath + ' >> ' + host.blue + '@' + path.normalize(remoteRootPath + '/' + filepath).green);     
            ftp.end();
            nextArray();
          }); 
        },function(err){
          cb(null);
        });
    }else{
      cb(true,'error while uploading file');
    }
  };


  /*
  * Grunt Multi Task
  */ 
  grunt.registerMultiTask('git_ftp','queries last git commit and FTPs modified files to server',function(){
    var gruntGitFtpApp = new GruntGitFtp(),
    //options with these defaults
    options = this.options({
      'hostFile':'.gitftppass',
      'host':'default'
    });

    done = this.async();
	
	//get all ignored files
	if (options.ignore) {
		gruntGitFtpApp.ignoredFiles = grunt.file.expand(options.ignore);
	}

    //get host file 
    if(gruntGitFtpApp.getHostFile(options.host,options.hostFile) === null){
      //return if json file is not parse
      return this;
    }

    //login to FTP
    ftp.connect({
        host: gruntGitFtpApp.ftp('host'),
        port: gruntGitFtpApp.ftp('port'),
        user: gruntGitFtpApp.ftp('user'),
        password: gruntGitFtpApp.ftp('password')         
    });

    //FTP is ready
    ftp.on('ready',function(){
        log.ok('Connected to ftp host: ' + gruntGitFtpApp.ftp('host').blue + ' | root: ' + gruntGitFtpApp.ftp('remotePath').blue );

        //callbacks
        grunt.util.async.waterfall([
            function(callback){ //handles git commands
              //get last commited revision number
              gruntGitFtpApp.cmd('git rev-parse --verify HEAD',function(output){
                //revisionNumber trim and toString
                if (grunt.option('commit')) {
					gruntGitFtpApp.revisionNumber = grunt.option('commit'); 
				} else {	
					gruntGitFtpApp.revisionNumber = output.toString(); 
				}
                //check string length
                if(gruntGitFtpApp.revisionNumber.length !== 0){
                  //notify user
                  log.ok('git last commit HASH: ' + gruntGitFtpApp.revisionNumber.blue);

                  gruntGitFtpApp.cmd("git log --pretty=format:'%h' | wc -l",function(output){
                    var totalRevisions = parseInt(output,16);
                    //if first commit upload all files
                    if(totalRevisions === 0){
                      //get list of commited files/directories
                      gruntGitFtpApp.cmdSplit(/\n/,'git show --pretty="format:" --name-only ' + gruntGitFtpApp.revisionNumber,function(output){  
                        //check output length
                        if(output.length !== 0){
                          //Get List of commited items
                          gruntGitFtpApp.lastCommitedItems = output;              
                          //next callback
                          callback(null,gruntGitFtpApp.lastCommitedItems); 
                        }else{
                          log.error('Error while getting Git Commited items');
                          callback(true);
                        }
                      },gruntGitFtpApp.gitCmdErr); 
                    }else{ //else only upload changes files
                      //get list of commited files/directories
                      gruntGitFtpApp.cmdSplit(/\n/,'git diff-tree --no-commit-id --name-only -r ' + gruntGitFtpApp.revisionNumber,function(output){  
                        //check output length
                        if(output.length !== 0){
                          //Get List of commited items
                          gruntGitFtpApp.lastCommitedItems = output;              
                          //next callback
                          callback(null,gruntGitFtpApp.lastCommitedItems); 
                        }else{
                          log.error('Error while getting Git Commited items');
                          callback(true);
                        }
                      },gruntGitFtpApp.gitCmdErr); 
                    }
                  });

                }else{
                  log.error('Error while getting Git Commit Hash');
                  callback(true);
                }
              },gruntGitFtpApp.gitCmdErr);
            },function(argLastCommited,callback){ //handles filtering files/directories
              var relative_path = null,
              remoteRootPath = gruntGitFtpApp.ftp('remotePath'); //get remote path from .gitftppass   

              if(remoteRootPath.length === 0){
                log.error('Error, please check {remote path} in .gitftppass');
                return callback(true);
              }  

              //filter array and return remote filepath
              gruntGitFtpApp.localFiles = argLastCommited.filter(function(filepath){
                if(fs.existsSync(gruntRootPath + '/' + filepath)){ 
					//skip ignored
					if (gruntGitFtpApp.ignoredFiles && gruntGitFtpApp.ignoredFiles.indexOf(filepath) > -1) {
						return false;
					}
                  //store directory as a key(path) value(successfully uploaded)
                  gruntGitFtpApp.localDirectories[path.normalize(path.dirname(remoteRootPath + '/' + filepath) + '/')] = null;
                  //only return file OR files that start with (.)
                  return (path.extname(filepath) || filepath[0] === '.' ? true : false);
                }else{
                  return false;
                }
              });               
              callback(null,gruntGitFtpApp);                
            },function(IO,callback){ //handles filtering files/directories
              //Create Remote Directories
              gruntGitFtpApp.createRemoteDirectory(IO.localDirectories,function(){
                gruntGitFtpApp.uploadFiles(IO.localFiles,function(){
                  callback(null,'Successfully uploaded ' + String(IO.localFiles.length).blue + ' files from last committed id:' + gruntGitFtpApp.revisionNumber.blue);
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
