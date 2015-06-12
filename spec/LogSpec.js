describe("AutomapperLogger", function() {
    var use = require('use-import').load();
    var AutomapperLogger = use('AutomapperLogger');
    var logger;

    beforeEach(function() {
        logger = new AutomapperLogger();
    });

    it("should wrap a log function that can be set from the outside", function() {
        var myLogFunc = function() {
            console.log("myLogFunc!");
        };
        logger.setLog(myLogFunc);
        expect(logger.getLog()).toBe(myLogFunc);
    });

    it("should be disabled by default", function() {
        expect(logger.isEnabled()).toBe(false);
    });

    it("should only print logs when enabled", function() {
        var lastLog,
            myLog = function(msg) {
                lastLog = msg;
            };
        logger.setLog(myLog);
        logger.log("test message");
        expect(lastLog).not.toBeDefined();
        logger.isEnabled(true);
        logger.log("test message 2");
        expect(lastLog).toEqual("test message 2");
    });

    it("should support string formatting, just like console.log", function() {
        var lastLog,
            myLog = function(msg) {
                lastLog = msg;
            };
        logger.setLog(myLog);
        logger.isEnabled(true);
        logger.log("My test message: %s", "test");
        expect(lastLog).toEqual("My test message: test");
    });
});