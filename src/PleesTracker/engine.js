/*
 * Copyright 2020-2021 Andrew Sayers <sleepdiary@pileofstuff.org>
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

        if ( !this.initialise_from_common_formats(file) ) {
            /**
             * Individual records from the sleep diary
             * @type {Array}
             */
            this["records"] = (
                file["to"]("Standard")["records"]
                    .filter( r => r["status"] == "asleep" )
                    .map( (r,n) => ({
                        "start"   : r["start"],
                        "stop"    : r["end"  ],
                        "sid"     : n+1,
                        "rating"  : 0,
                    }))
            );
        }

    }

    ["to"](to_format) {

        switch ( to_format ) {

        case "output":

            return this.serialise({
                "file_format": () => "string",
                "contents": (
                    // can't use output_csv() here, because PleesTracker requires numeric times
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
                        "status" : "asleep",
                        "start"  : r["start"],
                        "end"    : r["stop" ],
                    })
                ),
            }, this.serialiser);

        default:

            return super["to"](to_format);

        }

    }

    ["merge"](other) {

        other = other["to"](this["file_format"]());

        this["records"] = this["records"].concat(
            DiaryBase.unique(
                this["records"],
                other["records"],
                ["start","stop"]
            )
        );

        this["records"].forEach( (record,n) => record["sid"]=n+1 );

        return this;
    }

    ["file_format"]() { return "PleesTracker"; }
    ["format_info"]() {
        return {
            "name": "PleesTracker",
            "title": "Plees Tracker",
            "url": "/src/PleesTracker",
            "statuses": [ "asleep" ],
            "extension": ".csv",
        }
    }

}

DiaryBase.register(DiaryPleesTracker);
