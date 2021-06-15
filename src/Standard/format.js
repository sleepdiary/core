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
 * Valid record statuses
 * @enum {string}
 */
const DiaryStandardRecordStatus = {
    /** user is currently awake */
    awake : "awake" ,
    /** user is in bed but not asleep */
    in_bed: "in bed",
    /** user is asleep */
    asleep: "asleep",
    /** user is eating some food, but not a full meal */
    snack: "snack",
    /** user is eating a full meal */
    meal: "meal",
    /** user is consuming alcohol */
    alcohol: "alcohol",
    /** user is consuming chocolate */
    chocolate: "chocolate",
    /** user is consuming caffeine */
    caffeine: "caffeine",
    /** user is consuming a drink that doesn't fit into any other category */
    drink: "drink",
    /** user is taking a sleeping pill, tranqulisier, or other medication to aid sleep */
    "sleep aid": "sleep aid",
    /** user is exercising */
    exercise: "exercise",
    /** user is using the toilet */
    toilet: "toilet",
    /** user is experiencing noise that disturbs their sleep */
    noise: "noise",
    /** user's wake-up alarm is trying to wake them up */
    alarm: "alarm",
    /** user is currently getting into bed */
    "in bed": "in bed",
    /** user is currently getting out of bed */
    "out of bed": "out of bed",

};

/**
 * @typedef {{
 *   start               : number,
 *   end                 : number,
 *   status              : DiaryStandardRecordStatus,
 *   start_timezone      : (undefined|string),
 *   end_timezone        : (undefined|string),
 *   duration            : (undefined|number),
 *   tags                : (undefined|Array<string>),
 *   comments            : (undefined|Array<string|{time:number,text:string}>),
 *   day_number          : number,
 *   start_of_new_day    : boolean,
 *   is_primary_sleep    : boolean,
 *   missing_record_after: boolean
 * }} DiaryStandardRecord
 *
 * A single record in a diary (e.g. one sleep) - see README.md for details
 *
 */
let DiaryStandardRecord;

/**
 * @typedef {{
 *                 average           : number,
 *                 mean              : number,
 *   interquartile_mean              : number,
 *                 standard_deviation: number,
 *   interquartile_standard_deviation: number,
 *                 median            : number,
 *   interquartile_range             : number,
 *                 durations         : Array<number|undefined>,
 *   interquartile_durations         : Array<number|undefined>
 * }} DiaryStandardStatistics
 *
 * Information about records from a diary
 */
let DiaryStandardStatistics;

/**
 * @typedef {null|DiaryStandardStatistics} MaybeDiaryStandardStatistics
 */
let MaybeDiaryStandardStatistics;

