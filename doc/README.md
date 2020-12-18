# Sleep Diary Formats

## Browser Quick Start

In your HTML:

```html
<input type="file" id="diary-input">

...

<script src=".../sleep-diary-formats.js"></script>
```
    
In your JavaScript:

```javascript
var diary_loader = new DiaryLoader(
    (diary,source) => {

        // Provide common functionality with the standard format:
        console.log( "Common functionality", diary.to("Standard") );

        // Define format-specific handlers for formats you recognise:
        switch ( diary.file_format() ) {

        case "SleepAsAndroid":
            console.log( "Extras for Sleep as Android", diary );
            break;

        case "Sleepmeter":
            console.log( "Extras for Sleepmeter", diary );
            break;

        }

    },
    (raw,source) => {
        console.log( "Failed to load", raw, source );
    }
);

document.getElementById("diary-input")
    .addEventListener( "change", event => diary_loader.load(event) );
```

See individual classes for the capabilities of each format.

## Node.JS Quick Start

Install dependencies:

```bash
npm install timezonecomplete xmldom
```

Use the package:

```javascript
const sleep_diary_formats = require(".../sleep-diary-formats.js");

...

let diary = sleep_diary_formats.new_sleep_diary( my_diary );
```

## Compiling the project

Most users can us the pre-compiled [sleep-diary-formats.js](../sleep-diary-formats.js).  If you want to compile the project yourself, install [Docker](https://www.docker.com/) then do:

```bash
# Go to the directory this file is in:
cd .../sleep-diary-formats

# First time only: create the build envirnoment:
docker build -t sleep-diary-formats .

# Build the project:
docker run --rm -v "$PWD":/sleep-diary-formats sleep-diary-formats
```

This will create a build environment that runs the [Makefile](Makefile) in a repeatable way.  The Makefile might run on your system without Docker, but is likely to produce different results.
