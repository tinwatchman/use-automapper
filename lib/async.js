module.exports = (function() {
    "use strict";

    var fs = require('fs');
    var pathlib = require('path');
    var async = require('async');
    var _ = require('underscore');
    var use = require('use-import');
    var AutomapperCommonUtil = use('AutomapperCommonUtil');

    var AutomapperAsync = function() {
        var self = this,
            util = new AutomapperCommonUtil();

        /**
         * Goes through given array of file paths and creates a map from them.
         * @param  {Array}    files           Array of file paths
         * @param  {String}   rootDir         Root directory of project. 
         *                                    Required.
         * @param  {String}   outputPath      Direct path to output JSON map to.
         *                                    Optional.
         * @param  {Boolean}  isParsingFiles  Whether or not to parse files for
         *                                    names in comments.
         * @param  {Object}   additionalNames Additional filepath=>names to
         *                                    integrate.
         * @param  {Function} callback        Callback function.
         * @return {String}                   The path of the JSON file.
         */
        this.mapFiles = function(files, options, callback) {
            // create map
            var map,
                names = {},
                onNamesReady = function() {
                    if (_.has(options, 'additionalNames') && 
                        _.isObject(options.additionalNames)) {
                        names = _.extend({}, names, options.additionalNames);
                    }
                    // make map
                    map = util.makeUseMap(files, options.rootDir, names);
                    // write to disk
                    var writeOptions = {'rootDir': options.rootDir};
                    if (_.has(options, 'outputPath')) {
                        writeOptions.filePath = options.outputPath;
                    }
                    self.writeMap(map, writeOptions, callback);
                };
            if (_.has(options, 'isParsingFiles') && 
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
         * @param  {String}   path            Absolute file path to search
         * @param  {Boolean}  isParsingFiles  Whether or not to parse files for
         *                                    names in comments
         * @param  {Object}   additionalNames Additional filepath=>names to 
         *                                    integrate.
         * @param  {String}   outputPath      Direct path to output JSON map to.
         *                                    Optional.
         * @param  {Function} callback        Callback function
         * @return {String}                   the path of the use.json file
         */
        this.mapPath = function(path, options, callback) {
            var lastStep = function(err, fileData, nameMap) {
                if (err !== null) {
                    callback(err);
                    return;
                }
                // create map
                var map;
                // if given name map
                if (!_.isUndefined(nameMap) && nameMap !== null && 
                    _.isObject(nameMap) && _.keys(nameMap).length > 0) {
                    // integrate additional names if needed
                    if (_.has(options, 'additionalNames')) {
                        nameMap = _.extend(nameMap, options.additionalNames);
                    }
                    // get map
                    map = util.makeUseMap(
                            fileData.files, 
                            fileData.root, 
                            nameMap
                    );

                // if we didn't parse files, but were given additional names
                } else if (options.isParsingFiles === false && 
                    _.has(options, 'additionalNames')) {
                    map = util.makeUseMap(
                        fileData.files, 
                        fileData.root, 
                        options.additionalNames
                    );

                // otherwise if just files
                } else {
                    map = util.makeUseMap(fileData.files, fileData.root);
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
                            fs.readdir(task.path, function(err, files) {
                                if (err !== null) {
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
                                    cb(err);
                                    return;
                                }
                                var extName = pathlib.extname(task.path);
                                if (stats.isFile() && 
                                    extName.toLowerCase() === '.js') {
                                    // if it's a javascript file
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
                    fs.readFile(filePath, {'encoding':'utf8'}, function(err, data) {
                        if (err) {
                            cb(err, null);
                            return;
                        }
                        var nm = util.parseFileData(data);
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
                filePath = options.filePath;
            } else if (_.has(options, 'rootDir')) {
                filePath = pathlib.join(options.rootDir, "./use.json");
            } else {
                throw new Error("ROOTDIR_REQUIRED");
            }
            var json = JSON.stringify(map, null, 4);
            fs.writeFile(filePath, json, {'encoding':'utf8'}, function(err) {
                if (!_.isUndefined(err) && err !== null) {
                    callback(err);
                    return;
                }
                callback(null, filePath);
            });
        };
    };
    AutomapperAsync.prototype = {};

    return AutomapperAsync;

})();