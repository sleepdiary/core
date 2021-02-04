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
     * Functions that may or may not need to be overridden in descendent classes
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
     * <p>[to_async()]{@link DiaryBase#to_async} supports more formats
     * and should be used where possible.  You should only call this
     * function directly if you want to guarantee synchronous execution.</p>
     *
     * @public
     *
     * @param {string} to_format - requested format
     * @return {*} diary data in new format
     *
     * @example
     * console.log( diary.to("NewFormat") );
     */
    ["to"](to_format) {

        switch ( to_format ) {

        case this["file_format"]():
            return this;

        case "url":
            return "sleep-diary=" + encodeURIComponent(JSON.stringify(
                {
                    "file_format": this["file_format"](),
                    "contents"   : this,
                },
                (key,value) => ( key == "spreadsheet" ) ? undefined : value
            ));

        case "json":
            return JSON.stringify(
                this,
                (key,value) => ( key == "spreadsheet" ) ? undefined : value
            );

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
     * Convert a value to some other format
     *
     * <p>Supported formats:</p>
     *
     * <ul>
     *   <li><tt>spreadsheet</tt> - binary data that can be loaded by a spreadsheet program</li>
     *   <li><em>(formats supported by [to()]{@link DiaryBase#to})</em></li>
     * </ul>
     *
     * <p>See also [to()]{@link DiaryBase#to}, a lower-level function
     * that supports formats that can be generated synchronously.  You
     * can use that function if a Promise interface would be
     * cumbersome or unnecessary in a given piece of code.</p>
     *
     * @public
     *
     * @param {string} to_format - requested format
     * @return {Promise|Object} Promise that returns the converted diary
     *
     * @example
     *   diary.to_async("NewFormat").then( reformatted => console.log( reformatted_diary ) );
     */
    ["to_async"](to_format) {

        switch ( to_format ) {

        case "spreadsheet":
            if ( !this["spreadsheet"]["synchronise"]() ) {
                throw Error("Could not synchronise data");
            }
            return this["spreadsheet"]["serialise"]();

        default:
            const ret = this["to"](to_format);
            return ret["then"] ? ret : { "then": callback => callback(ret) };
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
     * Attempt to initialise an object from a spreadsheet
     * @param {Spreadsheet} file - file contents
     */
    initialise_from_spreadsheet(file) {
        if ( !this["spreadsheet"]["load"](file) ) {
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

        if ( typeof(file_format) == "string" ) {
            file["file_format"] = () => file_format;
        } else {
            file_format = file_format();
        }

        if ( file_format == "url" ) {
            file["contents"] = JSON.parse(decodeURIComponent(file["contents"].substr(12)));
        }

    } else {

        throw error;

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
