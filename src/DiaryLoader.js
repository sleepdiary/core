/**
 * High-level reader interface
 *
 * @public
 * @unrestricted
 *
 */
class DiaryLoader {

    static load_resources() {
        try {
            [
                [
                    window["JSZip"],
                    "https://cdn.jsdelivr.net/npm/jszip@3.6.x/dist/jszip.min.js"
                ],
                [
                    window["tc"],
                    "https://cdn.jsdelivr.net/npm/tzdata@1.0.x/tzdata.js",
                    "https://cdn.jsdelivr.net/npm/timezonecomplete@5.12.x/dist/timezonecomplete.min.js"
                ],
                [
                    window["ExcelJS"],
                    "https://cdn.jsdelivr.net/npm/exceljs@4.2.x/dist/exceljs.min.js"
                ]
            ].forEach( resource => {
                if ( !resource[0] ) {
                    resource.slice(1).forEach( url => {
                        let script = document.createElement("script");
                        script.src = url;
                        document.head.appendChild(script);
                    });
                }
            });
        } catch (e) {}
    }

    /**
     * @param {Function=} success_callback - called when a new file is loaded successfully
     * @param {Function=} error_callback - called when a file cannot be loaded
     *
     * @example
     * function my_success_callback( diary, source ) {
     *   console.log( "Loaded diary", diary, source );
     * }
     * function my_error_callback( raw, source ) {
     *   console.log( "Could not load diary", raw, source );
     * }
     * let loader = new DiaryLoader(my_success_callback,my_error_callback);
     */
    constructor( success_callback, error_callback ) {

        this["success_callback"] = success_callback || ( () => {} );
        this["error_callback"] = error_callback || ( () => {} );

        let load_interval, self = this;

        function initialise() {
            if ( window["tc"] ) {
                window.addEventListener('hashchange', () =>
                    location.hash.replace(
                        /(?:^#|[?&])(sleep-diary=[^&]*)/g,
                        (_,diary) => self["load"]({
                            "file_format": "url",
                            "contents": diary
                        }, "hashchange" )
                    ),
                    false
                );
                location.hash.replace(
                    /(?:^#|[?&])(sleep-diary=[^&]*)/g,
                    (_,diary) => self["load"]({
                        "file_format": "url",
                        "contents": diary
                    }, "hash" )
                );
                clearInterval(load_interval);
            }
        }

        load_interval = setInterval( initialise, 100 );

        /*
         * TODO: localStorage
         * 1. decide which localStorage key(s) to examine
         * 2. decide how they will be encoded - URL encoded?  Base 64?
         * 3. do something like:
        const localStorage_key = "...";
        function process_localStorage(item) {
            process_diary(decode(item),...);
        }
        function check_storage_change(changes, area) {
            if ( area == "local" &&
                 changes.hasOwnProperty(localStorage_key) &&
                 changes[localStorage_key].hasOwnProperty("newValue")
               ) {
                process_localStorage(changes[localStorage_key].newValue);
            }
        }
        browser.storage.onChanged.addListener(check_storage_change);
        if ( localStorage.hasItem(localStorage_key) ) {
            process_localStorage(localStorage.getItem(localStorage_key));
        }
        */

        DiaryLoader.load_resources();

    }

    /**
     * Load a sleep diary from some source
     * @param {Event|FileList|string|Object} raw - raw data to load
     * @param {(Event|FileList|string|Object)=} source - identifier passed to the callbacks
     *
     * @example
     * my_file_input.addEventListener( "change", event => diary_loader.load(event) );
     */
    ["load"](raw,source) {

        const jszip = window["JSZip"];

        // wait for JSZip to load:
        if ( !jszip ) {
            return setTimeout( () => this["load"](raw,source), 100 );
        }

        if ( typeof(raw) == "string" && !raw.search(/^(blob|data):/) ) {
            let xhr = new XMLHttpRequest;
            xhr.responseType = 'blob';
            xhr.onload = () => this["load"]([xhr.response],source);
            xhr.open('GET', raw);
            return xhr.send();
        }

        if ( !source ) source = raw;

        if ( raw.target && raw.target.files ) raw = raw.target.files;

        if ( raw.length ) { // looks array-like (e.g. FileList)

            Array.from(raw).forEach( file => {

                let file_reader = new FileReader(),
                    zip = new jszip()
                ;

                // extract the file contents:
                file_reader.onload =
                    () => Spreadsheet["buffer_to_spreadsheet"](file_reader.result).then(

                        spreadsheet => this["load"]( spreadsheet, source ),

                        () => zip["loadAsync"](file_reader.result).then(

                            zip => {
                                // convert the zip file to an object containing file names and contents:
                                let files = {},
                                    keys = Object.keys(zip["files"]),
                                    next_key = () => {
                                        if ( keys.length ) {
                                            zip["file"](keys[0])["async"]("string").then(
                                                content => {
                                                    files[keys[0]] = content;
                                                    keys.shift();
                                                    next_key();
                                                });
                                        } else {
                                            this["load"](
                                                {
                                                    "file_format": "archive",
                                                    "contents": files,
                                                },
                                                source
                                            );
                                        }
                                    };
                                next_key();
                            },

                            () => {
                                const real_error_callback = this["error_callback"];
                                try {
                                    this["error_callback"] = () => {};
                                    this["load"](
                                        {
                                            "file_format": "array",
                                            "contents"   : file_reader.result,
                                        },
                                        source
                                    );
                                    this["error_callback"] = real_error_callback;
                                } catch (e) {
                                    this["error_callback"] = real_error_callback;
                                    // not a zip file - try processing it as plain text:
                                    file_reader.onload = () => this["load"](
                                        {
                                            "file_format": "string",
                                            "contents"   : file_reader.result,
                                        },
                                        source
                                    );
                                    file_reader.readAsText(file);
                                }
                            }

                        )
                    );

                file_reader.readAsArrayBuffer(file);

            });

        } else {

            let diary;
            try {
                diary = window["new_sleep_diary"]( raw, DiaryLoader["serialiser"] );
            } catch (e) {
                this[  "error_callback"]( raw  , source );
                throw e;
            }
            if ( diary ) {
                this["success_callback"]( diary, source );
            } else {
                this[  "error_callback"]( raw  , source );
            }

        }

    }

    static ["serialiser"](data) {
        switch ( data["file_format"]() ) {
        case "array":
            return data["contents"];
        case "string":
            return btoa(unescape(encodeURIComponent(data["contents"])));
        case "archive":
            const callback = (resolve,reject) => {
                const jszip = window["JSZip"];
                if ( !jszip ) {
                    return setTimeout( () => callback(resolve,reject), 100 );
                }
                let zip = new jszip();
                Object.keys(data["contents"]).forEach(
                    filename => zip["file"](filename,data["contents"][filename])
                );
                return zip["generateAsync"]({"type": "base64", "compression": "DEFLATE"}).then(resolve,reject);
            }
            DiaryLoader.load_resources();
            return new Promise(callback);
        default:
            throw Error("Unsupported output format: " + data["file_format"]());
        }
    }

    static ["to_url"](serialised) {
        if ( typeof(serialised) == "string" ) {
            return 'data:application/octet-stream;base64,'+serialised;
        } else {
            if ( serialised["file_format"] && serialised["contents"] ) {
                if ( serialised["file_format"]() == "archive" ) {
                    serialised = JSON.stringify(serialised);
                } else {
                    serialised = serialised["contents"];
                }
            }
            return URL.createObjectURL(new Blob([serialised]));
        }
    }

};
