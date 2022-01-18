/*
 * Copyright 2020-2022 Sleepdiary Developers <sleepdiary@pileofstuff.org>
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
 *        "start"               : 12345678,
 *        "end"                 : 23456789,
 *        "Start Time"          : "2010-10-10 8:09PM",
 *        "End Time"            : "2010-10-11 7:08AM",
 *        "Minutes Asleep"      : "500",
 *        "Minutes Awake"       : "50",
 *        "Number of Awakenings": "30",
 *        "Time in Bed"         : "500",
 *        "Minutes REM Sleep"   : "100",
 *        "Minutes Light Sleep" : "300",
 *        "Minutes Deep Sleep"  : "100",
 *      },
 *      ...
 *    ]
 *
 */
class DiaryFitbit extends DiaryBase {

    /**
     * @param {Object} file - file contents
     * @param {Function=} serialiser - function to serialise output
     */
    constructor(file,serialiser) {

        super(file,serialiser); // call the DiaryBase constructor

        /*
         * PROPERTIES
         */

        let records = [];

        /**
         * Spreadsheet manager
         * @protected
         * @type {Spreadsheet}
         */
        this["spreadsheet"] = new Spreadsheet(
            this,
            [
                // Define one object per sheet in the spreadsheet:
                {
                    "sheet" : "Records",
                    "member" : "records",
                    "cells": [
                        {
                            "member": "Start Time",
                            "type": "time",
                        },
                        {
                            "member": "End Time",
                            "type": "time",
                        },
                        {
                            "member": "Minutes Asleep",
                            "type": "number",
                        },
                        {
                            "member": "Minutes Awake",
                            "type": "number",
                        },
                        {
                            "member": "Number of Awakenings",
                            "type": "number",
                        },
                        {
                            "member": "Time in Bed",
                            "type": "number",
                        },
                        {
                            "member": "Minutes REM Sleep",
                            "type": "number",
                        },
                        {
                            "member": "Minutes Light Sleep",
                            "type": "number",
                        },
                        {
                            "member": "Minutes Deep Sleep",
                            "type": "number",
                        },
                        {
                            "members": [],
                            "export": (array_element,row,offset) => true,
                            "import": (array_element,row,offset) => {
                                array_element["end"] = array_element["End Time"];
                                array_element["start"] = array_element["Start Time"];
                                return true;
                            },
                        },
                    ],
                },
            ]
        );

        /*
         * We use a regex-based parser here instead of the general CSV parser.
         * The file begins with a magic number "Sleep\n", which is not currently
         * handled by the general parser.  The rest of the format is simple
         * enough not to bother adding complexity elsewhere.
         */

        const fitbit_header
              = "Sleep\n"
              + "Start Time,End Time,Minutes Asleep,Minutes Awake,Number of Awakenings,Time in Bed,Minutes REM Sleep,Minutes Light Sleep,Minutes Deep Sleep\n"
        ;

        const fitbit_footer = "\n";

        const fitbit_timestamp = '"(([0-9][0-9]*)-([0-9][0-9]*)-([0-9][0-9]*) ([0-9][0-9]*):([0-9][0-9]*)([AP])M)"';

        const fitbit_number = '"([0-9][0-9]*)"';

        const fitbit_line
              = fitbit_timestamp
              + ',' + fitbit_timestamp
              + ',' + fitbit_number // Minutes Asleep
              + ',' + fitbit_number // Minutes Awake
              + ',' + fitbit_number // Number of Awakenings
              + ',' + fitbit_number // Time in Bed
              + ',' + fitbit_number // Minutes REM Sleep
              + ',' + fitbit_number // Minutes Light Sleep
              + ',' + fitbit_number // Minutes Deep Sleep
              + "\n"
        ;

        const fitbit_file_re = new RegExp(
              '^'   + fitbit_header
            + '(?:' + fitbit_line   + ')*'
            +         fitbit_footer + '$'
        );

        function parse_timestamp( year, month, day, hour, minute, ap ) {
            year = parseInt(year,10);
            month = parseInt(month,10);
            day = parseInt(day,10);
            hour = parseInt(hour,10);
            if ( hour == 12 ) {
                if ( ap == 'A' ) hour = 0;
            } else if ( ap == 'P' ) {
                hour += 12;
            }
            minute = parseInt(minute,10);
            return new Date(year, month-1, day, hour, minute).getTime();
        }

        switch ( file["file_format"]() ) {

        case "string":

            const contents = file["contents"];
            if ( !fitbit_file_re.test(contents) ) {

                return this.invalid(file);

            } else {

                contents.replace(
                    new RegExp(fitbit_line,'g'),
                    (_,
                     start_time, start_year,start_month,start_day,start_hour,start_minute,start_ap,
                     end_time, end_year,end_month,end_day,end_hour,end_minute,end_ap,
                     minutes_asleep,minutes_awake,number_of_awakenings,time_in_bed,minutes_rem_sleep,minutes_light_sleep,minutes_deep_sleep
                    ) => {
                        let start = parse_timestamp(start_year, start_month, start_day, start_hour, start_minute, start_ap),
                            end   = parse_timestamp(  end_year,   end_month,   end_day,   end_hour,   end_minute,   end_ap),
                        record = {
                            "Start Time"          : start,
                            "End Time"            : end,
                            "Minutes Asleep"      : parseInt(minutes_asleep,10),
                            "Minutes Awake"       : parseInt(minutes_awake,10),
                            "Number of Awakenings": parseInt(number_of_awakenings,10),
                            "Time in Bed"         : parseInt(time_in_bed,10),
                            "Minutes REM Sleep"   : parseInt(minutes_rem_sleep,10),
                            "Minutes Light Sleep" : parseInt(minutes_light_sleep,10),
                            "Minutes Deep Sleep"  : parseInt(minutes_deep_sleep,10),
                            "end"                 : end,
                        };
                        record["start"] = end - ( record["Minutes Asleep"] + record["Minutes Awake"] ) * 60*1000;
                        records.push(record);
                    }
                );

                this["records"] = records;

            }
            break;

        default:

            if ( this.initialise_from_common_formats(file) ) return;

            /**
             * Individual records from the sleep diary
             * @type {Array}
             */
            this["records"] = (
                file["to"]("Standard")["records"]
                    .filter( r => r["status"] == "asleep" )
                    .map( (r,n) => ({
                        "start"               : r["start"],
                        "end"                 : r["end"  ],
                        "Start Time"          : r["start"],
                        "End Time"            : r["end"],
                        "Minutes Asleep"      : Math.round( ( r["end"] - r["start"] ) / (60*1000) ),
                        "Minutes Awake"       : 0,
                        "Number of Awakenings": 0,
                        "Time in Bed"         : 0,
                        "Minutes REM Sleep"   : 0,
                        "Minutes Light Sleep" : 0,
                        "Minutes Deep Sleep"  : 0,
                    }))
            );

            break;

        }

    }