/**
 * @public
 * @unrestricted
 * @augments DiaryBase
 *
 * @example
 * let diary = new_sleep_diary(contents_of_my_file));
 *
 * // print the minimum expected day duration in milliseconds:
 * console.log(diary.settings.minimum_day_duration);
 * -> 12345
 *
 * // print the maximum expected day duration in milliseconds:
 * console.log(diary.settings.maximum_day_duration);
 * -> 23456
 *
 * // Print the complete list of records
 * console.log(diary.records);
 * -> [
 *      {
 *        // DiaryStandardRecordStatus value, usually "awake" or "asleep"
 *        status: "awake",
 *
 *        // start and end time (in milliseconds past the Unix epoch), estimated if the user forgot to log some data:
 *        start: 12345678,
 *        end: 23456789,
 *        start_timezone: "Etc/GMT-1",
 *        end_timezone: "Europe/Paris",
 *
 *        duration: 11111111, // or missing if duration is unknown
 *
 *        // tags associated with this period:
 *        tags: [
 *          "tag 1",
 *          "tag 2",
 *          ...
 *        ],
 *
 *        // comments recorded during this period:
 *        comments: [
 *          "comment with no associated timestamp",
 *          { time: 23456543, text: "timestamped comment" },
 *          ...
 *        ],
 *
 *        // (estimated) day this record is assigned to:
 *        day_number: 1,
 *
 *        // true if the current day number is greater than the previous record's day number:
 *        start_of_new_day: true,
 *
 *        // whether this value is the primary sleep for the current day number:
 *        is_primary_sleep: false,
 *
 *        // this is set if it looks like the user forgot to log some data:
 *        missing_record_after: true
 *
 *      },
 *
 *      ...
 *
 *    ]
 *
 * // Print the user's current sleep/wake status:
 * console.log(diary.latest_sleep_status());
 * -> "awake"
 *
 * // Print the user's sleep statistics:
 * console.log( diary.summarise_records( record => record.status == "asleep" ) );
 * -> {
 *                    average           : 12345.678,
 *                    mean              : 12356.789,
 *      interquartile_mean              : 12345.678,
 *                    standard_deviation: 12.56,
 *      interquartile_standard_deviation: 12.45,
 *                    median            : 12345,
 *      interquartile_range             : 12,
 *                    durations         : [ undefined, 12345, undefined, ... ],
 *      interquartile_durations         : [ 10000, 10001 ... 19998, 19999 ],
 *    }
 *
 * // Print the user's day length statistics for the past 30 days:
 * let cutoff = new Date().getTime() - 1000*60*60*24*30;
 * console.log( diary.summarise_days( record => record.start > cutoff ) );
 * -> {
 *                    average           : 12345.678,
 *                    mean              : 12356.789,
 *      interquartile_mean              : 12345.678,
 *                    standard_deviation: 12.56,
 *      interquartile_standard_deviation: 12.45,
 *                    median            : 12345,
 *      interquartile_range             : 12,
 *                    durations         : [ undefined, 12345, undefined, ... ],
 *      interquartile_durations         : [ 10000, 10001 ... 19998, 19999 ],
 *    }
 *
 * // Print the user's daily schedule on a 24-hour clock:
 * console.log( diary.summarise_schedule();
 * -> {
 *      sleep: { // time (GMT) when the user falls asleep:
 *                      average           : 12345.678,
 *                      mean              : 12356.789,
 *        interquartile_mean              : 12345.678,
 *                      standard_deviation: 12.56,
 *        interquartile_standard_deviation: 12.45,
 *                      median            : 12345,
 *        interquartile_range             : 12,
 *                      durations         : [ undefined, 12345, undefined, ... ],
 *        interquartile_durations         : [ 10000, 10001 ... 19998, 19999 ],
 *      },
 *      wake: { // time (GMT) when the user wakes up:
 *                      average           : 12345.678,
 *                      mean              : 12356.789,
 *        interquartile_mean              : 12345.678,
 *                      standard_deviation: 12.56,
 *        interquartile_standard_deviation: 12.45,
 *                      median            : 12345,
 *        interquartile_range             : 12,
 *                      durations         : [ undefined, 12345, undefined, ... ],
 *        interquartile_durations         : [ 10000, 10001 ... 19998, 19999 ],
 *      },
 *    }
 *
 * // Print the user's daily schedule on a 24-hour clock for the past 30 days:
 * let cutoff = new Date().getTime() - 1000*60*60*24*30;
 * console.log( diary.summarise_schedule( record => record.start > cutoff ) );
 * -> {
 *      sleep: { // time (GMT) when the user falls asleep:
 *                      average           : 12345.678,
 *                      mean              : 12356.789,
 *        interquartile_mean              : 12345.678,
 *                      standard_deviation: 12.56,
 *        interquartile_standard_deviation: 12.45,
 *                      median            : 12345,
 *        interquartile_range             : 12,
 *                      durations         : [ undefined, 12345, undefined, ... ],
 *        interquartile_durations         : [ 10000, 10001 ... 19998, 19999 ],
 *      },
 *      wake: { // time (GMT) when the user wakes up:
 *                      average           : 12345.678,
 *                      mean              : 12356.789,
 *        interquartile_mean              : 12345.678,
 *                      standard_deviation: 12.56,
 *        interquartile_standard_deviation: 12.45,
 *                      median            : 12345,
 *        interquartile_range             : 12,
 *                      durations         : [ undefined, 12345, undefined, ... ],
 *        interquartile_durations         : [ 10000, 10001 ... 19998, 19999 ],
 *      },
 *    }
 */
