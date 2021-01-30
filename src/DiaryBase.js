/*
 * Copyright 2020 Andrew Sayers <andrew-github.com@pileofstuff.org>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

/**
 * Functions for converting from the current type to some other type
 * @private
 */
const sleep_diary_converters = {};

/**
 * @typedef {{
 *   name        : string,
 *   constructor : Function,
 *   title       : string,
 *   url         : string
 * }} DiaryFormat
 */
let DiaryFormat;

/**
 * List of known formats for sleep diaries
 * @type Array<DiaryFormat>
 * @tutorial List supported formats
 * @public
 */
const sleep_diary_formats = [];

/**
 * @class Base class for sleep diary formats
 *
 * @unrestricted
 * @abstract
 */
class DiaryBase {

    /**
     * @param {string|Object} file - object containing the file
     * @param {Function=} serialiser - function to serialise output
     */
    constructor(file,serialiser) {
        if ( serialiser ) {
            /**
             * Serialise a value for output
             * @type {Function}
             */
            this.serialiser = serialiser;
        }
    }

    /*
     * Abstract functions
     */

    /**
     * Name of the current file format
     * @nocollapse
     * @public
     */
    static ["file_format"]() { return "DiaryBase" }

    /**
     * Merge another diary into this one
     *
     * @public
     *
     * @param {DiaryBase} other - diary to merge in
     *
     * @example
     *   diary.merge(my_data);
     */
    ["merge"](other) { return this; }

    /*
     * Functions that do not need to be overridden in descendent classes
     */

    /**
     * Create a deep copy of the current object
     */
    ["clone"]() {
        return new_sleep_diary(this["to"]("url"),this.serialiser);
    }

    /**
     * Convert a value to some other format
     *
     * <p>Supported formats:</p>
     *
     * <ul>
     *   <li><tt>output</tt> - contents serialised for output (e.g. to a file)</li>
     *   <li><tt>url</tt> - contents serialised for inclusion in a URL</li>
     *   <li><tt>json</tt> - contents serialised to JSON</li>
     *   <li><tt>Standard</tt> - Standard format</li>
     *   <li><em>(other formats)</em> - the name of any other diary format</li>
     * </ul>
     *
     * @public
     *
     * @param {string} to_format - requested format
     * @return {*} diary data in new format
     *
     * @example
     *   let reformatted_diary = diary.to("NewFormat");
     */
    ["to"](to_format) {

        switch ( to_format ) {

        case this["file_format"]():
            return this;

        case "url":
            return "sleep-diary=" + encodeURIComponent(JSON.stringify({
                "file_format": this["file_format"](),
                "contents"   : this,
            }));

        case "json":
            return JSON.stringify(this);

        default:
            if ( sleep_diary_converters.hasOwnProperty(to_format) ) {
                return new sleep_diary_converters[to_format](
                    this["to"]("Standard")
                );
            } else {
                throw Error( this["file_format"]() + " cannot be converted to " + to_format);
            }

        }

    }

    /**
     * Serialise data for output
     * @protected
     */
    serialise(data) {
        return this.serialiser ? this.serialiser(data) : data;
    }

    /*
     * Construction helpers
     */

    /**
     * Register a new format
     *
     * @public
     *
     * @param {DiaryFormat} format - sleep diary format
     *
     * @example
     *   DiaryBase.register(MyClass);
     */
    static register( format ) {
        sleep_diary_formats.push(format);
        if ( format["url"][0] == '/' ) {
            format["url"] = "https://andrew-sayers.github.io/sleep-diary-formats" + format["url"];
        }
        if ( format.name != "Standard" ) {
            sleep_diary_converters[format.name] = format.constructor;
        }

    };

    /**
     * Indicates the file is not valid in our file format
     * @param {string|Object} file - file contents, or filename/contents pairs (for archive files)
     * @protected
     */
    invalid(file) {
        throw null;
    }

