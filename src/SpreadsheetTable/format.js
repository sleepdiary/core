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
 *
 * @example
 * let diary = new_sleep_diary(contents_of_my_file));
 *
 * console.log(diary.records);
 * -> [
 *      {
 *        // Field names are the same as the source, so for example
 *        // if your spreadsheet has a column "SleepStart" instead of "start",
 *        // the key below will also be "SleepStart" instead of "start".
 *        //
 *        // You may want to convert to Standard format instead of using this directly.
 *        "status": "asleep",
 *        "start" : 12345678,
 *        "end"   : 23456789,
 *      },
 *      ...
 *    ]
 *
 */
class DiarySpreadsheetTable extends DiaryBase {

    /**
     * @param {Object} file - file contents
     * @param {Function=} serialiser - function to serialise output
     */
    constructor(file,serialiser) {

        super(file,serialiser);

        let rules = [];

        let member_map = {};

        const status_matches = DiaryBase["status_matches"]();

        const status_rule = member => ({
            "type": "text",
            "member": "status",
            "regexp": new RegExp(
                status_matches
                    .map( m => `(${m[1]})` )
                    .join('|'),
                'i'
            ),
            "export": (array_element,row,offset) => (
                row[offset] = Spreadsheet["create_cell"](array_element[member])
            ),
            "import": (array_element,row,offset) => (
                status_matches.some(
                    m => (
                        ( row[offset]["value"].toString().search(new RegExp(m[1],'i')) != -1 ) &&
                        ( array_element[member] = m[0] )
                    )
                )
            ),
        });

        const missing_status_rule = {
            "members": [],
            "export": (array_element,row,offset) => true,
            "import": (array_element,row,offset) => array_element["status"] = "asleep",
        };

        let comment_columns = [];

        function multiple_comment_rule(member) {
            return {
                "export": (array_element,row,offset) => {
                    array_element[member].forEach(
                        comment => row[offset++] = Spreadsheet["create_cell"]( comment )
                    );
                    return true;
                },
                "import": (array_element,row,offset) => {
                    let value = array_element[member] = (
                        comment_columns.map( () => ( row[offset++] || {} )["value"] )
                    );
                    while ( value.length && !value[value.length-1] ) value.pop();
                    return true;
                }
            };
        }

        if ( file["file_format"]() == "url" && file["contents"]["file_format"] == "SpreadsheetTable" ) {
            // initialise from URL

            member_map = file["contents"]["contents"]["member_map"];
            Object.keys(member_map).forEach( key => {
                const value = member_map[key];
                switch ( key ) {
                case "start":
                case "end":
                    rules[value[1]] = { "member": value[0], "type": "time" };
                    break;
                case "status":
                    rules[value[1]] = Object.assign( { "members": [ value[0] ] }, status_rule(value[0]) );
                    break;
                case "comments":
                    comment_columns = value[2];
                    if ( comment_columns.length == 1 ) {
                        rules[value[1]] = { "member": value[0], "type": "text" };
                    } else {
                        rules.push(Object.assign(
                            { "members": comment_columns },
                            multiple_comment_rule(value[0]),
                        ));
                    }
                    break;
                default:
                    return this.invalid(file);
                }
            });

            if ( !member_map["status"] ) rules.push(missing_status_rule)

        } else if ( file["file_format"]() == "Standard" ) {

            member_map = {
                "start"   : [ "start"   , 0 ],
                "end"     : [ "end"     , 1 ],
                "status"  : [ "status"  , 2 ],
                "comments": [ "comments", 3 ],
            };

            rules = [
                { "member": "start", "type": "time" },
                { "member": "end"  , "type": "time" },
                status_rule("status"),
                {
                    "members": ["comments"],
                    "export": (array_element,row,offset) => row[offset] = Spreadsheet["create_cell"](
                        (array_element["comments"]||[]).join("; ")
                    ),
                    "import": (array_element,row,offset) => {
                        if ( row[offset]["value"] ) {
                            array_element["comments"] = row[offset]["value"].split(/ *; */);
                        }
                        return true;
                    },
                },
            ];

        } else if ( file["sheets"] && file["sheets"][0] && file["sheets"][0]["cells"][0] ) {
            // initialise from spreadsheet

            const unrecognised_columns = (
                file["sheets"][0]["cells"][0]

                    // store the cell offset so it isn't changed by filtering:
                    .map( (cell,n) => [cell,n] )

                    // match cells based on regular expressions:
                    .filter( cell_n => {

                        let value = cell_n[0]["value"];
                        if ( typeof(value) != "string" ) value = '';


                        if (
                            // handle the time columns:
                            [
                                [ "end"  , /w.ke|stop|end/i     ],
                                [ "start", /sleep|start|begin/i ],
                            ].some( column_match => {
                                if ( value.search(column_match[1]) == -1 ) return false;
                                if ( !member_map.hasOwnProperty(column_match[0]) ) {
                                    member_map[column_match[0]] = [ value, cell_n[1] ];
                                    rules[cell_n[1]] = { "member": value, "type": "time" };
                                }
                                return true;
                            })
                        ) {

                            // (nothing to do)

                        } else if ( value.search(/event|activity|stat(e|us)/i) != -1 ) {
                            // handle the status column:

                            if ( !member_map.hasOwnProperty("status") ) {
                                member_map["status"] = [ value, cell_n[1] ];
                                rules[cell_n[1]] = Object.assign( { "members": [ value ] }, status_rule(value) );
                            }

                        // handle comment columns:
                        } else if ( !value || value.search(/comment|note/i) != -1 ) {

                            comment_columns.push(cell_n);

                        } else {

                            return true;

                        }

                        return false;

                    })

                    // match remaining cells in order
                    .filter( cell_n => {

                        const value = cell_n[0]["value"];

                        if ( !member_map.hasOwnProperty("start") ) {
                            member_map["start"] = [ value, cell_n[1] ];
                            rules[cell_n[1]] = { "member": value, "type": "time" };
                        } else if ( !member_map.hasOwnProperty("end") ) {
                            member_map["end"] = [ value, cell_n[1] ];
                            rules[cell_n[1]] = { "member": value, "type": "time" };
                        } else {
                            return true;
                        }

                        return false;

                    })

            );

            if (
                unrecognised_columns.length
                || !member_map.hasOwnProperty("start")
                || !member_map.hasOwnProperty("end")
            ) {
                return this.invalid(file);
            }

            // detect gaps in the array:
            //if ( rules.some( c => !c ) ) return this.invalid(file); // NO! - some() skips gaps
            for ( let n=0; n!=rules.length; ++n ) {
                if ( !rules[n] ) return this.invalid(file);
            }

            // add comments:
            if ( comment_columns.length ) {

                member_map["comments"] = [
                    comment_columns[0][0]["value"],
                    comment_columns[0][1],
                    comment_columns.map( c => c[0]["value"] )
                ];

                if ( comment_columns.length == 1 ) {
                    rules[comment_columns[0][1]] = { "member": comment_columns[0][0]["value"], "type": "text" };
                } else {
                    // ensure comment columns begin right after the other columns:
                    if ( comment_columns[0][1] != rules.length ) return this.invalid(file);
                    // ensure comment columns are all adjacent:
                    for ( let n=1; n<comment_columns.length; ++n ) {
                        if ( comment_columns[n][1] != comment_columns[n-1][1]+1 ) return this.invalid(file);
                    }
                    rules.push(Object.assign(
                        { "members": comment_columns.map( c => c[0]["value"] ), },
                        multiple_comment_rule(comment_columns[0][0]["value"]),
                    ));
                }

            }

            // handle missing status:
            if ( !member_map.hasOwnProperty("status") ) {
                rules.push(missing_status_rule);
            }

        } else {

            return this.invalid(file);

        }

        /**
         * Member map
         * @private
         * @type {Object}
         */
        this["member_map"] = member_map;

        /**
         * Spreadsheet manager
         * @protected
         * @type {Spreadsheet}
         */
        this["spreadsheet"] = new Spreadsheet(
            this,
            [
                {
                    "sheet" : "Records",
                    "member" : "records",
                    "cells": rules
                }
            ]
        );

        if ( !this.initialise_from_common_formats(file) ) {

            const member_map = this["member_map"];

            let records = file["to"]("Standard")["records"];

            if ( !member_map.hasOwnProperty("status") ) {
                records = records.filter( r => r["status"] == "asleep" );
            }

            // remove timestamps from comments:
            if ( member_map.hasOwnProperty("comments") ) {
                records = records.map(
                    rec => {
                        if ( rec["comments"] ) {
                            rec = Object.assign( {}, rec );
                            rec["comments"] = rec["comments"].map(
                                comment => ( typeof(comment) == "string" ) ? comment : comment["text"]
                            );
                            if ( comment_columns.length == 1 ) {
                                rec["comments"] = rec["comments"][0];
                            }
                        }
                        return rec;
                    }
                );
            }

            /**
             * Individual records from the sleep diary
             * @type {Array}
             */
            this["records"] = records.map( (r,n) => {
                let ret = {};
                Object.keys(member_map).forEach( key => ret[member_map[key][0]] = r[key] );
                return ret;
            });

        }

    }

