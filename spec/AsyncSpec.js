describe("AutomapperAsync", function() {
    var use = require('use-import');
    if (!use.isLoaded) {
        use.load(require.resolve('../use.json'));
    }
    var AutomapperAsync = use('AutomapperAsync');
    var AutomapperCommonUtil = use('AutomapperCommonUtil');
    var fs = require('fs-extra');
    var path = require('path');
    var _ = require('underscore');

    var async,
        util = new AutomapperCommonUtil(),
        tmpDir = path.join(__dirname, "./AutomapperAsync" + Date.now() + "/");

    beforeAll(function() {
        fs.ensureDirSync(tmpDir);
    });

    afterAll(function() {
        fs.removeSync(tmpDir);
    });

    beforeEach(function() {
        async = new AutomapperAsync();
    });

    describe("getJsFiles", function() {
        var root = path.join(tmpDir, "./getJsFiles"),
            level1 = path.join(root, "./level1"),
            level12 = path.join(root, "./level1.2"),
            level2 = path.join(level12, "./level2");

        beforeEach(function() {
            fs.ensureDirSync(root);
            fs.ensureDirSync(level1);
            fs.ensureDirSync(level12);
            fs.ensureDirSync(level2);
        });

        afterEach(function() {
            fs.removeSync(root);
        });

        it("should asynchronously map all of the js files under the given path", function(done) {
            // set up files
            var file1 = path.join(root, "file1.js"),
                file2 = path.join(level1, "file2.js"),
                file3 = path.join(level2, "file3.js");
            fs.ensureFileSync(file1);
            fs.ensureFileSync(file2);
            fs.ensureFileSync(file3);
            // run async
            async.getJsFiles(root, function(err, result) {
                expect(result.root).toBeDefined();
                expect(result.root).not.toBeNull();
                expect(path.normalize(result.root)).toEqual(path.normalize(root));
                expect(result.files).toBeDefined();
                expect(result.files.length).toEqual(3);
                done();
            });
        });

        it("should return as empty if there are no JS files", function(done) {
            async.getJsFiles(root, function(err, result) {
                expect(err).toBeNull();
                expect(result.root).toBeDefined();
                expect(result.root).not.toBeNull();
                expect(path.normalize(result.root)).toEqual(path.normalize(root));
                expect(result.files).toBeDefined();
                expect(result.files.length).toEqual(0);
                done();
            });
        });

        it("should return an error if given a nonexisting path", function(done) {
            var fakePath = path.join(level12, "./MyFakePath/");
            async.getJsFiles(fakePath, function(err, result) {
                expect(err).not.toBeNull();
                expect(result).not.toBeDefined();
                done();
            });
        });
    });

    describe("parseJsFilesContent", function() {
        var root = path.join(tmpDir, "./parseJsFilesContent/"),
            indexFile = path.join(root, "./index.js"),
            level1 = path.join(root, "./level1/"),
            file1 = path.join(level1, "./file1.js"),
            level2 = path.join(level1, "./level2/"),
            file2 = path.join(level2, "./file2.js");

        beforeEach(function() {
            fs.ensureDirSync(root);
            fs.ensureDirSync(level1);
            fs.ensureDirSync(level2);
            fs.writeFileSync(indexFile, "/* use-automapper: TestIndex */", {'encoding': 'utf8'});
            fs.writeFileSync(file2, "\n\n/* use-automapper: Class2 */\n\n");
            fs.ensureFileSync(file1);
        });

        afterEach(function() {
            fs.removeSync(root);
        });

        it("should asynchronously parse the content of the given list of JS files", function(done) {
            async.parseJsFilesContent([indexFile, file1, file2], function(err, result) {
                expect(err).toBeNull();
                expect(_.keys(result).length).toEqual(3);
                expect(_.values(result)).toContain("TestIndex");
                expect(_.values(result)).toContain("Class2");
                done();
            });
        });
    });

    describe("mapPath", function() {
        var root = path.join(tmpDir, "./mapPath/"),
            indexFile = path.join(root, "./index.js"),
            level1 = path.join(root, "./level1/"),
            file1 = path.join(level1, "./Class1.js"),
            level2 = path.join(level1, "./level2/"),
            file2 = path.join(level2, "./file2.js");

        beforeEach(function() {
            fs.ensureDirSync(root);
            fs.ensureDirSync(level1);
            fs.ensureDirSync(level2);
            fs.writeFileSync(indexFile, "/* use-automapper: TestIndex */", {'encoding': 'utf8'});
            fs.writeFileSync(file2, "\n\n/* use-automapper: Class2 */\n\n");
            fs.ensureFileSync(file1);
        });

        afterEach(function() {
            fs.removeSync(root);
        });

        it("should asynchronously map the given path and create a new use.json file", function(done) {
            async.mapPath(root, {'isParsingFiles': false}, function(err, useFilePath) {
                expect(err).toBeNull();
                expect(useFilePath).toBeDefined();
                expect(useFilePath).not.toBeNull();
                expect(_.isString(useFilePath)).toBe(true);
                var useData = fs.readJsonSync(useFilePath);
                expect(useData.index).toBeDefined();
                expect(useData.index).toEqual("./index");
                expect(useData.Class1).toBeDefined();
                expect(useData.Class1).toEqual("./level1/Class1");
                expect(useData.file2).toBeDefined();
                expect(useData.file2).toEqual("./level1/level2/file2");
                done();
            });
        });

        it("should support isParsingFiles option", function(done) {
            async.mapPath(root, {'isParsingFiles': true}, function(err, useFilePath) {
                expect(err).toBeNull();
                expect(useFilePath).toBeDefined();
                expect(useFilePath).not.toBeNull();
                if (!_.isUndefined(useFilePath)) {
                    var useData = fs.readJsonSync(useFilePath);
                    expect(useData.TestIndex).toBeDefined();
                    expect(useData.TestIndex).toEqual("./index");
                    expect(useData.Class1).toBeDefined();
                    expect(useData.Class1).toEqual("./level1/Class1");
                    expect(useData.Class2).toBeDefined();
                    expect(useData.Class2).toEqual("./level1/level2/file2");
                }
                done();
            });
        });
    });

    describe("writeMap", function() {
        var rootDir = path.join(tmpDir, "./writeMap/"),
            filePath = path.join(rootDir, "./something.json");

        beforeEach(function() {
            fs.ensureDirSync(rootDir);
        });

        afterEach(function() {
            fs.removeSync(rootDir);
        });

        it("should write the given filemap asynchronously to disk", function(done) {
            var testMap = {
                "MyName": "./MyFakePath/MyClass",
                "MyOtherName": "./MyOtherClass"
            };
            async.writeMap(testMap, {'rootDir': rootDir}, function(err, writePath) {
                expect(err).toBeNull();
                expect(writePath).toBeDefined();
                expect(_.isString(writePath)).toBe(true);
                expect(writePath.indexOf(path.join(rootDir, "./use.json")) > -1).toBe(true);
                expect(fs.existsSync(writePath)).toBe(true);
                var mapData = fs.readJsonSync(writePath);
                expect(mapData.MyName).toBeDefined();
                expect(mapData.MyName).toEqual("./MyFakePath/MyClass");
                expect(mapData.MyOtherName).toBeDefined();
                expect(mapData.MyOtherName).toEqual("./MyOtherClass");
                done();
            });
        });

        it("should support the filePath option", function(done) {
            var testMap = {
                "MyName": "./MyFakePath/MyClass",
                "MyOtherName": "./MyOtherClass"
            };
            async.writeMap(testMap, {'filePath': filePath}, function(err, writePath) {
                expect(err).toBeNull();
                expect(writePath).toBeDefined();
                if (!_.isUndefined(writePath)) {
                    expect(_.isString(writePath)).toBe(true);
                    expect(writePath.indexOf(filePath) > -1).toBe(true);
                    expect(fs.existsSync(filePath)).toBe(true);
                    var mapData = fs.readJsonSync(writePath);
                    expect(mapData.MyName).toBeDefined();
                    expect(mapData.MyName).toEqual("./MyFakePath/MyClass");
                    expect(mapData.MyOtherName).toBeDefined();
                    expect(mapData.MyOtherName).toEqual("./MyOtherClass");
                }
                done();
            });
        });
    });
});