class DiaryStandard extends DiaryBase {

    /**
     * @param {Object} file - file contents, or object containing records
     * @param {Array=} file.records - individual records from the sleep diary
     * @param {number=} file.minimum_day_duration - minimum expected day duration in milliseconds
     * @param {number=} file.maximum_day_duration - maximum expected day duration in milliseconds
     * @param {Function=} serialiser - function to serialise output
     */
    constructor(file,serialiser) {

        super(file,serialiser);

        if ( file["records"] && !file["file_format"] ) {
            file = {
                "file_format": () => "Standard",
                "contents"   : file,
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
                        "member": "status",
                        "regexp": new RegExp('^(' + Object.values(DiaryStandardRecordStatus).join('|') + ')$'),
                        "type"  : "string",
                    },
                    {
                        "member"  : "start",
                        "type"    : "time",
                        "optional": true,
                    },
                    {
                        "member"  : "end",
                        "type"    : "time",
                        "optional": true,
                    },
                    {
                        "member": "start_timezone",
                        "type"  : "string",
                        "optional": true,
                    },
                    {
                        "member": "end_timezone",
                        "type"  : "string",
                        "optional": true,
                    },
                    {
                        "member"  : "duration",
                        "type"    : "duration",
                        "optional": true,
                    },
                    {
                        "members": ["tags"],
                        "export": (array_element,row,offset) => row[offset] = Spreadsheet["create_cell"]( (array_element["tags"]||[]).join("; ") ),
                        "import": (array_element,row,offset) => {
                            if ( row[offset]["value"] ) {
                                const tags = row[offset]["value"].split(/ *; */);
                                array_element["tags"] = tags;
                            }
                            return true;
                        }
                    },
                    {
                        "members": ["comments"],
                        "export": (array_element,row,offset) => row[offset] = Spreadsheet["create_cell"](
                            (array_element["comments"]||[])
                                .map( c => c["time"] ? `TIME=${c["time"]} ${c["text"]}` : c )
                                .join("; ")
                        ),
                        "import": (array_element,row,offset) => {
                            if ( row[offset]["value"] ) {
                                const comments =
                                      row[offset]["value"]
                                      .split(/ *; */)
                                      .map( c => {
                                          var time;
                                          c = c.replace( /^TIME=([0-9]*) */, (_,t) => { time = parseInt(t,10); return '' });
                                          return time ? { "time": time, "text": c } : c;
                                      });
                                array_element["comments"] = comments;
                            }
                            return true;
                        },
                    },
                    {
                        "member": "day_number",
                        "type": "number",
                        "optional": true,
                    },
                    {
                        "member": "start_of_new_day",
                        "type": "boolean",
                        "optional": true,
                    },
                    {
                        "member": "is_primary_sleep",
                        "type": "boolean",
                        "optional": true,
                    },
                    {
                        "member": "missing_record_after",
                        "type": "boolean",
                        "optional": true,
                    },
                ]
            },