    ["to"](to_format) {

        switch ( to_format ) {

        case "output":

            return this.serialise({
                "file_format": () => "string",
                "contents": [
                    "Sleep",
                    "Start Time,End Time,Minutes Asleep,Minutes Awake,Number of Awakenings,Time in Bed,Minutes REM Sleep,Minutes Light Sleep,Minutes Deep Sleep",
                ].concat(
                    this["records"].map(
                        r => [
                            "Start Time",
                            "End Time",
                        ].map(
                            date => {
                                date = new Date(r[date]);
                                const hours = date["getHours"]();
                                return (
                                    '"' +
                                    date["getFullYear"]() +
                                    '-' +
                                    DiaryBase.zero_pad( date["getMonth"]()+1 ) +
                                    '-' +
                                    DiaryBase.zero_pad( date["getDate" ] () ) +
                                    ' ' +
                                    ( ( hours % 12 ) || 12 ) +
                                    ':' +
                                    DiaryBase.zero_pad( date["getMinutes"]() ) +
                                    ( ( hours >= 12 ) ? 'PM' : 'AM' ) +
                                    '"'
                                );
                            }
                        ).concat([
                            "Minutes Asleep",
                            "Minutes Awake",
                            "Number of Awakenings",
                            "Time in Bed",
                            "Minutes REM Sleep",
                            "Minutes Light Sleep",
                            "Minutes Deep Sleep"
                        ].map(
                            key => '"' + r[key] + '"'
                        )).join(',')
                    ),
                    "\n" // Fitbit format includes a trailing newline
                ).join("\n")
            });

        case "Standard":

            return new DiaryStandard({
                "records": this["records"].map(
                    r => ({
                        "status"  : "asleep",
                        "start"   : r["start"],
                        "end"     : r["end"  ],
                        "duration": r["end"] - r["start"],
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
                ["start","end"]
            )
        )
        // Fitbit records are always in reverse chronological order:
            .sort( (a,b) => b["start"] - a["start"] )
        ;

        return this;

    }

    ["file_format"]() { return "Fitbit"; }
    ["format_info"]() {
        return {
            "name": "Fitbit",
            "title": "fitbit",
            "url": "/src/Fitbit",
            "statuses": [ "asleep" ],
            "extension": ".csv",
            "logo": "https://community.fitbit.com/html/assets/fitbit_logo_1200.png",
        }
    }

}

DiaryBase.register(DiaryFitbit);
