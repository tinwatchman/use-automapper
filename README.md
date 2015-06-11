# use-automapper
> Automatically maps projects for [`use-import`](https://www.npmjs.com/package/use-import)

This command-line utility automatically creates a `use.json` config file from an existing JavaScript project for the `use-import` module.


## Installation

```sh
npm install -g use-automapper
```


## Usage

To create a map from an existing project, navigate to that project's root directory and enter this into the command line:

```sh
use-automapper run
```

A `use.json` file will be automatically created for your project and saved to the root directory.

You can control the reference names given to your files within the map. Just put a comment like this inside each of the files you want to name:

```javascript
/* use-automapper: YourDesiredNameHere */
```


## Options

| Option                   | Short Form | Description                                                                                                                                                                                                                                                             | Example                                                                   |
|--------------------------|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| `--path`                 | `-p`       | Sets path to the project's root directory. Defaults to the current working directory.                                                                                                                                                                                   | `use-automapper run --path /Users/someone/projects/project`               |
| `--output`               | `-o`       | Sets path and filename of the config JSON file. Defaults to "use.json" within the project's root directory.                                                                                                                                                             | `use-automapper run --output /Users/someone/projects/project/useMap.json` |
| `--use-path-style-names` | `-s`       | Flag. Adds the formatted relative path to each file's name (so that, for instance, the file ./src/libs/data/MyClass.js will be named "src/libs/data/MyClass" within the map). Useful to those who like knowing the exact path to each file without checking `use.json`. | `use-automapper run --use-path-style-names`                               |
| `--use-java-style-names` | `-j`       | Flag. Adds a Java-style package path to the beginning of each file's name (so that, for instance, the file ./src/libs/data/MyClass.js will be named "src.libs.data.MyClass" within the map). Useful to those worried about namespacing.                                 | `use-automapper run --use-java-style-names`                               |
| `--disable-file-parsing` | `-d`       | Flag. Tells the utility not to check each file for /* use-automapper: name */ comments. May speed up the process for those not using this feature.                                                                                                                      | `use-automapper run --disable-file-parsing`                               |


## Credits and Licensing

Created by [Jon Stout](http://www.jonstout.net). Licensed under [the MIT license](http://opensource.org/licenses/MIT).
