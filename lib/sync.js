module.exports = (function() {
    "use strict";

    var fs = require('fs');
    var pathlib = require('path');
    var _ = require('underscore');
    var use = require('use-import');
    var AutomapperCommonUtil = use('AutomapperCommonUtil');

    var AutomapperSync = function() {
        var util = new AutomapperCommonUtil();

        /**
         * Goes through a path and maps all .js files it finds
         * @param  {String}  path            Absolute file path to search
         * @param  {Boolean} isParsingFiles  Whether or not to parse files for 
         *                                   names in comments. Optional.
         * @param  {Object}  additionalNames Additional filepath=>names to 
         *                                   integrate. Optional.
         * @param  {String}  outputPath      Direct file path to output the JSON
         *                                   map to. Optional.
         * @return {String}                  The path of the JSON file
         */
        this.mapPath = function(path, options) {
            var search = this.getJsFiles(path),
                opts = _.extend({}, options, {'rootDir': search.rootDir});
            return this.mapFiles(search.files, opts);
        };

        /**
         * Produces and saves a map of the given JS files
         * @param  {Array}   files           Array of JS file paths
         * @param  {String}  rootDir         Root directory of the project. 
         *                                   Required.
         * @param  {String}  outputPath      Direct file path to output JSON map
         *                                   to. Optional.
         * @param  {Boolean} isParsingFiles  Whether or not to parse files for 
         *                                   names in comments. Optional.
         * @param  {Object}  additionalNames Additional filepath=>names to 
         *                                   integrate
         * @return {String}                  The path of the JSON file 
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
            map = util.makeUseMap(files, options.rootDir, names);
            // save
            var writeOpts = {'rootDir': options.rootDir};
            if (_.has(options, 'outputPath')) {
                writeOpts.filePath = options.outputPath;
            }
            return this.writeMap(map, writeOpts);
        };

        /**
         * Recursively maps out all JS files within the given directory
         * @param  {String} startPath Path to root directory
         * @return {Object}           With properties 'files' (JS files found) 
         *                            and 'rootDir' (resolved root directory)
         */
        this.getJsFiles = function(startPath) {
            // first, resolve start path
            var rootPath = fs.realpathSync(startPath),
                queue = [ rootPath ],
                jsFiles = [],
                currentDir,
                files,
                currentFile,
                fileStats;
            while (queue.length > 0) {
                currentDir = queue.shift();
                files = fs.readdirSync(currentDir);
                files.forEach(function(file) {
                    currentFile = pathlib.join(currentDir, file);
                    fileStats = fs.statSync(currentFile);
                    if (fileStats.isFile() && 
                        pathlib.extname(file).toLowerCase() === '.js') {
                        jsFiles.push(currentFile);
                    } else if (fileStats.isDirectory()) {
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
                var fileData = fs.readFileSync(filePath, {'encoding':'utf8'});
                map[filePath] = util.parseFileData(fileData);
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
                filePath = options.filePath;
            } else if (_.has(options, 'rootDir')) {
                filePath = pathlib.join(options.rootDir, "./use.json");
            } else {
                throw new Error("ROOTDIR_REQUIRED");
            }
            // save json
            var json = JSON.stringify(map, null, 4);
            fs.writeFileSync(filePath, json, {'encoding':'utf8'});
            return filePath;
        };
    };
    AutomapperSync.prototype = {};

    return AutomapperSync;
})();