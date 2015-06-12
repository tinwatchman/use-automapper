module.exports = (function() {
    "use strict";

    var fs = require('fs');
    var pathlib = require('path');
    var async = require('async');
    var _ = require('underscore');
    var use = require('use-import');
    var AutomapperCommonUtil = use('AutomapperCommonUtil');
    var AutomapperLogger = use('AutomapperLogger');

    var AutomapperAsync = function() {
        var self = this,
            util = new AutomapperCommonUtil(),
            logger = new AutomapperLogger();

        /**
         * Goes through given array of file paths and creates a map from them.
         * @param  {Array}    files                 Array of file paths
         * @param  {String}   rootDir               Required. Root directory of 
         *                                          project.
         * @param  {String}   outputPath            Optional. A direct path to 
         *                                          output the JSON map to.
         * @param  {Object}   additionalNames       Optional. Additional 
         *                                          filepath=>names to integrate
         * @param  {Boolean}  isParsingFiles        Whether or not to parse 
         *                                          files for names in comments
         * @param  {Boolean}  isUsingPathStyleNames Whether or not to use path-
         *                                          style names.
         * @param  {Boolean}  isUsingJavaStyleNames Whether or not to use Java-
         *                                          style names.
         * @param  {Function} callback              Callback function.
         * @return {String}                         Final path of the use.json
         *                                          file.
         */
        this.mapFiles = function(files, options, callback) {
            logger.log('Mapping files: %j', files);
            // create map
            var map,
                names = {},
                onNamesReady = function() {
                    if (_.has(options, 'additionalNames') && 
                        _.isObject(options.additionalNames)) {
                        names = _.extend({}, names, options.additionalNames);
                    }
                    if (_.keys(names).length > 0) {
                        logger.log('names recovered: %j', names);
                    }
                    // make map
                    var mapArgs = {
                        'files': files,
                        'rootDir': options.rootDir, 
                        'names': names
                    };
                    util.getNameFormat(options, mapArgs);
                    map = util.makeUseMap(mapArgs);
                    logger.log('Project map: %j', map);
                    // write to disk
                    var writeOptions = {'rootDir': options.rootDir};
                    if (_.has(options, 'outputPath')) {
                        writeOptions.filePath = options.outputPath;
                    }
                    self.writeMap(map, writeOptions, callback);
                };
            if (!_.has(options, 'isParsingFiles') ||
                options.isParsingFiles === true) {
                this.parseJsFilesContent(files, function(err, nameMap) {
                    names = nameMap;
                    onNamesReady();
                });
            } else {
                onNamesReady();
            }
        };

        /**
         * Goes through a path and maps all .js files it finds
         * @param  {String}   path                  Absolute file path to search
         * @param  {Object}   additionalNames       Additional filepath=>names
         *                                          to integrate.
         * @param  {String}   outputPath            Direct path to output JSON 
         *                                          map to. Optional.
         * @param  {Boolean}  isParsingFiles        Whether or not to parse 
         *                                          files for names in comments
         * @param  {Boolean}  isUsingPathStyleNames Whether or not to use path-
         *                                          style names
         * @param  {Boolean}  isUsingJavaStyleNames Whether or not to use Java-
         *                                          style names
         * @param  {Function} callback              Callback function
         * @return {String}                         final path of the use.json
         *                                          file
         */
        this.mapPath = function(path, options, callback) {
            var lastStep = function(err, fileData, nameMap) {
                if (err !== null) {
                    callback(err);
                    return;
                }
                // create map
                var map,
                    mapArgs = {
                        'files': fileData.files,
                        'rootDir': fileData.root
                    };
                util.getNameFormat(options, mapArgs);
                // if given name map
                if (!_.isUndefined(nameMap) && nameMap !== null && 
                    _.isObject(nameMap) && _.keys(nameMap).length > 0) {
                    // integrate additional names if needed
                    if (_.has(options, 'additionalNames')) {
                        nameMap = _.extend(nameMap, options.additionalNames);
                    }
                    mapArgs['names'] = nameMap;
                    // get map
                    map = util.makeUseMap(mapArgs);
                // if we didn't parse files, but were given additional names
                } else if (options.isParsingFiles === false && 
                    _.has(options, 'additionalNames')) {
                    mapArgs['names'] = options.additionalNames;
                    map = util.makeUseMap(mapArgs);

                // otherwise if just files
                } else {
                    map = util.makeUseMap(mapArgs);
                }

                // write map to disk
                var writeOptions = {'rootDir': fileData.root};
                if (_.has(options, 'outputPath') && 
                    !_.isEmpty(options.outputPath)) {
                    writeOptions.filePath = options.outputPath;
                }
                self.writeMap(map, writeOptions, callback);
            };

            // handle steps
            if (_.has(options, 'isParsingFiles') && 
                options.isParsingFiles === true) {
                async.waterfall([
                    function(cb) {
                        self.getJsFiles(path, function(err, fileInfo) {
                            if (err !== null) {
                                cb(err);
                            } else {
                                cb(null, fileInfo);
                            }
                        });
                    },
                    function(fileInfo, cb) {
                        self.parseJsFilesContent(
                            fileInfo.files, 
                            function(err, nameMap) {
                                if (err !== null) {
                                    cb(err);
                                    return;
                                }
                                cb(null, fileInfo, nameMap);
                            }
                        );
                    }
                ], lastStep);
            } else {
                self.getJsFiles(path, function(err, fileInfo) {
                    if (err !== null) {
                        callback(err);
                        return;
                    }
                    lastStep(null, fileInfo, null);
                });
            }
        };

        this.getJsFiles = function(startPath, callback) {
            // first, verify the path
            fs.realpath(startPath, function(err, rootPath) {
                // if path not found
                if (err !== null) {
                    callback(err);
                    return;
                }
                var jsFiles = [],
                    TaskObj = function(type, path) {
                        this.type = type;
                        this.path = path;
                    },
                    TaskTypes = {
                        READDIR: "readdir",
                        STATS: "stats"
                    },
                    queue = async.queue(function(task, cb) {
                        // READ DIR TASK
                        if (task.type === TaskTypes.READDIR) {
                            logger.log("Reading directory %s...", task.path);
                            fs.readdir(task.path, function(err, files) {
                                if (err !== null) {
                                    logger.log("Error reading directory %s", 
                                                task.path);
                                    logger.log(err);
                                    cb(err);
                                    return;
                                }
                                var len = files.length;
                                for (var i=0; i<len; i++) {
                                    // add stat task to see if it's a file
                                    // or directory
                                    queue.push(new TaskObj(
                                        TaskTypes.STATS,
                                        pathlib.join(task.path, files[i])
                                    ));
                                }
                                cb();
                            });

                        // STATS TASK
                        } else if (task.type == TaskTypes.STATS) {
                            fs.stat(task.path, function(err, stats) {
                                if (err !== null) {
                                    logger.log("Error reading file %s",
                                                task.path);
                                    logger.log(err);
                                    cb(err);
                                    return;
                                }
                                var extName = pathlib.extname(task.path);
                                if (stats.isFile() && 
                                    extName.toLowerCase() === '.js') {
                                    // if it's a javascript file
                                    logger.log("Discovered file %s", task.path);
                                    jsFiles.push(task.path);
                                } else if (stats.isDirectory()) {
                                    queue.push(new TaskObj(
                                        TaskTypes.READDIR,
                                        task.path
                                    ));
                                }
                                cb();
                            });
                        }
                    }, 10);
                // on queue complete
                queue.drain = function() {
                    callback(
                        null, 
                        {
                            'files': jsFiles,
                            'root': rootPath
                        }
                    );
                };
                queue.push(new TaskObj(TaskTypes.READDIR, rootPath));
            });
        };

        this.parseJsFilesContent = function(files, callback) {
            var taskMap = {};
            files.forEach(function(filePath) {
                taskMap[filePath] = function(cb) {
                    logger.log('Parsing file %s', filePath);
                    fs.readFile(filePath, {'encoding':'utf8'}, function(err, data) {
                        if (err) {
                            logger.log("Error parsing file %s", filePath);
                            logger.log(err);
                            cb(err, null);
                            return;
                        }
                        var nm = util.parseFileData(data);
                        if (nm !== null) {
                            logger.log("-- found name %s", nm);
                        }
                        cb(null, nm);
                    });
                };
            });
            async.parallel(taskMap, function(err, result) {
                if (!_.isUndefined(err) && err !== null) {
                    callback(err, null);
                    return;
                }
                callback(null, result);
            });
        };

        /**
         * Writes the completed path map to disk
         * @param  {Object}   map      Path map to write
         * @param  {String}   rootDir  The root directory. Required.
         * @param  {String}   filePath File path to write to. Optional.
         * @param  {Function} callback Callback function
         */
        this.writeMap = function(map, options, callback) {
            var filePath;
            if (_.has(options, 'filePath') && !_.isEmpty(options.filePath)) {
                filePath = pathlib.normalize(options.filePath);
            } else if (_.has(options, 'rootDir')) {
                filePath = pathlib.join(options.rootDir, "./use.json");
            } else {
                throw new Error("ROOTDIR_REQUIRED");
            }
            var json = JSON.stringify(map, null, 4);
            logger.log("Writing map to %s...", filePath);
            fs.writeFile(filePath, json, {'encoding':'utf8'}, function(err) {
                if (!_.isUndefined(err) && err !== null) {
                    logger.log("Error writing map to disk: %j", err);
                    callback(err);
                    return;
                }
                logger.log("Complete.");
                callback(null, filePath);
            });
        };

        this.isLoggingEnabled = function() {
            if (arguments.length > 0 && _.isBoolean(arguments[0])) {
                logger.isEnabled(arguments[0]);
                return;
            }
            return logger.isEnabled();
        };

        this.setLogFunction = function(logFunction) {
            logger.setLog(logFunction);
        };
    };
    AutomapperAsync.prototype = {};

    return AutomapperAsync;

})();