    ["to"](to_format) {

        switch ( to_format ) {

        case "output":

            let columns = [];
            let members = [];
            Object.values(this["member_map"]).forEach( member => {
                members[member[1]] = member[0];
                if ( member[2] ) {
                    columns = columns.concat(member[2])
                } else {
                    columns[member[1]] = member[0];
                }
            });

            return this.serialise({
                "file_format": () => "string",
                "contents": (
                    columns.join() + "\n" +
                        this["records"]
                        .map( r => {
                            let ret = [];
                            members.forEach( c => {
                                const value = r[c];
                                if ( Array.isArray(value) ) {
                                    ret = ret.concat(value.map(Spreadsheet["escape_csv_component"]));
                                } else {
                                    ret.push(Spreadsheet["escape_csv_component"](value));
                                }
                            });
                            return ret.join() + "\n";
                        }).join("")
                ),
            });

        case "Standard":

            const member_map = this["member_map"];

            return new DiaryStandard({
                "records": this["records"].map(
                    r => ({
                        "status"  : r[( member_map["status"  ] || ["status"  ] )[0]],
                        "start"   : r[( member_map["start"   ] || ["start"   ] )[0]],
                        "end"     : r[( member_map["end"     ] || ["end"     ] )[0]],
                        "comments": r[( member_map["comments"] || ["comments"] )[0]]||[],
                    })
                ),
            }, this.serialiser);

        default:

            return super["to"](to_format);

        }

    }

    ["merge"](other) {

        other = other["to"]("Standard");

        const member_map = this["member_map"];

        function create_id(record) {
            return (
                [ "status", "start", "end", ]
                    .map( member => record[( member_map[member] || [member] )[0]] )
                    .join()
            );
        }

        let existing_values = {};
        this["records"].forEach(
            r => existing_values[create_id(r)] = 1
        );

        this["records"] = this["records"].concat(
            other["records"]
                .map( r => {
                    const ret = {};
                    Object.keys(member_map).forEach( key => {
                        if ( r.hasOwnProperty(key) ) {
                            ret[member_map[key][0]] = r[key];
                        }
                    });
                    return ret;
                })
                .filter( r => !existing_values.hasOwnProperty(create_id(r)) )
        );

        return this;

    }

    ["file_format"]() { return "SpreadsheetTable"; }
    ["format_info"]() {
        return {
            "name": "SpreadsheetTable",
            "title": "Spreadsheet Table",
            "url": "/src/SpreadsheetTable",
            "extension": ".xlsx",
        }
    }

}

DiaryBase.register(DiarySpreadsheetTable);
