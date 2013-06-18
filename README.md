grunt-git-ftp
=============
> queries last git commit and FTPs modified files to server

Node Packaged Modules for [Grunt](http://gruntjs.com). 

# Prerequisites

- Grunt `~0.4.1`
- Node v0.10.5 (http://nodejs.org)
- Git (http://git-scm.com)
- FTP Server

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-git-ftp --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-git-ftp');
```

*This plugin was designed to work with Grunt 0.4.x. If you're still using grunt v0.3.x it's strongly recommended that [you upgrade](http://gruntjs.com/upgrading-from-0.3-to-0.4), but in case you can't please use [v0.3.2](https://github.com/gruntjs/grunt-contrib-less/tree/grunt-0.3-stable).*

## git_ftp task
_Run this task with the `grunt git_ftp` command._

### Usage Examples

> Gruntfile.js

```js
git_ftp: {
  development: {
    options: {
      'host_file':'.gitftppass',
      'host':'staging'
    }
  },
  production: {
    options: {
      'host_file':'.gitftppass',
      'host':'default'
    }
  }
}
```
> .gitftppass configuration file

```js
{
  "default": {
      "host": "ftp.host-address.com",
      "port": 21,
      "user": "ftp-username",
      "password": "ftp-account-password",
      "remote_path": "ftp-basepath"
  }
}  
```

---

Task submitted by [Roberto Carlos Marte](http://Carlosmarte.me/)

> npm package grunt-git-ftp(https://npmjs.org/package/grunt-git-ftp)

*This file was generated on Sun Jun 15 2013 11:00:31.*