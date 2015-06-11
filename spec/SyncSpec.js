describe("AutomapperSync", function() {
    var use = require('use-import');
    if (!use.isLoaded) {
        use.load(require.resolve('../use.json'));
    }
    var AutomapperSync = use('AutomapperSync');
    var fs = require('fs-extra');
    var path = require('path');
    var _ = require('underscore');

    var sync,
        tmpDir = path.join(__dirname, "./AutomapperSync" + Date.now() + "/");

    beforeAll(function() {
        fs.ensureDirSync(tmpDir);
        sync = new AutomapperSync();
    });

    afterAll(function() {
        fs.removeSync(tmpDir);
    });

    describe("parseJsFilesContent", function() {
        it("should exist", function() {
            expect(sync.parseJsFilesContent).toBeDefined();
            expect(_.isFunction(sync.parseJsFilesContent)).toBe(true);
        });

        it("should parse the content of the given list of JS files", function() {
            var root = path.join(tmpDir, "./parseJsFilesContent/"),
                indexFile = path.join(root, "./index.js"),
                level1 = path.join(root, "./level1/"),
                file1 = path.join(level1, "./file1.js"),
                level2 = path.join(level1, "./level2/"),
                file2 = path.join(level2, "./file2.js");
            fs.ensureDirSync(root);
            fs.ensureDirSync(level1);
            fs.ensureDirSync(level2);
            fs.writeFileSync(indexFile, "/* use-automapper: TestIndex */", {'encoding': 'utf8'});
            fs.writeFileSync(file2, "\n\n/* use-automapper: Class2 */\n\n");
            fs.ensureFileSync(file1);
            var result = sync.parseJsFilesContent([indexFile, file1, file2]);
            fs.removeSync(root);
            expect(_.keys(result).length).toEqual(3);
            expect(_.values(result)).toContain("TestIndex");
            expect(_.values(result)).toContain("Class2");
        });
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

        it("should exist", function() {
            expect(sync.getJsFiles).toBeDefined();
            expect(_.isFunction(sync.getJsFiles)).toBe(true);
        });

        it("should map all of the js files under the given path", function() {
            // set up files
            var file1 = path.join(root, "./file1.js"),
                file2 = path.join(level1, "./file2.js"),
                file3 = path.join(level2, "./file3.js");
            fs.ensureFileSync(file1);
            fs.ensureFileSync(file2);
            fs.ensureFileSync(file3);
            
            var result = sync.getJsFiles(root);

            expect(result.rootDir).toBeDefined();
            expect(result.rootDir).not.toBeNull();
            expect(path.normalize(result.rootDir)).toEqual(path.normalize(root));
            expect(result.files).toBeDefined();
            expect(result.files.length).toEqual(3);
        });

        it("should return as empty if there are no JS files", function() {
            var result = sync.getJsFiles(root);
            expect(result.rootDir).toBeDefined();
            expect(result.rootDir).not.toBeNull();
            expect(path.normalize(result.rootDir)).toEqual(path.normalize(root));
            expect(result.files).toBeDefined();
            expect(result.files.length).toEqual(0);
        });

        it("should throw an error if given a nonexisting path", function() {
            var err,
                result,
                fakePath = path.join(level12, "./MyFakePath");
            try {
                result = sync.getJsFiles(fakePath);
            } catch (e) {
                err = e;
            }
            expect(err).toBeDefined();
            expect(result).not.toBeDefined();
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

        it("should exist", function() {
            expect(sync.writeMap).toBeDefined();
            expect(_.isFunction(sync.writeMap)).toBe(true);
        });

        it("should write the given filemap to disk", function() {
            var testMap = {
                "MyName": "./MyFakePath/MyClass",
                "MyOtherName": "./MyOtherClass"
            };
            var writePath = sync.writeMap(testMap, {'rootDir': rootDir, 'filePath': filePath});
            expect(writePath).toBeDefined();
            expect(_.isString(writePath)).toBe(true);
            expect(writePath).toEqual(path.normalize(filePath));
            expect(fs.existsSync(writePath)).toBe(true);
            var mapData = fs.readJsonSync(writePath);
            expect(mapData.MyName).toBeDefined();
            expect(mapData.MyName).toEqual("./MyFakePath/MyClass");
            expect(mapData.MyOtherName).toBeDefined();
            expect(mapData.MyOtherName).toEqual("./MyOtherClass");
        });

        it("should overwrite an existing JSON config file", function() {
            fs.writeJsonSync(filePath, { 'isOriginalFile': true });
            var testMap = {
                "MyName": "./MyFakePath/MyClass",
                "MyOtherName": "./MyOtherClass"
            };
            var writePath = sync.writeMap(testMap, {'rootDir': rootDir, 'filePath': filePath});
            expect(writePath).toEqual(path.normalize(filePath));
            expect(fs.existsSync(writePath)).toBe(true);
            var mapData = fs.readJsonSync(writePath);
            expect(mapData.isOriginalFile).not.toBeDefined();
            expect(mapData.MyName).toEqual("./MyFakePath/MyClass");
            expect(mapData.MyOtherName).toEqual("./MyOtherClass");
        });
    });

    describe("mapFiles", function() {
        it("should exist", function() {
            expect(sync.mapFiles).toBeDefined();
            expect(_.isFunction(sync.mapFiles)).toBe(true);
        });

        it("should produce a JSON map of the given files", function() {
            // create environment
            var root = path.join(tmpDir, "./mapFiles"),
                indexFile = path.join(root, "./index.js"),
                level1 = path.join(root, "./level1"),
                file1 = path.join(level1, "./Class1.js"),
                level2 = path.join(level1, "./level2"),
                file2 = path.join(level2, "./file2.js");
            fs.ensureDirSync(root);
            fs.ensureDirSync(level1);
            fs.ensureDirSync(level2);
            fs.writeFileSync(indexFile, "/* use-automapper: TestIndex */", {'encoding': 'utf8'});
            fs.writeFileSync(file2, "\n\n/* use-automapper: Class2 */\n\n");
            fs.ensureFileSync(file1);
            // run test
            var useFilePath = sync.mapFiles([indexFile, file1, file2], {'rootDir': root, 'isParsingFiles':true});
            // set expectations
            expect(useFilePath).toBeDefined();
            expect(useFilePath).not.toBeNull();
            expect(path.normalize(useFilePath)).toEqual(path.join(root, "./use.json"));
            var useData = fs.readJsonSync(useFilePath);
            expect(useData.TestIndex).toBeDefined();
            expect(useData.TestIndex).toEqual("./index");
            expect(useData.Class1).toBeDefined();
            expect(useData.Class1).toEqual("./level1/Class1");
            expect(useData.Class2).toBeDefined();
            expect(useData.Class2).toEqual("./level1/level2/file2");
            // clear environment
            fs.removeSync(root);
        });
        
        it("should support the isUsingPathStyleNames option", function() {
            // create environment
            var root = path.join(tmpDir, "./mapFiles"),
                indexFile = path.join(root, "./index.js"),
                level1 = path.join(root, "./level1"),
                file1 = path.join(level1, "./Class1.js"),
                level2 = path.join(level1, "./level2"),
                file2 = path.join(level2, "./file2.js");
            fs.ensureDirSync(root);
            fs.ensureDirSync(level1);
            fs.ensureDirSync(level2);
            fs.writeFileSync(indexFile, "/* use-automapper: TestIndex */", {'encoding': 'utf8'});
            fs.writeFileSync(file2, "\n\n/* use-automapper: Class2 */\n\n");
            fs.ensureFileSync(file1);
            // run test
            var useFilePath = sync.mapFiles([indexFile, file1, file2], {
                'rootDir': root, 
                'isParsingFiles': true,
                'isUsingPathStyleNames': true
            });
            // set expectations
            expect(useFilePath).toBeDefined();
            expect(useFilePath).not.toBeNull();
            expect(path.normalize(useFilePath)).toEqual(path.join(root, "./use.json"));
            var useData = fs.readJsonSync(useFilePath);
            expect(useData.TestIndex).toBeDefined();
            expect(useData.TestIndex).toEqual("./index");
            expect(useData["level1/Class1"]).toBeDefined();
            expect(useData["level1/Class1"]).toEqual("./level1/Class1");
            expect(useData["level1/level2/Class2"]).toBeDefined();
            expect(useData["level1/level2/Class2"]).toEqual("./level1/level2/file2");
            // clear environment
            fs.removeSync(root);
        });
        
        it("should support the isUsingJavaStyleNames option", function() {
            // create environment
            var root = path.join(tmpDir, "./mapFiles"),
                indexFile = path.join(root, "./index.js"),
                level1 = path.join(root, "./level1"),
                file1 = path.join(level1, "./Class1.js"),
                level2 = path.join(level1, "./level2"),
                file2 = path.join(level2, "./file2.js");
            fs.ensureDirSync(root);
            fs.ensureDirSync(level1);
            fs.ensureDirSync(level2);
            fs.writeFileSync(indexFile, "/* use-automapper: TestIndex */", {'encoding': 'utf8'});
            fs.writeFileSync(file2, "\n\n/* use-automapper: Class2 */\n\n");
            fs.ensureFileSync(file1);
            // run test
            var useFilePath = sync.mapFiles([indexFile, file1, file2], {
                'rootDir': root, 
                'isParsingFiles': true,
                'isUsingJavaStyleNames': true
            });
            // set expectations
            expect(useFilePath).toBeDefined();
            expect(useFilePath).not.toBeNull();
            expect(path.normalize(useFilePath)).toEqual(path.join(root, "./use.json"));
            var useData = fs.readJsonSync(useFilePath);
            expect(useData.TestIndex).toBeDefined();
            expect(useData.TestIndex).toEqual("./index");
            expect(useData["level1.Class1"]).toBeDefined();
            expect(useData["level1.Class1"]).toEqual("./level1/Class1");
            expect(useData["level1.level2.Class2"]).toBeDefined();
            expect(useData["level1.level2.Class2"]).toEqual("./level1/level2/file2");
            // clear environment
            fs.removeSync(root);
        });
    });

    describe("mapPath", function() {
        var root = path.join(tmpDir, "./mapPath"),
            indexFile = path.join(root, "./index.js"),
            level1 = path.join(root, "./level1"),
            file1 = path.join(level1, "./Class1.js"),
            level2 = path.join(level1, "./level2"),
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

        it("should exist", function() {
            expect(sync.mapPath).toBeDefined();
            expect(_.isFunction(sync.mapPath)).toBe(true);
        });

        it("should map the given path and create a new use.json file", function() {
            var useFilePath = sync.mapPath(root, {});
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
        });

        it("should support the isParsingFiles option", function() {
            var useFilePath = sync.mapPath(root, {'isParsingFiles': true});
            expect(useFilePath).toBeDefined();
            expect(useFilePath).not.toBeNull();
            var useData = fs.readJsonSync(useFilePath);
            expect(useData.TestIndex).toBeDefined();
            expect(useData.TestIndex).toEqual("./index");
            expect(useData.Class1).toBeDefined();
            expect(useData.Class1).toEqual("./level1/Class1");
            expect(useData.Class2).toBeDefined();
            expect(useData.Class2).toEqual("./level1/level2/file2");
        });
    });
});