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
 *        "sid"   : 1,
 *        "start" : 12345678,
 *        "stop"  : 23456789,
 *        "rating": 5,
 *      },
 *      ...
 *    ]
 *
 */
class DiaryPleesTracker extends DiaryBase {

    /**
     * @param {Object} file - file contents
     * @param {Function=} serialiser - function to serialise output
     */
    constructor(file,serialiser) {

        super(file,serialiser); // call the SleepDiary constructor

        /*
         * PROPERTIES
         */

        var records = [];

        /*
         * PARSERS
         *
         * Sleep diaries often encode complex data as strings.
         *
         */

        const test = new RegExp( "^sid,start,stop,rating\n([1-9][0-9]*,[1-9][0-9]*,[1-9][0-9]*,[0-5]\n)*$" );

        // your parser might be easier to read if you construct the record in a separate function:
        function insert_record(data) {

            data = data.split(',').map( r => parseInt( r, 10 ) );

            return {
                "start"   : data[1],
                "stop"    : data[2],
                "sid"     : data[0],
                "rating"  : data[3],
            };

        }

        /**
         * Spreadsheet manager
         * @protected
         * @type {Spreadsheet}
         */
        this["spreadsheet"] = new Spreadsheet(this,[
            {
                "sheet" : "Records",
                "member" : "records",
                "cells": [
                    {
                        "member": "sid",
                        "regexp": /^[1-9][0-9]*$/,
                        "type": "number",
                    },
                    {
                        "member": "start",
                        "type": "time",
                    },
                    {
                        "member": "stop",
                        "type": "time",
                    },
                    {
                        "member": "rating",
                        "regexp": /^[0-5]$/,
                        "type": "number",
                    },
                ]
            }
        ]);

        /*
         * CONSTRUCT FROM DIFFERENT FORMATS
         */

        switch ( file["file_format"]() ) {

        case "url":
            // sleep diaries can be encoded as a JSON blob inside a URL parameter:
            return this.initialise_from_url(file);
        case "spreadsheet":
            return this.initialise_from_spreadsheet(file);

        case "string":

            if ( !test.test(file["contents"]) ) return this.invalid(file);

            records = (
                file["contents"]
                    .replace(/\n$/,'')
                    .split("\n")
                    .splice(1)
                    .map(insert_record)
            );

            break;

        case "archive":

            return this.invalid(file); // uncomment this if this type can't be read from an archive

        default:

            records =
                file["to"]("Standard")["records"]
                .filter( r => r["status"] == "asleep" )
                .map( (r,n) => ({
                    "start"   : r["start"],
                    "stop"    : r["end"  ],
                    "sid"     : n+1,
                    "rating"  : 0,
                }))
            ;

            break;

        }

        /**
         * Individual records from the sleep diary
         * @type {Array}
         */
        this["records"] = records;

    }

    ["to"](to_format) {

        switch ( to_format ) {

        case "output":

            return this.serialise({
                "file_format": "string",
                "contents": (
                    "sid,start,stop,rating\n" +
                        this["records"]
                        .map(
                            r => [
                                r["sid"   ],
                                r["start" ],
                                r["stop"  ],
                                r["rating"],
                            ].join(',') + "\n"
                        ).join("")
                ),
            });

        case "Standard":

            return new DiaryStandard({
                "records": this["records"].map(
                    r => ({
                        "status"  : "asleep",
                        "start"   : r["start"],
                        "end"     : r["stop" ],
                    })
                ),
            });

        default:

            return super["to"](to_format);

        }

    }

    ["merge"](other) {

        other = other["to"](this["file_format"]());

        let existing_ids = {};
        this["records"].forEach( record => existing_ids[record["start"] + ' ' + record["stop"]] = 1 );

        this["records"] = this["records"].concat(
            other["records"].filter( record => !existing_ids.hasOwnProperty(record["start"] + ' ' + record["stop"]) )
        );

        this["records"].forEach( (record,n) => record["sid"]=n+1 );

        return this;
    }

    ["file_format"]() { return "PleesTracker"; }

}

DiaryBase.register({
    "name": "PleesTracker",
    "constructor": DiaryPleesTracker,
    "title": "Plees Tracker",
    "url": "/src/PleesTracker",
});
