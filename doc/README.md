# Sleep Diary Core Library

## Browser Quick Start

In your HTML:

```html
<input type="file" id="diary-input">

...

<script src="https://sleepdiary.github.io/core/sleepdiary-core.min.js"></script>
```

In your JavaScript:

```javascript
var diary_loader = new DiaryLoader(
    (diary,source) => {

        // Provide common functionality with the standard format:
        console.log( "Common functionality", diary.to("Standard") );

        // Define format-specific handlers for formats you recognise:
        switch ( diary.file_format() ) {

        case "PleesTracker":
            console.log( "Extras for PleesTracker", diary );
            break;

        case "Sleepmeter":
            console.log( "Extras for Sleepmeter", diary );
            break;

        case "SleepAsAndroid":
            console.log( "Extras for Sleep as Android", diary );
            break;

        case "SleepChart1":
            console.log( "Extras for SleepChart 1.0", diary );
            break;

        case "SpreadsheetTable":
            console.log( "Extras for tables created in spreadsheets", diary );
            break;

        case "SpreadsheetGraph":
            console.log( "Extras for graphs created in spreadsheets", diary );
            break;

        case "ActivityLog":
            console.log( "Extras for activity logs", diary );
            break;

        }

    },
    (raw,source) => {
        console.error( "Failed to load", raw, source );
    }
);

document.getElementById("diary-input")
    .addEventListener( "change", event => diary_loader.load(event) );
```

See individual classes for the capabilities of each format.

## Node.JS Quick Start

Install dependencies:

```bash
npm install timezonecomplete @xmldom/xmldom
```

Use the package:

```javascript
const sleepdiary = require(".../sleepdiary-core.min.js");

...

let diary = sleepdiary.new_sleep_diary( my_diary );
```

## Browser support

This library is actively tested in modern versions of Firefox and Chrome.  We try to support all modern Chromium-based browsers, plus Internet Explorer 10 and 11.  Please report any bugs you find in supported browsers.

## Developing the project

Most people can use the pre-compiled [sleepdiary-core.min.js](../sleepdiary-core.min.js).  If you want to compile the project yourself, the recommended solution is to [install Docker](https://docs.docker.com/get-started/) and do:

    docker run --rm -it -v "/path/to/sleepdiary/core":/app sleepdiaryproject/builder # build and test
    docker run --rm -it -v "/path/to/sleepdiary/core":/app sleepdiaryproject/builder build # build but don't test
    docker run --rm -it -v "/path/to/sleepdiary/core":/app sleepdiaryproject/builder run # rebuild whenever files change
