module.exports = (function() {
    "use strict";

    var use = require('use-import').load();
    var AutomapperAsync = use('AutomapperAsync');
    var AutomapperSync = use('AutomapperSync');
    var ownVersion = require('own-version');

    var Automapper = function() {
        var async = new AutomapperAsync(),
            sync = new AutomapperSync();

        // async methods
        this.async = {};

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
        this.async.mapPath = function(path, options, callback) {
            async.mapPath(path, options, callback);
        };

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
        this.async.mapFiles = function(files, options, callback) {
            async.mapFiles(files, options, callback);
        };

        // sync methods
        this.sync = {};

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
         * @param  {Boolean} isUsingPathStyleNames Optional. Whether or not to
         *                                         create path-style names.
         * @param  {Boolean} isUsingJavaStyleNames Optional. Whether or not to
         *                                         create Java-style names.
         * @return {String}                        Final path of the JSON file.
         */
        this.sync.mapPath = function(path, options) {
            return sync.mapPath(path, options);
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
        this.sync.mapFiles = function(files, options) {
            return sync.mapFiles(files, options);
        };

        // version
        this.version = function() {
            return ownVersion.sync();
        };
    };
    Automapper.prototype = {};

    return Automapper;
})();