    /**
     * Indicates the file is a corrupt file in the specified format
     * @param {string|Object} file - file contents, or filename/contents pairs (for archive files)
     * @param {string} message - optional error message
     * @protected
     */
    corrupt(file,message) {
        if ( message ) {
            throw new Error( `Does not appear to be a valid ${this["file_format"]()} file:\n${message}` );
        } else {
            throw new Error( `Does not appear to be a valid ${this["file_format"]()} file` );
        }
    }

    /*
     * Attempt to initialise an object from a URL string
     * @param {Object} file - file contents
     */
     initialise_from_url(file) {
         file = file["contents"];
         if ( this["file_format"]() == file["file_format"] ) {
             Object.keys(file["contents"]).forEach( key => this[key] = file["contents"][key] );
         } else {
             return this.invalid(file);
         }
    }


    /*
     * Utility functions
     */

    /**
     * Convert a string to a number with leading zeros
     *
     * @public
     *
     * @param {number} n - number to pad
     * @param {number=} [length=2] - length of the output string
     *
     * @example
     * DiaryBase.zero_pad( 1    ) // ->   "01"
     * DiaryBase.zero_pad( 1, 4 ) // -> "0001"
     */
    static ["zero_pad"]( n, length ) {
        let zeros = '';
        if ( n ) {
            for ( let m=Math.pow( 10, (length||2)-1 ); m>n; m/=10 ) zeros += '0';
        } else {
            for ( let m=1; m<(length||2); ++m ) zeros += '0';
        }
        return zeros + n;
    }

    /**
     * parse an XML string to a DOM
     *
     * @param {string} string - XML string to parse
     * @public
     *
     * @example
     *   let xml = DiaryBase.parse_xml("<foo>");
     */
    static ["parse_xml"]( string ) {

        let dom_parser;
        try {
            dom_parser = window.DOMParser;
            if ( !dom_parser ) throw "";
        } catch (e) {
            dom_parser = require("xmldom").DOMParser;
        }

        return new dom_parser().parseFromString(string, "application/xml");

    }

    /**
     * return values that exist in the second argument but not the first
     *
     * @param {Array} list1 - first list of values
     * @param {Array} list2 - second list of values
     * @param {function(*)} unique_id - function that returns the unique ID for a list item
     * @return {Array}
     * @public
     *
     * @example
     *   let filtered = DiaryBase.unique(["a","b"],["b","c"],l=>l);
     *   -> ["c"]
     */
    static ["unique"]( list1, list2, unique_id ) {
        let list1_ids = {};
        list1.forEach( l => list1_ids[unique_id(l)] = 1 );
        return list2.filter( l => !list1_ids.hasOwnProperty(unique_id(l)) )
    }

