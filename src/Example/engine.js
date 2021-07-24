/*
 * Copyright 2020 Andrew Sayers <sleepdiary@pileofstuff.org>
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

/*
 * Steps to create your code:
 *
 * 1. Search and replace "Example" to "YourFormat" (camel case, no space)
 * 2. Fix everything in the format_info() function at the bottom
 * 2. Fill in all the other "TODO" blocks in this file
 * 3. Add unit tests in test.js
 * 4. Add documentation in README.md
 * 5. Add this directory to "FORMATS" in ../../Makefile
 *
 *
 * A note about code style:
 *
 * This file should be usable as a reference by people who write
 * their own parsers in other programming languages.
 *
 * Prefer language features that can be more easily understood - and
 * even reused - in other languages.  For example, almost all modern
 * languages have a regex module compatible with POSIX extended
 * regular expressions, but most languages add extra features with
 * syntax that's incompatible with each other.  So use simple regular
 * expressions wherever you can (because they can be copy/pasted into
 * other languages), but avoid complex regular expressions wherever
 * possible (because they might cause subtle bugs in other languages).
 *
 */

/**
 * @public
 * @unrestricted
 * @augments DiaryBase
 *
 * @example
 * let diary = new_sleep_diary(contents_of_my_file));
 *
 * console.log(diary.records);
 * -> [
 *      {
 *        TODO: add an example record
 *      },
 *      ...
 *    ]
 *
 * TODO: add snippets for other functions and properties,
 * so people can copy/paste them and get straight to work.
 *
 */
class DiaryExample extends DiaryBase {

    /**
     * @param {Object} file - file contents
     * @param {Function=} serialiser - function to serialise output
     */
    constructor(file,serialiser) {

        super(file,serialiser); // call the DiaryBase constructor

        /*
         * PROPERTIES
         */

        let records = [],
            // TODO: add any other variables
            ...
            ;

        /*
         * Coding style: public vs. private functionality
         *
         * This file is compiled with the Closure compiler, which
         * reduces file sizes by renaming functions and variables.
         * For example, `this.records` might be compiled to `this.a`
         *
         * You can tell Closure not to rename functions by using
         * string literals.  For exapmle, `this["records"]` would
         * be compiled to `this.records`
         *
         * You only need string literals for public things.
         * You can reduce file size by using dot notation
         * everywhere else.
         */

        /*
         * PARSERS
         *
         * Sleep diaries often encode complex data as strings.
         *
         */

        function parse_datetime(string) {
            let data = string.match(/(regular expression)/);
            return {
                "string"   : string,
                "year"     : parseInt(data[1],10),
                "month"    : parseInt(data[2],10),
                "day"      : parseInt(data[3],10),
                "hour"     : parseInt(data[4],10),
                "minute"   : parseInt(data[5],10),
                "offset"   : parseInt(data[6],10),
            };
        }

        // TODO: write "parse" functions for each complex type

        // your parser might be easier to read if you construct the record in a separate function:
        function insert_record(data) {

            records.push({

                /*
                 * Common fields across all formats
                 */

                /*
                 * records should contain normalised "start" and
                 * "end" timestamps, marking the earliest and
                 * latest points in the record.
                 */
                "start": new Date(data["start time"]).getTime(),
                "end"  : new Date(data["end time"]).getTime(),

                /*
                 * records should contain a "duration", indicating
                 * e.g.  the amount of time actually spent asleep:
                 */
                "duration": (
                    new Date(data["end time"]).getTime() -
                        new Date(data["start time"]).getTime() -
                        data["time spent not doing this activity"]
                ),

                /*
                 * Fields of interest to people who use this format
                 */

                "start time": parse_datetime(data["start time"]),
                "end time": parse_datetime(data["end time"]),
                "time spent not doing this activity": (
                    data["time spent not doing this activity"]
                ),

                // TODO: add your fields here
                ...

            });

        }

        /**
         * Spreadsheet manager
         * @protected
         * @type {Spreadsheet}
         */
        this["spreadsheet"] = new Spreadsheet(
            this,
            /*
             * TODO: define columns to convert your format to and from a spreadsheet
             * (e.g. a .xlsx document).  See ../Spreadsheet.js if your format needs
             * more flexibility for conversion.
             */
            [
                // Define one object per sheet in the spreadsheet:
                {
                    "sheet" : "Records", // User-friendly sheet name
                    "member" : "records", // sheet will be populated from this[member]
                    "cells": [
                        // list of columns in the spreadsheet - usually one per object:
                        {
                            "member": "start",
                            "type": "time",
                        },
                        {
                            "member": "end",
                            "type": "time",
                        },
                        {
                            "member": "duration",
                            "type": "duration",
                        },
                        {
                            "member": "status",
                            "type": "text",
                        },
                        {
                            "member": "rating",
                            "regexp": /^[0-5]$/,
                            "type": "number",
                        },
                        {
                            "member": "comment",
                            "type": "text",
                        },
                        // sometimes you need to define custom import/export functions:
                        {
                            "members": ["member1", "member2"],
                            "export": (array_element,row,offset) => {
                                // put data into the spreadsheet:
                                row[offset  ] = Spreadsheet.create_cell( new Date( array_element["member1"] ) );
                                row[offset+1] = Spreadsheet.create_cell(           array_element["member2"]   );
                                // indicates the export was successful:
                                return true;
                            },
                            "import": (array_element,row,offset) => {
                                // get data from the spreadsheet:
                                array_element["member1"] = row[offset  ]["value"].getTime();
                                array_element["member2"] = row[offset+1]["value"];
                            },
                        },
                    ],
                },
            ]
        );

        /*
         * CONSTRUCT FROM DIFFERENT FORMATS
         */

        switch ( file["file_format"]() ) {

        case "string":

            // TODO: construct from string (if this is a text format)
            //return this.invalid(file); // uncomment if this type can't be read from a string

            /*
             * This library detects file types by calling each constructor in turn.
             * The constructor should start by running a simple test to see
             * if this looks at all like our file format.  It's OK for this test
             * to accept files with subtle errors.
             */
            if ( does_not_look_like_our_file_format(file) ) {

                return this.invalid(file);

            } else {

                ...

                let parsed_records = parse_records(file["contents"]);
                for ( let n=0; n!=parsed_records.length; ++n ) {
                    if ( looks_like_a_corrput_file_in_our_format(parsed_records[n]) ) {
                        return this.corrupt(file,"optional explanation");
                    } else {
                        insert_record(parsed_records[n]);
                    }
                }

                ...

            }
            break;

        case "array":

            // TODO: construct from ArrayBuffer (if this is a binary format)
            //return this.invalid(file); // uncomment if this type can't be read from a string

            ...

            break;

        /*
          TODO: decide which (if any) of these you need:

        case "archive":
            // construct from zip file - only relevant if your format is usually saved in an archive
            break;

        case "spreadsheet":
            // construct from spreadsheet - usually handled by initialise_from_common_formats()

        case "url":
            // construct from URL-encoded string - usually handled by initialise_from_common_formats()

        case "OtherFormat":
            // construct from a specific other diary format
            break;

        */

        default:

            if ( this.initialise_from_common_formats(file) ) return;

            // TODO: construct from a diary in an unknown format

            // See ../Standard/README.md for details
            records =
                file["to"]("Standard")["records"]
                .filter( r => r["status"] == "asleep" )

            break;

        }

        /**
         * Individual records from the sleep diary
         * @type {Array}
         */
        this["records"] = records;

        // TODO: add any other properties

    }

