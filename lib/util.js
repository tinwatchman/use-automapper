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

        this.getJsFileName = function(path) {
            var parse = pathlib.parse(path);
            if (!_.isUndefined(parse) && !_.isNull(parse) && 
                _.has(parse, 'name') && parse['ext'] === '.js') {
                return parse.name;
            }
            return null;
        };

        /**
         * Turns a list of files into a name=>path map
         * @param  {Array}  files Array of file paths
         * @param  {String} root  Absolute path of root directory
         * @param  {Object} names Optional. Map of file paths => parsed names
         * @return {Object}       Map of names=>relative file paths
         */
        this.makeUseMap = function(files, root) {
            // check for names argument
            var names;
            if (arguments.length > 2 && _.isObject(arguments[2])) {
                names = arguments[2];
            } else {
                names = {};
            }
            // create map
            var map = {},
                len = files.length,
                name,
                path;
            for (var i=0; i<len; i++) {
                path = this.getRelativeFilePath(files[i], root);
                if (_.has(names, files[i]) && names[files[i]] !== null) {
                    name = names[files[i]];
                } else {
                    name = this.getJsFileName(this.replaceBackSlashes(files[i]));
                }
                if (!_.isUndefined(name) && name !== null && 
                    !_.has(map, name)) {
                    map[name] = path;
                } else if (_.has(map, name)) {
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
         * @deprecated returns str to title case
         */
        this.toTitleCase = function(str) {
            if (str.search(/\s/) > -1) {
                return str.replace(/\w\S*/g, function(txt) {
                    return txt[0].toUpperCase() + txt.substr(1);
                });
            }
            return str[0].toUpperCase() + str.substr(1);
        };

    };
    AutomapperCommonUtil.prototype = {};

    return AutomapperCommonUtil;

})();