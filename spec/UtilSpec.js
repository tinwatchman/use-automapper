describe("AutomapperCommonUtil", function() {
    var use = require('use-import');
    if (!use.isLoaded) {
        use.load(require.resolve('../use.json'));
    }
    var AutomapperCommonUtil = use("AutomapperCommonUtil");
    var util;

    beforeEach(function() {
        util = new AutomapperCommonUtil();
    });
    
    describe("parseFileData", function() {
        it("should parse a given string (representing file data) and find " + 
            "any name comments within it", function() {
            var testFileData = "module.exports = (function() {\n" +
                                "   'use strict';\n" +
                                "   /* use-automapper: TestClass */\n" +
                                "   blah blah blah blah\n" +
                                "   return true;\n" +
                                "})();\n";
            var r = util.parseFileData(testFileData);
            expect(r).toBeDefined();
            expect(r).not.toBeNull();
            expect(r).toEqual("TestClass");
        });

        it("should return null when no match is found", function() {
            var testFileData = "module.exports = (function() {\n" +
                                "   'use strict';\n" +
                                "   blah blah blah blah\n" +
                                "   return true;\n" +
                                "})();\n";
            var r = util.parseFileData(testFileData);
            expect(r).toBeNull();
        });
    });

    describe("getJsFileName", function() {
        it("should return just the name of a Js file", function() {
            var r = util.getJsFileName("/Users/someone/somepath/file.js");
            expect(r).not.toBeNull();
            expect(r).toEqual("file");
        });

        it("should return null if not a .js file", function() {
            var r = util.getJsFileName("/Users/someone/somepath/file.txt");
            expect(r).toBeNull();
        });
    });

    describe("getRelativeFilePath", function() {
        it("should return a relative file path from given root to given file", function() {
            var r = util.getRelativeFilePath(
                        "/Users/someone/something/lib/index.js",
                        "/Users/someone/something"
                    );
            expect(r).toEqual("./lib/index");
        });

        it("should convert Windows paths to Unix paths for consistency", function() {
            var r = util.getRelativeFilePath(
                        "C:\\Users\\someone\\something\\lib\\index.js",
                        "C:\\Users\\someone\\something"
                    );
            expect(r).toEqual("./lib/index");
        });

        it("should be able to handle odd capitalization", function() {
            var r = util.getRelativeFilePath(
                        "C:\\Users\\someone\\something\\lib\\index.JS",
                        "C:\\Users\\someone\\something"
                    );
            expect(r).toEqual("./lib/index");
        });
    });

    describe("makeUseMap", function() {
        it("should create a name=>filepath map from the given parameters", function() {
            var files = [
                    "/Users/someone/something/index.js",
                    "/Users/someone/something/lib/Class1.js",
                    "/Users/someone/something/lib/Class2.js"
                ],
                root = "/Users/someone/something";
            var r = util.makeUseMap(files, root);
            expect(r).not.toBeNull();
            expect(r.index).toBeDefined();
            expect(r.index).toEqual("./index");
            expect(r.Class1).toBeDefined();
            expect(r.Class1).toEqual("./lib/Class1");
            expect(r.Class2).toBeDefined();
            expect(r.Class2).toEqual("./lib/Class2");
        });

        it("should work in Windows", function() {
            var files = [
                    "C:\\Users\\someone\\something\\index.js",
                    "C:\\Users\\someone\\something\\lib\\Class1.js",
                    "C:\\Users\\someone\\something\\lib\\Class2.js"
                ],
                root = "C:\\Users\\someone\\something";
            var r = util.makeUseMap(files, root);
            expect(r).not.toBeNull();
            expect(r.index).toBeDefined();
            expect(r.index).toEqual("./index");
            expect(r.Class1).toBeDefined();
            expect(r.Class1).toEqual("./lib/Class1");
            expect(r.Class2).toBeDefined();
            expect(r.Class2).toEqual("./lib/Class2");
        });

        it("should support the names option", function() {
            var files = [
                    "/Users/someone/something/index.js",
                    "/Users/someone/something/lib/one/class.js",
                    "/Users/someone/something/lib/two/class.js"
                ],
                root = "/Users/someone/something",
                names = {
                    "/Users/someone/something/lib/one/class.js": "Class1",
                    "/Users/someone/something/lib/two/class.js": "Class2"
                };
            var r = util.makeUseMap(files, root, names);
            expect(r).not.toBeNull();
            expect(r.index).toBeDefined();
            expect(r.index).toEqual("./index");
            expect(r.Class1).toBeDefined();
            expect(r.Class1).toEqual("./lib/one/class");
            expect(r.Class2).toBeDefined();
            expect(r.Class2).toEqual("./lib/two/class");
        });

        it("should be able to compensate when faced with conflicting names", function() {
            var files = [
                    "/Users/someone/something/index.js",
                    "/Users/someone/something/lib/index.js",
                    "/Users/someone/something/lib/package/index.js"
                ],
                root = "/Users/someone/something";
            var r = util.makeUseMap(files, root);
            expect(r).not.toBeNull();
            expect(r.index).toBeDefined();
            expect(r.index).toEqual("./index");
            expect(r.index1).toBeDefined();
            expect(r.index1).toEqual("./lib/index");
            expect(r.index2).toBeDefined();
            expect(r.index2).toEqual("./lib/package/index");
        });
    });
});