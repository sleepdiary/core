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
 *        status: "awake", // or "asleep"
 *        // start and end time (in milliseconds past the Unix epoch):
 *        start: 12345678,
 *        end: 23456789,
 *      },
 *      ...
 *    ]
 *
 * console.log(diary.activities);
 * -> [
 *      {
 *        ActivityStart: 12345678
 *        ActivityEnd: 12345679
 *      },
 *      ...
 *    ]
 */
class DiaryActivityLog extends DiaryBase {

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
            activities = [],
            settings = []
            ;

        /**
         * Spreadsheet manager
         * @protected
         * @type {Spreadsheet}
         */
        this["spreadsheet"] = new Spreadsheet(
            this,
            [
                {
                    "sheet" : "Activities",
                    "member" : "activities",
                    "cells": [
                        {
                            "member": "ActivityStart",
                            "type": "time",
                        },
                        {
                            "member": "ActivityEnd",
                            "type": "time",
                        },
                    ],
                },
                {
                    "sheet" : "Settings",
                    "member" : "settings",
                    "cells": [
                        {
                            "member": "Setting",
                            "type": "text",
                        },
                        {
                            "member": "Value",
                            "type": "number",
                        },
                    ],
                },
            ]
        );

        if ( this.initialise_from_common_formats(file) ) {

            this.recalculate([]);

        } else {

            /**
             * Individual records from the sleep diary
             * @type {Array}
             */
            this["records"] = file["to"]("Standard")["records"]
                .filter( r => r["status"] == "awake" || r["status"] == "asleep" )
                .map( r => ({
                    "status": r["status"],
                    "start": r["start"],
                    "end": r["end"],
                }));

            /**
             * Activities that will be converted to records
             * @type {Array}
             */
            this["activities"] = this["records"].map( r => ({
                "ActivityStart": r["start"],
                "ActivityEnd"  : r["end"],
            }));

            this["settings"] = [
                {
                    "Setting": "maximum_day_length_ms",
                    "Value"  : 1000*60,
                }
            ];

        }

    }

    recalculate(other_activities) {

        let records = this["records"] = [],
            activities = [ {} ],
            maximum_day_length_ms = 1000*60*60*32,
            prev_start = NaN,
            prev_end = NaN,
            n = 1
        ;

        this["settings"].forEach( s => {
            if ( s["Setting"] == "maximum_day_length_ms" ) maximum_day_length_ms = s["Value"];
        });

        this["activities"]
            .concat(other_activities)
            .sort( (a,b) => a["ActivityStart"] - b["ActivityStart"] )
            .forEach( log => {
                if ( prev_end >= log["ActivityStart"] - 60000 ) { // less than one minute since the last event
                    activities[activities.length-1]["ActivityEnd"] = log["ActivityEnd"];
                } else {
                    activities.push({ "ActivityStart": log["ActivityStart"], "ActivityEnd": prev_end = log["ActivityEnd"] });
                }
            });

        this["activities"] = activities.slice(1);

        while ( n < activities.length ) {
            let prev_activity = activities[n],
                 wake_start = prev_activity["ActivityStart"],
                sleep_start = prev_activity["ActivityEnd"],
                sleep_duration = 0,
                m = ++n
            ;
            while ( m < activities.length ) {
                const next_activity = activities[m];
                const gap_duration = next_activity["ActivityStart"] - prev_activity["ActivityEnd"];
                if ( sleep_duration < gap_duration ) {
                    sleep_duration = gap_duration;
                    sleep_start = prev_activity["ActivityEnd"];
                    n = m;
                }
                if ( next_activity["ActivityEnd"] - wake_start > maximum_day_length_ms ) {
                    break;
                }
                prev_activity = next_activity;
                ++m;
            }
            if ( sleep_start - wake_start > 1000*60*60 ) {
                if ( wake_start - prev_start < maximum_day_length_ms ) {
                    records.push({ "start": prev_end+1, "end": wake_start-1, "status": "asleep" });
                }
                records.push({
                    "start": wake_start,
                    "end": ( m == activities.length ) ? activities[m-1]["ActivityEnd"] : sleep_start,
                    "status": "awake"
                });
                prev_start = wake_start;
                prev_end = sleep_start;
            }
            if ( m == activities.length ) {
                break;
            }
        }

    }

    ["to"](to_format) {

        switch ( to_format ) {

        case "output":

            return this.serialise({
                "file_format": () => "string",
                "contents": this["spreadsheet"].output_csv(),
            });

        case "Standard":

            return new DiaryStandard({ "records": this["records"] },this.serialiser);

        default:

            return super["to"](to_format);

        }

    }

    ["merge"](other) {
        other = other["to"](this["file_format"]());
        this.recalculate(other["activities"]);
        return this;
    }

    ["file_format"]() { return "ActivityLog"; }
    ["format_info"]() {
        return {
            "name": "ActivityLog",
            "title": "Activity Log",
            "url": "/src/ActivityLog",
            "statuses": [ "awake", "asleep" ],
            "extension": ".csv",
        }
    }

}

DiaryBase.register(DiaryActivityLog);
