module.exports = (function() {
    "use strict";

    var fs = require('fs');
    var pathlib = require('path');
    var _ = require('underscore');
    var use = require('use-import');
    var AutomapperCommonUtil = use('AutomapperCommonUtil');
    var AutomapperLogger = use('AutomapperLogger');

    var AutomapperSync = function() {
        var util = new AutomapperCommonUtil(),
            logger = new AutomapperLogger();

        /**
         * Goes through a path and maps all .js files it finds
         * @param  {String}  path                  Required. Absolute file path 
         *                                         to search.
         * @param  {String}  outputPath            Optional. Direct file path to
         *                                         output JSON map to.
         * @param  {Object}  additionalNames       Optional. Additional filepath
         *                                         => names to integrate.
         * @param  {Boolean} isParsingFiles        Optional. Whether or not to
         *                                         parse files for names in the
         *                                         comments.
         * @param  {Boolean} includeNodeModules    Optional. Whether or not to
         *                                         include the .js files inside
         *                                         of `node_modules` folders in
         *                                         the final map.
         * @param  {Boolean} isUsingPathStyleNames Optional. Whether or not to
         *                                         create path-style names.
         * @param  {Boolean} isUsingJavaStyleNames Optional. Whether or not to
         *                                         create Java-style names.
         * @return {String}                        Final path of the JSON file.
         */
        this.mapPath = function(path, options) {
            var search;
            if (_.has(options, "includeNodeModules") && 
                _.isBoolean(options.includeNodeModules)) {
                search = this.getJsFiles(path, options.includeNodeModules);
            } else {
                search = this.getJsFiles(path);
            }
            var opts = _.extend({}, options, {'rootDir': search.rootDir});
            return this.mapFiles(search.files, opts);
        };

        /**
         * Produces and saves a map of the given JS files
         * @param  {Array}   files                 Array of JS file paths
         * @param  {String}  rootDir               Required. Root directory of 
         *                                         the project.
         * @param  {String}  outputPath            Optional. Direct file path to
         *                                         output JSON map to.
         * @param  {Object}  additionalNames       Optional. Additional filepath
         *                                         => names to integrate.
         * @param  {Boolean} isParsingFiles        Optional. Whether or not to
         *                                         parse files for names in the
         *                                         comments.
         * @param  {Boolean} isUsingPathStyleNames Optional. Whether or not to
         *                                         create path-style names.
         * @param  {Boolean} isUsingJavaStyleNames Optional. Whether or not to
         *                                         create Java-style names.
         * @return {String}                        Final path of the JSON file.
         */
        this.mapFiles = function(files, options) {
            if (!_.has(options, 'rootDir')) {
                throw new Error("ROOTDIR_REQUIRED");   
            }
            var map,
                names = {};
            // get names
            if (_.has(options, 'isParsingFiles') && 
                options.isParsingFiles === true) {
                var nameMap = this.parseJsFilesContent(files);
                names = _.extend({}, names, nameMap); 
            }
            if (_.has(options, 'additionalNames') && 
                _.isObject(options.additionalNames)) {
                names = _.extend({}, names, options.additionalNames);
            }
            // make map
            var mapArgs = {
                'files': files, 
                'rootDir': options.rootDir, 
                'names': names
            };
            util.getNameFormat(options, mapArgs);
            map = util.makeUseMap(mapArgs);
            // save
            var writeOpts = {'rootDir': options.rootDir};
            if (_.has(options, 'outputPath')) {
                writeOpts.filePath = options.outputPath;
            }
            return this.writeMap(map, writeOpts);
        };

        /**
         * Recursively maps out all JS files within the given directory
         * @param  {String}  startPath              Path to root directory
         * @param  {Boolean} isIncludingNodeModules Optional. Whether or not to 
         *                                          include files inside of 
         *                                          node_modules
         * @return {Object}                         With properties 'files' 
         *                                          (Array of JS files found) 
         *                                          and 'rootDir' (resolved 
         *                                          root directory)
         */
        this.getJsFiles = function(startPath) {
            // first, resolve start path
            var rootPath = fs.realpathSync(startPath),
                queue = [ rootPath ],
                jsFiles = [],
                currentDir,
                files,
                currentFile,
                fileStats,
                isIncludingNodeModules = false;
            if (arguments.length > 1 && arguments[1] === true) {
                isIncludingNodeModules = true;
            }
            while (queue.length > 0) {
                currentDir = queue.shift();
                logger.log("Reading directory %s...", currentDir);
                files = fs.readdirSync(currentDir);
                files.forEach(function(file) {
                    currentFile = pathlib.join(currentDir, file);
                    fileStats = fs.statSync(currentFile);
                    if (fileStats.isFile() && 
                        pathlib.extname(file).toLowerCase() === '.js' &&
                        (isIncludingNodeModules || 
                         !util.isNodeModule(currentFile))) {
                        logger.log('Discovered file %s', currentFile);
                        jsFiles.push(currentFile);
                    } else if (fileStats.isDirectory() &&
                        (isIncludingNodeModules || 
                         !util.isNodeModule(currentFile))) {
                        queue.push(currentFile);
                    }
                });
            };
            return {
                'files': jsFiles,
                'rootDir': rootPath
            };
        };

        /**
         * Parses array of given files for comment names
         * @param  {Array}  files Array of file paths
         * @return {Object}       Map of filepaths => names
         */
        this.parseJsFilesContent = function(files) {
            var map = {};
            files.forEach(function(filePath) {
                logger.log('Parsing file %s', filePath);
                var fileData = fs.readFileSync(filePath, {'encoding':'utf8'});
                map[filePath] = util.parseFileData(fileData);
                if (!_.isNull(map[filePath])) {
                    logger.log("-- found name %s", map[filePath]);
                }
            });
            return map;
        };

        /**
         * Writes the completed path map to disk
         * @param  {Object}   map      Path map to write
         * @param  {String}   rootDir  The root directory. Required.
         * @param  {String}   filePath File path to write to. Optional.
         * @return {String}            Returns path to new file as String.
         */
        this.writeMap = function(map, options) {
            // resolve file path
            var filePath;
            if (_.has(options, 'filePath') && !_.isEmpty(options.filePath)) {
                filePath = pathlib.normalize(options.filePath);
            } else if (_.has(options, 'rootDir')) {
                filePath = pathlib.join(options.rootDir, "./use.json");
            } else {
                throw new Error("ROOTDIR_REQUIRED");
            }
            // save json
            var json = JSON.stringify(map, null, 4);
            logger.log("Writing map to %s...", filePath);
            fs.writeFileSync(filePath, json, {'encoding':'utf8'});
            logger.log("Complete.");
            return filePath;
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
    AutomapperSync.prototype = {};

    return AutomapperSync;
})();