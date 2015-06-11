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

#### Name Comments

You can control the reference names given to your files within the map. Just put a comment like this inside each of the files you want to name:

```javascript
/* use-automapper: YourDesiredNameHere */
```


## Options and Flags

### `--path`
**Short form:** `-p`

Specifies path to the project's root directory. Defaults to the current working directory.

##### Example
```sh
use-automapper run --path /Users/someone/projects/project
use-automapper run -p /Users/someone/projects/project
```

### `--output`
**Short form:** `-o`

Sets path and filename of the config JSON file. Defaults to `use.json` within the project's root directory.

##### Example
```sh
use-automapper run --output /Users/someone/projects/project/useMap.json
use-automapper run -o /Users/someone/projects/project/useMap.json
```

### `--use-path-style-names`
**Short form:** `-s`

Flag. Adds the formatted relative path to each file's name (so that, for instance, the file `./src/libs/data/MyClass.js` will be named "src/libs/data/MyClass" within the map). Useful to those who prefer to know the exact path to each file without checking `use.json`.

##### Example
```sh
use-automapper run --use-path-style-names
use-automapper run -s
```

### `--use-java-style-names`
**Short form:** `-j`

Flag. Adds a Java-style package path to the beginning of each file's name (so that, for instance, the file `./src/libs/data/MyClass.js` will be named "src.libs.data.MyClass" within the map). Potentially useful for those worried about namespacing.

##### Example
```sh
use-automapper run --use-java-style-names
use-automapper run -j
```

### `--disable-file-parsing`
**Short form:*** `-d`

Flag. Tells the utility not to check files for [name comments](#name-comments). May speed up the process for those not using this feature.


## Credits and Licensing

Created by [Jon Stout](http://www.jonstout.net). Licensed under [the MIT license](http://opensource.org/licenses/MIT).