    ["to"](to_format) {

        switch ( to_format ) {

        case "output":

            // TODO: convert to whatever format other programs would expect this file to be in

            return this.serialise({
                "file_format": () => "string", // or "archive"
                "contents": ... // serialised diary
            });

        case "Standard":

            return new DiaryStandard({
                "records": this["records"].map( record => {

                    let ret = {};

                    /*
                     * TODO: convert each record to the Standard format
                     *
                     * {
                     *   status  : "awake",  // one of the values in StandardDiaryRecordStatus
                     *   start   : 12345678, // Unix time in milliseconds when the record began
                     *   end     : 23456789, // Unix time in milliseconds before which the record ended
                     *   tags    : [ // optional
                     *     "tag 1",
                     *     "tag 2",
                     *     ...
                     *   ],
                     *   comments: [ // optional
                     *     "comment with no associated timestamp",
                     *     { time: 23456543, text: "timestamped comment" },
                     *     ...
                     *   ],
                     * }
                     *
                     * See the files in ../Standard for more information.
                     * Values other than the above can be calculated
                     * automatically by DiaryStandard()
                     */

                    return ret;

                })
            }, this.serialiser);

        case "OtherFormat":

            // optional: convert to another diary format
            return ...;

        default:

            return super["to"](to_format);

        }

    }

    ["merge"](other) {

        // TODO: modify this example for your format

        // you probably want to start by converting the other file to this format:
        other = other["to"](this["file_format"]());

        // then you need to deduplicate the records:
        function create_id(record) {
            // if your format contains unique IDs:
            return record["id"];
            // or you can construct an ID by concatenating a handful of values:
            return (
                [ "status", "start", "end", ... ]
                .map( member => record[member] )
                .join()
            );
        }

        this["records"] = this["records"].concat(
            DiaryBase.unique(
                this["records"],
                other["records"],
                ["Id"] // or record => record["something"].map( ... )
            )
        )
        //.sort( (a,b) => a["start"] - b["start"] ) // if your format expects records to be sorted
        ;

        return this;

    }

    ["file_format"]() { return "Example"; }
    ["format_info"]() {
        return {
            "name": "Example", // CamelCase name, used in code
            "title": "Example", // Title Case name, displayed to users
            "url": "/src/Example", // shown to users who want to know about this format
            //"statuses": [ "awake", "asleep" ], // if this format only supports a limited set of statuses
            "extension": ".exm", // TODO: replace this with the standard file extension for this file
        }
    }

}

DiaryBase.register(DiaryExample);