    /**
     * Escape a string for use in an XML (or HTML) file
     *
     * @param {string} string - unescaped string
     * @return {string}
     * @public
     *
     * @example
     *   let escaped = DiaryBase.escape("<foo>");
     *   -> "&#60;foo&#62;"
     */
    static ["escape_xml"]( string ) {
        return string.replace( /[&<>"']/g, c => `&#${c.charCodeAt(0)};` );
    }

    /**
     * Create a DateTime object with timezone support
     *
     * @param {number|string} date - the date to parse
     * @param {string=} timezone - timezone (e.g. "Europe/London")
     * @public
     *
     * @example
     *   let date = DiaryBase.date(123456789,"Etc/GMT");
     */
    static ["date"]( date, timezone ) {
        let tc;
        try {
            tc = window["tc"];
            if ( !tc ) throw "";
        } catch (e) {
            tc = require("timezonecomplete");
        }
        return new tc["DateTime"](date,timezone?tc["zone"](timezone):undefined);
    }

}

/**
 * Low-level reader interface
 *
 * @public
 *
 * @throws Will throw an error for unrecognised documents
 *
 * @param {string|Object} file - file contents, or filename/contents pairs (for archive files)
 * @param {Function=} serialiser - function to serialise output
 *
 * @return {Object|null} diary, or null if the document could not be parsed
 *
 * @example
 *   let diary = new_sleep_diary(contents_of_my_file));
 */
function new_sleep_diary(file,serialiser) {

    let error = new Error("This does not appear to be a sleep diary");

    let file_format = file["file_format"];

    if ( typeof(file) == "string" ) {

        file = { "file_format": () => "string", "contents": file };

    } else if ( file_format ) {

        file = Object.assign( {}, file );

        if ( file_format && typeof(file_format) == "string" ) {
            file["file_format"] = () => file_format;
        } else {
            file_format = file_format();
        }

        if ( file_format == "url" ) {
            file["contents"] = JSON.parse(decodeURIComponent(file["contents"].substr(12)));
        }

    }

    for ( let n=0; n!=sleep_diary_formats.length; ++n ) {
        try {
            return new sleep_diary_formats[n]["constructor"](file,serialiser);
        } catch (e) {
            if ( e ) { // SleepDiary.invalid() throws null to indicate the file is in the wrong format
                if ( ENABLE_DEBUG ) console.error(e);
                error = e;
            }
        }
    }

    throw error;

};

/**
 * High-level reader interface
 *
 * @public
 * @unrestricted
 *
 */
class DiaryLoader {

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
                        /(^|[?&])(sleep-diary=[^&]*)/g,
                        (_,diary) => self["load"]({
                            "file_format": "url",
                            "contents": diary
                        }, "hashchange" )
                    ),
                    false
                );
                location.hash.replace(
                    /(^#|[?&])(sleep-diary=[^&]*)/g,
                    (a,b,diary) => self["load"]({
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

        // Load other resources:
        try {
            [
                [
                    window["JSZip"],
                    "https://cdn.jsdelivr.net/npm/jszip-sync@3.2.1-sync/dist/jszip.min.js"
                ],
                [
                    window["tc"],
                    "https://cdn.jsdelivr.net/npm/tzdata@1.0.22/tzdata.js",
                    "https://cdn.jsdelivr.net/npm/timezonecomplete@5.11.2/dist/timezonecomplete.min.js"
                ],
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
     * Load a sleep diary from some source
     * @param {Event|FileList|string|Object} raw - raw data to load
     * @param {(Event|FileList|string|Object)=} source - identifier passed to the callbacks
     *
     * @example
     * my_file_input.addEventListener( "change", event => diary_loader.load(event) );
     */
    ["load"](raw,source) {

        if ( !source ) source = raw;

        if ( raw.target && raw.target.files ) raw = raw.target.files;

        if ( raw.length ) { // looks array-like (e.g. FileList)

            Array.from(raw).forEach( file => {

                let file_reader = new FileReader(),
                    zip = new window["JSZip"]()
                ;

                // extract the file contents:
                file_reader.onload = () => {

                    // try to unzip the contents:
                    zip["loadAsync"](file_reader.result)
                        .then(
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
                        )
                    ;

                };
                file_reader.readAsArrayBuffer(file);

            });

        } else {

            let diary;
            try {
                diary = window["new_sleep_diary"](
                    raw,
                    data => {
                        switch ( data["file_format"]() ) {
                        case "string":
                            return btoa(data["contents"]);
                        case "archive":
                            let zip = new window["JSZip"]();
                            return zip["sync"](() => {
                                Object.keys(data["contents"]).forEach(
                                    filename => zip["file"](filename,data["contents"][filename])
                                )
                                let ret;
                                zip["generateAsync"]({"type": "base64", "compression": "DEFLATE"})
                                    .then( data => ret = data )
                                ;
                                return ret;
                            });
                        default:
                            throw Error("Unsupported output format: " + data["file_format"]());
                        }
                    }
                );
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

};

/*
 * Export the class
 */
if ( typeof module !== "undefined" && module.exports ) {
    module.exports = {
        "new_sleep_diary": new_sleep_diary,
        "sleep_diary_formats": sleep_diary_formats,
        "DiaryLoader": DiaryLoader,
    };
} else {
    window["new_sleep_diary"    ] = new_sleep_diary;
    window["sleep_diary_formats"] = sleep_diary_formats;
    window["DiaryLoader"        ] = DiaryLoader;
}
