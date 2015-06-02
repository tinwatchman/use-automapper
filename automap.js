module.exports = (function() {
    "use strict";

    var use = require('use-import').load();
    var AutomapperAsync = use('AutomapperAsync');
    var AutomapperSync = use('AutomapperSync');

    var Automapper = function() {
        var async = new AutomapperAsync(),
            sync = new AutomapperSync();

        // async methods
        this.async = {};

        this.async.mapPath = function(path, options, callback) {
            async.mapPath(path, options, callback);
        };

        this.async.mapFiles = function(files, options, callback) {
            async.mapFiles(files, options, callback);
        };

        // sync methods
        this.sync = {};

        this.sync.mapPath = function(path, options) {
            return sync.mapPath(path, options);
        };

        this.sync.mapFiles = function(files, options) {
            return sync.mapFiles(files, options);
        };
    };
    Automapper.prototype = {};

    return Automapper;
})();