            {
                "sheet" : "Settings",
                "member" : "settings",
                "type" : "dictionary",
                "cells": [
                    {
                        "member": "minimum_day_duration",
                        "type"  : "duration",
                    },
                    {
                        "member": "maximum_day_duration",
                        "type"  : "duration",
                    },
                ],
            },

        ]);

        switch ( file["file_format"]() ) {

        case "string":
            try {
                file = {
                    "file_format": () => "Standard",
                    "contents": /** @type (Object|null) */ (JSON.parse(file["contents"])),
                }
            } catch (e) {
                return this.invalid(file);
            }
            if ( file["contents"]["file_format"] != "Standard" ) {
                return this.invalid(file);
            }
            // FALL THROUGH

        default:

            if ( this.initialise_from_common_formats(file) ) return;

            let contents = file["contents"];
            if (
                file["file_format"]() != "Standard" ||
                contents === null ||
                typeof(contents) != "object" ||
                !Array.isArray(contents["records"])
            ) {
                return this.invalid(file);
            }

            /**
             * Individual records from the sleep diary
             *
             * @type Array<DiaryStandardRecord>
             */
            this["records"] = contents["records"]
                .map( r => Object.assign({},r) )
                .sort( (a,b) => ( a["start"] - b["start"] ) || ( a["end"] - b["end"] ) )
            ;

            const settings = contents["settings"]||contents,
                  minimum_day_duration = settings["minimum_day_duration"] || 20*60*60*1000,
                  maximum_day_duration = settings["maximum_day_duration"] || minimum_day_duration*2
            ;

            this["settings"] = {

                /**
                 * Minimum expected length for a day
                 *
                 * <p>We calculate day numbers by looking for "asleep"
                 * records at least this far apart.</p>
                 *
                 * @type number
                 */
                "minimum_day_duration": minimum_day_duration,

                /**
                 * Maximum expected length for a day
                 *
                 * <p>We calculate skipped days by looking for "asleep"
                 * records at this far apart</p>
                 *
                 * @type number
                 */
                "maximum_day_duration": maximum_day_duration,

            };

            /*
             * Calculate extra information
             */
            let day_start = 0,
                day_number = 0,
                prev = {
                    "status": "",
                    "day_number": -1
                },
                day_sleeps = [],
                sleep_wake_record = prev
            ;

            this["records"]
                .forEach( r => {

                    ["start","end"].forEach( key => {
                        if ( r[key] == undefined ) delete r[key];
                    });
                    ["tags","comments"].forEach( key => {
                        if ( !(r[key]||[]).length ) delete r[key];
                    });

                    if ( !r.hasOwnProperty("duration") ) {
                        r["duration"] = r["end"] - r["start"];
                        if ( isNaN(r["duration"]) ) delete r["duration"];
                    }

                    if ( r.hasOwnProperty("start_of_new_day") ) {
                        if ( r["start_of_new_day"] ) {
                            day_start = r["start"];
                        }
                    } else {
                        r["start_of_new_day"] =
                            r["status"] == "asleep" &&
                            r["start"] > day_start + minimum_day_duration
                        ;
                    }

                    if ( r.hasOwnProperty("day_number") ) {
                        day_number = r["day_number"];
                    } else {
                        if ( r["start_of_new_day"] ) {
                            if ( r["start"] > day_start + maximum_day_duration ) {
                                // assume we skipped a day
                                day_number += 2;
                            } else {
                                day_number += 1;
                            }
                            day_start = r["start"];
                        }
                        r["day_number"] = day_number;
                    }

                    if (  r["status"] == "awake" || r["status"] == "asleep" ) {
                        if ( !sleep_wake_record.hasOwnProperty("missing_record_after") ) {
                            sleep_wake_record["missing_record_after"] = (
                                r["status"] == sleep_wake_record["status"]
                            );
                        }
                        sleep_wake_record = r;
                    }

                    if ( r["status"] == "asleep" ) {

                        if ( (day_sleeps[r["day_number"]]||{"duration":-Infinity})["duration"] < r["duration"] ) {
                            day_sleeps[r["day_number"]] = r;
                        }
                    }

                    if ( r.hasOwnProperty("comments") ) {
                        const comments = r["comments"];
                        if ( comments === undefined ) {
                            delete r["comments"];
                        } else if ( !Array.isArray(comments) ) {
                            r["comments"] = [ comments ];
                        }
                    }

                    prev = r;

                })
            ;

            day_sleeps.forEach( r => {
                if ( r && !r.hasOwnProperty("is_primary_sleep") ) r["is_primary_sleep"] = true;
            });

        }

    }

    ["to"](to_format) {

        switch ( to_format ) {

        case "output":
            let contents = Object.assign({"file_format":this["file_format"]()},this);
            delete contents["spreadsheet"];
            return this.serialise({
                "file_format": () => "string",
                "contents": JSON.stringify(contents),
            });

        default:
            return super["to"](to_format);

        }

    }

    ["merge"](other) {
        let records = {};
        [ this, other["to"](this["file_format"]()) ].forEach(
            f => f["records"].forEach(
                r => records[[ r["start"], r["end"], r["status"] ].join()] = r
            )
        );
        this["records"] = Object.values(records).sort( (a,b) => ( a["start"] - b["start"] ) || ( a["end"] - b["end"] ) );
        return this;
    }

    ["file_format"]() { return "Standard"; }
    ["format_info"]() {
        return {
            "name": "Standard",
            "title": "Standardised diary format",
            "url": "/src/Standard",
            "extension": ".json",
        }
    }

    /**
     * Internal function used by summarise_*
     * @private
     */
    static summarise(durations) {

        let defined_durations = durations.filter( r => r !== undefined ),
            total_durations   = defined_durations.length
        ;

        if ( !total_durations ) return null;

        let a_plus_b        = (a,b) => a+b,
            a_minus_b       = (a,b) => a-b,
            sum_of_squares  = (a,r) => a + Math.pow(r - mean, 2) ,

            sorted_durations  = defined_durations.sort(a_minus_b),
            interquartile_durations = sorted_durations.slice(
                Math.round( sorted_durations.length*0.25 ),
                Math.round( sorted_durations.length*0.75 ),
            ),

            mean,
                untrimmed_mean = defined_durations.reduce(a_plus_b) / (total_durations||1),
            interquartile_mean = interquartile_durations.reduce(a_plus_b) / (interquartile_durations.length||1),

            ret = {
                            "average": untrimmed_mean,
                               "mean": untrimmed_mean,
                 "interquartile_mean": interquartile_mean,

                             "median": sorted_durations[Math.floor(sorted_durations.length/2)],
                "interquartile_range": (
                    interquartile_durations[interquartile_durations.length-1] -
                    interquartile_durations[0]
                ),

                              "durations":               durations,
                "interquartile_durations": interquartile_durations,
        };

        // calculate standard deviations:
        mean = untrimmed_mean;
        ret["standard_deviation"] = Math.sqrt( defined_durations.reduce(sum_of_squares,0) / total_durations );
        mean = interquartile_mean;
        ret["interquartile_standard_deviation"] = Math.sqrt( interquartile_durations.reduce(sum_of_squares,0) / interquartile_durations.length );

        return ret;

    }

    /**
     * Summary statistics (based on individual records)
     *
     * <p>Because real-world data tends to be quite messy, and because
     * different users have different requirements, we provide several
     * summaries for the data:</p>
     *
     * <ul>
     *  <li><tt>average</tt> is the best guess at what the
     *      user would intuitively consider the average duration of a
     *      record.  The exact calculation is chosen from the list
     *      below, and may change in future.  It is currently the
     *      <tt>trimmed_mean</tt>.  If you don't have any specific
     *      requirements, you should use this and ignore the
     *      others.</li>
     *  <li><tt>mean</tt> and <tt>standard_deviation</tt> are
     *      traditional summary statistics for the duration, but are
     *      not recommended because real-world data tends to skew
     *      these values higher than one would expect.</li>
     *  <li><tt>interquartile_mean</tt> and <tt>interquartile_standard_deviation</tt>
     *      produce more robust values in cases like ours, because they
     *      ignore the highest and lowest few records.
     *  <li><tt>median</tt> and <tt>interquartile_range</tt> produce
     *      more robust results, but tend to be less representative when
     *      there are only a few outliers in the data.
     *  <li><tt>durations</tt> and <tt>interquartile_durations</tt>
     *      are the raw values the other statistics were created from.
     * </ul>
     *
     * @public
     *
     * @param {function(*)=} filter - only examine records that match this filter
     *
     * @return MaybeDiaryStandardStatistics
     *
     * @example
     * console.log( diary.summarise_records( record => record.status == "asleep" ) );
     * -> {
     *                    average           : 12345.678,
     *                    mean              : 12356.789,
     *      interquartile_mean              : 12345.678,
     *                    standard_deviation: 12.56,
     *      interquartile_standard_deviation: 12.45,
     *                    median            : 12345,
     *      interquartile_range             : 12,
     *                    durations         : [ undefined, 12345, undefined, ... ],
     *      interquartile_durations         : [ 10000, 10001 ... 19998, 19999 ],
     *    }
     *
     */
    ["summarise_records"](filter) {

        return DiaryStandard.summarise(
            ( filter ? this["records"].filter(filter) : this["records"] )
                .map( r => r["duration"] )
        );

    }

    /**
     * Summary statistics (based on records grouped by day_number)
     *
     * <p>Similar to {@link DiaryStandard#summarise_records}, but
     * groups records by day_number.</p>
     *
     * @public
     *
     * @see [summarise_records]{@link DiaryStandard#summarise_records}
     * @tutorial Graph your day lengths
     *
     * @param {function(*)=} filter - only examine records that match this filter
     *
     * @return MaybeDiaryStandardStatistics
     *
     * @example
     * console.log( diary.summarise_days( record => record.start > cutoff ) );
     * -> {
     *                    average           : 12345.678,
     *                    mean              : 12356.789,
     *      interquartile_mean              : 12345.678,
     *                    standard_deviation: 12.56,
     *      interquartile_standard_deviation: 12.45,
     *                    median            : 12345,
     *      interquartile_range             : 12,
     *                    durations         : [ undefined, 12345, undefined, ... ],
     *      interquartile_durations         : [ 10000, 10001 ... 19998, 19999 ],
     *    }
     */
    ["summarise_days"](filter) {

        // get the earliest start time for each day:
        let starts = [];
        ( filter ? this["records"].filter(filter) : this["records"] )
            .forEach( r => {
                if ( starts[r["day_number"]]||0 < r["start"] )
                    starts[r["day_number"]] = r["start"];
            });

        // remove leading undefined start times:
        while ( starts.length && !starts[0] ) {
            starts.shift();
        }

        // calculate day duration relative to previous day:
        let durations = [];
        for ( let n=1; n<starts.length; ++n ) {
            if ( starts[n] && starts[n-1] ) {
                durations[n-1] = starts[n] - starts[n-1];
            }
        }

        return DiaryStandard.summarise(durations);

    }

    /**
     * Summary statistics about daily events
     *
     * <p>Somewhat similar to {@link DiaryStandard#summarise_records}.</p>
     *
     * <p>Calculates the time of day when the user is likey to wake up
     * or go to sleep.</p>
     *
     * <p>Sleep/wake times are currently calculated based on the
     * beginning/end time for each day's primary sleep, although this
     * may change in future.</p>
     *
     * @public
     *
     * @see [summarise_records]{@link DiaryStandard#summarise_records}
     *
     * @param {function(*)=} filter - only examine records that match this filter
     * @param {number} [day_length=86400000] - times of day are calculated relative to this amount of time
     *
     * @return {{
     *   sleep : MaybeDiaryStandardStatistics,
     *   wake  : MaybeDiaryStandardStatistics
     * }}
     *
     * @example
     * console.log( diary.summarise_schedule();
     * -> {
     *      sleep: { // time (GMT) when the user falls asleep:
     *                      average           : 12345.678,
     *                      mean              : 12356.789,
     *        interquartile_mean              : 12345.678,
     *                      standard_deviation: 12.56,
     *        interquartile_standard_deviation: 12.45,
     *                      median            : 12345,
     *        interquartile_range             : 12,
     *                      durations         : [ undefined, 12345, undefined, ... ],
     *        interquartile_durations         : [ 10000, 10001 ... 19998, 19999 ],
     *      },
     *      wake: { // time (GMT) when the user wakes up:
     *                      average           : 12345.678,
     *                      mean              : 12356.789,
     *        interquartile_mean              : 12345.678,
     *                      standard_deviation: 12.56,
     *        interquartile_standard_deviation: 12.45,
     *                      median            : 12345,
     *        interquartile_range             : 12,
     *                      durations         : [ undefined, 12345, undefined, ... ],
     *        interquartile_durations         : [ 10000, 10001 ... 19998, 19999 ],
     *      },
     *    }
     */
    ["summarise_schedule"](filter,day_length) {

        /*
         * Note: this function needs to work around a weird issue.
         *
         * If a user went to sleep at 11:50pm one day and 00:10am the
         * next, a naive algorithm might calculate the user's mean
         * sleep time to be noon.  To avoid this problem, we calculate
         * values twice - once normally and once with all numbers
         * rotated by half the day length.  Then we use whichever
         * one has the lowest standard deviation.
         */

        const hours = 60*60*1000;

        day_length = day_length || 24*hours;

        const half_day_length = day_length/2;

        // get the earliest start time for each day:
        let sleep_early = [],
            sleep_late  = [],
            wake_early  = [],
            wake_late   = []
        ;
        ( filter ? this["records"].filter(filter) : this["records"] )
            .forEach( r => {
                if ( r["is_primary_sleep"] ) {
                    if ( r["start"] ) {
                        sleep_early.push( r["start"]                 %day_length);
                        sleep_late .push((r["start"]+half_day_length)%day_length);
                    }
                    if ( r["end"] ) {
                        wake_early .push( r["end"  ]                 %day_length);
                        wake_late  .push((r["end"  ]+half_day_length)%day_length);
                    }
                }
            });

        let sleep_stats_early = DiaryStandard.summarise(sleep_early),
            sleep_stats_late  = DiaryStandard.summarise(sleep_late ),
             wake_stats_early = DiaryStandard.summarise( wake_early),
             wake_stats_late  = DiaryStandard.summarise( wake_late )
        ;

        [
            [ sleep_stats_late, sleep_stats_early ],
            [  wake_stats_late,  wake_stats_early ],
        ].forEach( stats => {
            if ( stats[0] ) {
                [ "average", "mean", "interquartile_mean", "median" ].forEach(
                    key => stats[0][key] = ( stats[0][key] + half_day_length ) % day_length
                );
                [ "durations", "interquartile_durations" ].forEach(
                    key => stats[0][key] = stats[1][key]
                );
            }
        });

        return {
            "wake": (
                (wake_stats_early||{})["standard_deviation"] < (wake_stats_late||{})["standard_deviation"]
                ? wake_stats_early
                : wake_stats_late
            ),
            "sleep": (
                (sleep_stats_early||{})["standard_deviation"] < (sleep_stats_late||{})["standard_deviation"]
                ? sleep_stats_early
                : sleep_stats_late
            ),
        };

    }

    /**
     * Latest sleep/wake status
     *
     * @public
     *
     * @return {string} "awake", "asleep" or "" (for an empty diary)
     */
    ["latest_sleep_status"]() {

        for ( let n=this["records"].length-1; n>=0; --n ) {
            let status = this["records"][n].status;
            if ( status == "awake" || status == "asleep" ) return status;
        }
        return "";

    }

}

DiaryBase.register(DiaryStandard);
