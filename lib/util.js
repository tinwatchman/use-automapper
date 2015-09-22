module.exports = (function() {
    "use strict";

    var pathlib = require('path');
    var _ = require('underscore');

    var AutomapperCommonUtil = function() {
        var commentPattern = /\/\*\s*use-automapper:\s*([\w\-\$]+)\s*\*\//i;

        this.parseFileData = function(data) {
            var match = data.match(commentPattern);
            if (match !== null && match.length > 1) {
                return match[1];
            }
            return null;
        };

        /**
         * Turns a list of files into a name=>path map
         * @param  {Array}   files            Array of file paths
         * @param  {String}  rootDir          Absolute path of root directory
         * @param  {Object}  names            Optional. Map of file paths => 
         *                                    parsed names
         * @param  {Boolean} isUsingPathNames Optional. If using path-style 
         *                                    names
         * @param  {Boolean} isUsingJavaNames Optional. If using Java-style 
         *                                    names
         * @return {Object}                   Map of names=>relative file paths
         */
        this.makeUseMap = function(args) {
            // unpack args
            var files = args.files,
                rootDir = args.rootDir,
                names = _.has(args, 'names') ? args.names : undefined,
                isUsingPathNames = false,
                isUsingJavaNames = false;
            if (_.has(args, 'isUsingPathNames')) {
                isUsingPathNames = args.isUsingPathNames;
            }
            if (_.has(args, 'isUsingJavaNames')) {
                isUsingJavaNames = args.isUsingJavaNames;
            }
            // create map
            var map = {},
                len = files.length,
                baseName,
                name,
                path;
            for (var i=0; i<len; i++) {
                path = this.getRelativeFilePath(files[i], rootDir);
                if (_.has(names, files[i]) && names[files[i]] !== null) {
                    baseName = names[files[i]];
                } else {
                    baseName = this.getJsFileName(files[i]);
                }
                // format name based on baseName and path, if requested
                if (this.exists(baseName) && isUsingPathNames) {
                    name = this.getPathStyleName(baseName, path);
                } else if (this.exists(baseName) && isUsingJavaNames) {
                    name = this.getJavaStyleName(baseName, path);
                } else {
                    name = baseName;
                }
                if (this.exists(name) && !_.has(map, name)) {
                    map[name] = path;
                } else if (this.exists(name) && _.has(map, name)) {
                    var num = 1,
                        isPlaced = false;
                    while (!isPlaced) {
                        if (!_.has(map, String(name + num))) {
                            map[String(name + num)] = path;
                            isPlaced = true;
                        }
                        num++;
                    }
                }
            }
            return map;
        };

        this.getRelativeFilePath = function(filePath, root) {
            var convertedPath = this.replaceBackSlashes(filePath),
                convertedRoot = this.replaceBackSlashes(root),
                path = this.replaceBackSlashes(pathlib.relative(convertedRoot, convertedPath));
            path = path.replace(/\.js$/i, '');
            if (path[0] === '/') {
                path = '.' + path;
            } else if (path.substr(0, 2) !== './') {
                path = './' + path;
            }
            return path;
        };

        this.getJsFileName = function(path) {
            var parse = pathlib.parse(this.replaceBackSlashes(path));
            if (!_.isUndefined(parse) && !_.isNull(parse) && 
                _.has(parse, 'name') && parse['ext'] === '.js') {
                return parse.name;
            }
            return null;
        };

        /**
         * Returns whether or not the given path is contained within a 
         * `node_modules` folder.
         * @param  {String}  path File path
         * @return {Boolean}      True if within `node_modules`, false otherwise
         */
        this.isNodeModule = function(path) {
            var dirpath = this.replaceBackSlashes(pathlib.dirname(path));
            return _.some(dirpath.split('/'), function(dir) {
                return (dir.toLowerCase() === "node_modules");
            });
        };

        /**
         * Get a name for a file based on its relative path with forward 
         * slashes.
         * @param  {String} name         Module name
         * @param  {String} relativePath Relative path to module
         * @return {String}              Path formatted as a name
         */
        this.getPathStyleName = function(name, relativePath) {
            // remove opening dot-slash
            var path = relativePath.replace(/\.\/+/i, '');
            // check to see if the path is just one level without the dot-slash
            if (path.search(/\//i) === -1) {
                // just return the name
                return name;
            }
            // remove the final part of the path
            path = path.replace(/\/[^\/]+$/i, '');
            // make sure only single slashes in the path
            while (path.search(/\/\/+/i) > -1) {
                path = path.replace(/\/+/i, '/');
            }
            // return in expected format
            return path + '/' + name;
        };

        /**
         * Given a module's name and relative filepath, returns a Java-style 
         * class name with packages.
         * @param  {String} name         Module name
         * @param  {String} relativePath Relative path to module
         * @return {String}              Java-formatted full name
         */
        this.getJavaStyleName = function(name, relativePath) {
            // remove opening dot-slash
            var packagePath = relativePath.replace(/\.\/+/i, '');
            // check to see if the path is just one level without the dot-slash
            if (packagePath.search(/\//i) === -1) {
                // just return the name
                return this.toTitleCase(name);
            }
            // remove the final part of the path
            packagePath = packagePath.replace(/\/[^\/]+$/i, '');
            // replace slashes with dots
            while (packagePath.search(/\//) > -1) {
                packagePath = packagePath.replace(/\/+/i, '.');
            }
            // strip all whitespace from name
            while (name.search(/\s/i) > -1) {
                name = name.replace(/\s+/i, '');
            }
            // return in java format
            return packagePath + '.' + this.toTitleCase(name);
        };

        /**
         * Replaces Windows-style backslashes in filepaths with Unix-style 
         * forward-slashes for consistency
         * @param  {String} path A filepath
         * @return {String}      Path with all backslashes converted
         */
        this.replaceBackSlashes = function(path) {
            while (path.search(/\\/i) > -1) {
                path = path.replace(/\\/i, '/');
            }
            return path;
        };

        /**
         * Formats given str to title case
         * @param  {String} str String
         * @return {String}     String to title case
         */
        this.toTitleCase = function(str) {
            if (str.search(/\s/) > -1) {
                return str.replace(/\w\S*/g, function(txt) {
                    return txt[0].toUpperCase() + txt.substr(1);
                });
            }
            return str[0].toUpperCase() + str.substr(1);
        };

        this.exists = function(obj) {
            return (!_.isUndefined(obj) && !_.isNull(obj));
        };

        this.getNameFormat = function(options, mapArgs) {
            if (_.has(options, 'isUsingPathStyleNames') && 
                options.isUsingPathStyleNames === true) {
                mapArgs['isUsingPathNames'] = true;
            } else if (_.has(options, 'isUsingJavaStyleNames') && 
                        options.isUsingJavaStyleNames === true) {
                mapArgs['isUsingJavaNames'] = true;
            }
        };
    };
    AutomapperCommonUtil.prototype = {};

    return AutomapperCommonUtil;

})();