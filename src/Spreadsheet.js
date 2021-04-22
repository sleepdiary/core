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
 * @typedef {{
 *   member: string,
 *   type: (string|undefined),
 *   regexp: (RegExp|undefined)
 * }} SpreadsheetHighLevelCellRule
 *
 * <p>Define a high-level rule for serialising/parsing a spreadsheet cell.</p>
 *
 * <p><tt>key</tt> should be the name of a member of the relevant data
 * structure, <tt>type</tt> should be <tt>number</tt>, <tt>time</tt>,
 * <tt>duration</tt> or <tt>string</tt> (the default).  If
 * <tt>regexp</tt> is passed, the value is expected to match that
 * pattern.</p>
 */
let SpreadsheetHighLevelCellRule;

/**
 * @typedef {{
 *   members: Array<string>,
 *   import: Function,
 *   export: Function
 * }} SpreadsheetLowLevelCellRule
 *
 * <p>Define a low-level rule for serialising/parsing a series of cells.</p>
 *
 * <p><tt>keys</tt> should be a non-empty array of member names that
 * will be created.  <tt>import</tt> and <tt>export</tt> are functions
 * that take three arguments (<tt>array_element</tt>, <tt>row</tt> and
 * <tt>offset</tt>) and return a value that indicates whether the
 * operation was a success.  <tt>import</tt> is expected to copy
 * values from <tt>row</tt> to <tt>array_element</tt>, wheraes
 * <tt>export</tt> copies data back to <tt>row</tt>.
 *
 */
let SpreadsheetLowLevelCellRule;

/**
 * @typedef {{
 *   sheet: string,
 *   member: (string|undefined),
 *   cells: Array<SpreadsheetHighLevelCellRule|SpreadsheetLowLevelCellRule>
 * }} SpreadsheetSheetRule
 *
 * <p>Define the conversion to/from a single sheet in the spreadsheet.</p>
 *
 * <p><tt>sheet</tt> should be the name of the sheet in the spreadsheet.
 * <tt>member</tt> should be the name of the associated member in the data
 * structure (if different from <tt>sheet</tt>).</p>
 */
let SpreadsheetSheetRule;

/**
 * @typedef Array<SpreadsheetSheetRule> SpreadsheetRules
 *
 * <p>Define the conversion to/from a spreadsheet.</p>
 *
 */
let SpreadsheetRules;

const SpreadsheetNumberFormats = {
    "number"  : "General",
    "time"    : "YYYY-MM-DD\" \"HH:MM",
    "duration":  "[h]:mm",
};



/**
 * @class Interface to spreadsheet libraries
 *
 * <p>At the time of writing, this library uses ExcelJS to handle
 * spreadsheets.  But we might replace this with a different library
 * in future, or we might add more libraries to handle other
 * spreadsheet formats.</p>
 *
 * <p>To reduce code complexity, the Spreadsheet class presents a
 * high-level abstraction of spreadsheet functionality, which should
 * remain unchanged no matter which underlying library we use.</p>
 *
 * <p>The most important part of a spreadsheet is the 2D array of
 * cells in each sheet.  Each cell is an object with a <tt>value</tt>
 * and a <tt>style</tt>.  The <tt>value</tt> is a number, string, date
 * or <tt>null</tt>.  The style is a string containing the background
 * colour, a comma, and the foreground colour
 * (e.g. <TT>#FFFFFF00,#FF00FFFF</TT>).  Each colour is one of:
 *
 * <ul>
 * <li> <TT>#AARRGGBB</TT> - alpha, red, green, blue; e.g. <TT>#FFFFFF00</TT> is yellow
 * <li> <tt>iNNN</tt> - numeric indexed value; e.g. <tt>i1</tt> is index 1
 * <li> <tt>tNNN</tt> - numeric theme; e.g. <tt>t1</tt> is theme 1
 * </ul>
 *
 * <p>Implementations are encouraged to get Unix timestamps with the
 * <tt>parse_timestamp()</tt> function in this class.  That function
 * will attempt to decode various common time-like strings
 * (e.g. <tt>noon</tt>).</p>
 *
 * @example
 * console.log( spreadsheet["sheets"].length ); // number of sheets
 * @example
 * console.log( spreadsheet["sheets"][0]["name"] ); // name of the first sheet
 * @example
 * console.log( spreadsheet["sheets"][0]["cells"][0][1] ); // value of cell A2
 * -> {
 *      "value": new Date(...),
 *      "style": "#FFFFFF00,#FF000000FF",
 *    }
 *
 * @unrestricted
 */
class Spreadsheet {

    /**
     * @param {*=} value - contents of the cell
     * @param {string=} style - cell formatting
     */
    static create_cell(value,style) {
        return { "value": value, "style": style || "" };
    }

    /**
     * @param {Object} associated - object to synchronise the spreadsheet with
     * @param {SpreadsheetRules} rules - rules to convert between objects and spreadsheets
     *
     * <p>The spreadsheet rules can include a <tt>formats</tt> member,
     * specifying how numbers will be formatted in the associated
     * member.  Each value can be <tt>null</tt> (no special formatting), an
     * Excel number format code, or <tt>number</tt>/<tt>time</tt>/<tt>duration</tt>
     * (aliases for common formats).</p>
     *
     * @example
     * let spreadsheet = new Spreadsheet(
     *   associated,
     *   [
     *     {
     *       sheet: "...", // name of a sheet in the spreadsheet (e.g. "records")
     *       member: "...", // name of an array in the diary object (default: same as "sheet")
     *       //type: "dictionary", // indicates the member is an object containing key/value pairs
     *       cells: [ // cells in the associated sheet
     *
     *         // most cells can be defined with the high-level format:
     *         {
     *           "member": "...", // required - name of the member (e.g. 'start')
     *           "type": "text", // optional - can also be "number", "time" or "duration"
     *           "regexp": /^[0-9]$/, // optional - values must match this pattern
     *           //"optional": true, // allow this value to be missing
     *         },
     *
     *         // sometimes you might need to use the low-level format:
     *         {
     *           "members": [ "foo", "bar" ], // names of members that will be returned by the read
     *           "formats": [ null , "duration" ], // how numbers are formatted in this member (see above)
     *           "export": (array_element,row,offset) => { // append cells to the current row
     *             row[offset  ] = Spreadsheet.create_cell(array_element["foo"]);
     *             row[offset+1] = Spreadsheet.create_cell(array_element["foo"]+array_element["bar"]);
     *             return false; // indicates this value cannot be serialised
     *           },
     *           "import": (array_element,row,offset) => {
     *             array_element["foo"] =                          row[offset]["value"];
     *             array_element["bar"] = row[offset+1]["value"] - row[offset]["value"];
     *             return false; // indicates this value cannot be parsed
     *           },
     *         },
     *
     *         ...
     *
     *       ]
     *     },
     *
     *     ...
     *
     *   ]
     * );
     */
    constructor(associated,rules) {

        const debug = false;

        function exporter(cell) {

            const create_cell = Spreadsheet.create_cell;
            const member = cell["member"];

            let ret;
            switch ( cell["type"] ) {
            case "time"    : ret = (elem,row,offset) =>
                row[offset] = Spreadsheet.create_cell( ( elem[member] === undefined ) ? undefined : new Date( elem[member] ));
                break;
            case "duration": ret = (elem,row,offset) =>
                row[offset] = Spreadsheet.create_cell( ( elem[member] === undefined ) ? undefined : elem[member] / (1000*60*60*24) );
                break;
            default        : ret = (elem,row,offset) =>
                row[offset] = Spreadsheet.create_cell(elem[member]);
            }

            if ( cell["optional"] ) {
                const inner = ret;
                ret = (elem,row,offset) => ( elem[member] === undefined ) || inner(elem,row,offset);
            }

            if ( debug ) { // debugging use only
                const inner = ret;
                ret = (elem,row,offset) => {
                    const result = inner(elem,row,offset);
                    console.info(cell,row[offset],elem[member],result);
                    return result;
                };
            }

            return ret;
        }

        function importer(cell,self) {

            const member = cell["member"];

            let ret;
            switch ( cell["type"] ) {
            case "time"    : ret = (elem,row,offset) => !isNaN( elem[member] = Spreadsheet.parse_timestamp(row[offset]["value"]) ); break;
            case "duration": ret = (elem,row,offset) => !isNaN( elem[member] = row[offset]["value"].getTime() + self["epoch_offset"] ); break;
            case "number"  : ret = (elem,row,offset) => !isNaN( elem[member] = parseFloat(row[offset]["value"]) ); break;
            case "boolean" : ret = (elem,row,offset) => !isNaN( elem[member] = !!row[offset]["value"] ); break;
            default: ret = (elem,row,offset) => { elem[member] = row[offset]["value"]; return true; };
            }

            if ( cell["regexp"] ) {
                const inner = ret;
                ret = (elem,row,offset) => cell["regexp"].test(row[offset]["value"]) && inner(elem,row,offset);
            }

            if ( cell["optional"] ) {
                const inner = ret;
                ret = (elem,row,offset) => (
                    ( row[offset] || { "value": null } )["value"] === null || inner(elem,row,offset)
                );
            }

            if ( debug ) {
                const inner = ret;
                ret = (elem,row,offset) => {
                    const result = inner(elem,row,offset);
                    console.info(cell,row[offset]["value"],elem[member],result);
                    return result;
                };
            }

            return ret;

        }

        /**
         * Low-level spreadsheet library object.
         * @type (Object|null)
         * @private
         */
        this.raw = null;

        /**
         * Object associated with this spreadsheet
         */
        this.associated = associated;

        /**
         * Spreadsheet rules
         * @private
         */
        this.rules = rules.map( rule => ({

            "sheet"   : rule["sheet"] || rule["member"],
            "member"  : rule["member"] || rule["sheet"],
            "type"    : rule["type"] || "list",
            "optional": !!rule["optional"],

            // convert high-level definitions to low-level definitions:
            "cells": rule["cells"].map( cell => {
                if ( cell["members"] ) {
                    cell["formats"] = ( cell["formats"] || [] ).map(
                        format => SpreadsheetNumberFormats[format] || format
                    );
                    while ( cell["formats"].length < cell["members"].length ) {
                        cell["formats"].push("General");
                    }
                    return cell;
                } else {
                    return {
                        "members": [ cell["member"] ],
                        "regexp": cell["regexp"] || new RegExp(""),

                        "formats": [
                            SpreadsheetNumberFormats[ cell["type"] ] || "General"
                        ],

                        "export": exporter(cell),
                        "import": importer(cell,this),
                    }
                }
            }),

        }));

        /*
         * Epoch used by dates created in this spreadsheet,
         * in milliseconds relative to the Unix epoch
         */
        this["epoch_offset"] = 0;


        /**
         * Array of sheets
         */
        this["sheets"] = [];

    }

    ["get_sheet"](name,headers,number_formats) {

        const expected = headers.join("\0");

        const sheets = this["sheets"].filter(
            sheet => sheet["cells"][0] && sheet["cells"][0].map( cell => cell["value"] ).join("\0") == expected
        );

        if ( sheets.length ) {

            return [ false, sheets.find( sheet => sheet["name"] == name ) || sheets[0] ];

        } else {

            const ret = {
                "name": name,
                "number_formats": number_formats.map( type => type ? SpreadsheetNumberFormats[ type ] || type : "General" ),
                "cells": [
                    headers.map( header => Spreadsheet.create_cell(header,"#FFEEEEEE,#FFEEEEEE") )
                ],
            };
            return [ true, ret ];

        }

    }

    /**
     * Convert a cell to a Unix timestamp
     * @param {Object} value - cell or value to analyse
     * @param {Object=} raw_spreadsheet - raw spreadsheet object from which the value was taken
     * @return {number} Unix timestamp (if parseable)
     */
    static parse_timestamp(value,raw_spreadsheet) {
        return DiaryBase.parse_timestamp(
            (value||{}).hasOwnProperty("value") ? value["value"] : value,
            raw_spreadsheet
            ? (
                ( raw_spreadsheet["properties"] || {} ) ["date1904"]
                ? 2082844800000
                : 2209161600000
            )
            : 0
        );
    }

    /**
     * Read data from a buffer (e.g. a file input)
     */
    static buffer_to_spreadsheet(buffer) {

        function encode_style(style) {
            if      ( style.hasOwnProperty("argb"   ) ) return '#' + style["argb"];
            else if ( style.hasOwnProperty("indexed") ) return 'i' + style["indexed"];
            else if ( style.hasOwnProperty("theme"  ) ) return 't' + style["theme"];
            return '';
        }

        let spreadsheet;
        try {
            spreadsheet = new window["ExcelJS"]["Workbook"]();
        } catch (e) {
            spreadsheet = new ( require("exceljs")["Workbook"] )();
        }

        return spreadsheet["xlsx"]["load"](buffer).then(
            () => {
                if ( spreadsheet["_worksheets"].length ) {
                    let sheets = [];
                    spreadsheet["eachSheet"]( (raw_worksheet, sheetId) => {
                        let sheet = { "name": raw_worksheet["name"], "cells": [] };
                        sheets.push(sheet);
                        raw_worksheet["eachRow"]( { "includeEmpty": true }, (raw_row, row_number) => {
                            let row = sheet["cells"][row_number-1] = [];
                            raw_row["eachCell"]({ "includeEmpty": true }, function(cell, col_number) {
                                let style = "";
                                if ( cell["style"] && cell["style"]["fill"] ) {
                                    style = (
                                        encode_style(cell["style"]["fill"]["bgColor"]||{}) +
                                        ',' +
                                        encode_style(cell["style"]["fill"]["fgColor"]||{})
                                    );
                                }
                                if ( style.length == 1 ) style = "";
                                // check for floating point errors:
                                if ( (cell["value"]||{}).getTime ) {
                                    const time = cell["value"].getTime();
                                    if ( ( time % 1000 ) ==  1 || ( time % 1000 ) == -999 ) {
                                        cell["value"] = new Date( time-1 );
                                    }
                                    if ( ( time % 1000 ) == -1 || ( time % 1000 ) ==  999 ) {
                                        cell["value"] = new Date( time+1 );
                                    }
                                }
                                row[col_number-1] = Spreadsheet.create_cell(cell["value"],style);
                            })
                        });
                    });

                    return {
                        "file_format": "spreadsheet",
                        "spreadsheet": spreadsheet,
                        "sheets": sheets,
                    }
                } else {
                    throw Error( "empty spreadsheet" );
                }
            }
        );

    }

    /**
     * Copy data from the parameter into this.sheets and this.associated
     *
     * @param {string} contents - CSV file to load from
     * @return {Object|undefined} spreadsheet information
     */
    static parse_csv(contents) {

        const value = "([^\",\\n]*|\"\([^\"]|\"\")*\")";

        // Excel requires a byte order mark, which we ignore:
        if ( contents[0] == "\u{FEFF}" ) contents = contents.substr(1);
        // reduce the complexity of the regexp by guaranteeing a trailing newline:
        if ( contents.search(/\n$/) == -1 ) contents += "\n";

        // does this look like a valid CSV file?
        if ( contents.search(new RegExp(`^(${value}(,${value})*\n)*$`) ) ) return;

        let spreadsheet;
        try {
            spreadsheet = new window["ExcelJS"]["Workbook"]();
        } catch (e) {
            spreadsheet = new ( require("exceljs")["Workbook"] )();
        }

        let raw_sheet = spreadsheet["addWorksheet"]("Records");
        let sheet = [];

        let row_number=0;
        contents.replace(
            new RegExp(`${value}(,${value})*\n`, 'g'),
            line_str => {
                let raw_row = raw_sheet["getRow"](row_number+1);
                let row = [];
                sheet.push(row);
                let n=0;
                line_str
                    .replace( new RegExp(value+'[,\n]','g'), value => {
                        let raw_cell = raw_row["getCell"](n+1);
                        if ( value[0] == '"' ) {
                            raw_cell["value"] = value.substr(1,value.length-3).replace( /""/g, '"' );
                        } else {
                            raw_cell["value"] = value.substr(0,value.length-1);
                        }
                        row.push(Spreadsheet.create_cell(raw_cell["value"]));
                    });
            }
        );

        return {
            "spreadsheet": spreadsheet,
            "sheets": [{ "name": "Records", "cells": sheet }],
        }

    }

    static escape_csv_component( value ) {
        return (
            ( value === undefined )
            ? ''
            : ( value.toString().search(/[",\n]/) == -1 )
            ? value
            : '"'+value.replace(/"/g, '""')+'"'
        );
    }

    /**
     * Copy data from the parameter into this.sheets and this.associated
     *
     * @param {Object} spreadsheet - spreadsheet to load from
     * @return {boolean} whether the operation was successful
     */
    ["load"](spreadsheet) {

        const sheets = spreadsheet["sheets"];

        if ( !sheets ) return false;

        const old_offset = this["epoch_offset"];
        this["epoch_offset"] = (
            ( spreadsheet["spreadsheet"]["properties"] || {} ) ["date1904"]
                ? 2082844800000
                : 2209161600000
        );

        if ( !this.rules.every(

            sheet_rule => sheets.some( sheet => {

                const cells = sheet["cells"];
                const is_dictionary = sheet_rule["type"] == "dictionary";

                if (
                    !cells.length ||
                    ( is_dictionary && cells.length != 2 )
                ) {
                    return false;
                }

                // ensure that all headers are present:
                const header_row = cells[0].slice(0);
                const header_length = header_row.length;

                if (
                    !sheet_rule["cells"].every(
                        cell => cell["members"].every( member => member == header_row.shift()["value"] )
                    )
                ) {
                    return false;
                }

                // calculate array and check the values actually match:
                let array = [];
                if ( !cells.slice(1).every( row => {
                    let offset = 0;
                    let array_element = {};
                    array.push(array_element);
                    return sheet_rule["cells"].every(
                        cell => cell["import"](
                            array_element,
                            row,
                            ( offset += cell["members"].length ) - cell["members"].length
                        )
                    );
                }) ) {
                    return false;
                }

                const member = sheet_rule["member"];
                if ( is_dictionary ) {
                    this.associated[member] = Object.assign( array[0], this.associated[member]||{} );
                } else {
                    if ( !this.associated[member] ) this.associated[member] = [];
                    let data = this.associated[member];
                    if ( data.length >= cells.length ) data.splice( 0, cells.length - 1 );
                    array.forEach( (array_element,n) => data[n] = Object.assign( array_element, data[n] ) );
                }

                let number_formats = [];
                sheet_rule["cells"].forEach( cell => number_formats = number_formats.concat( cell["formats"] ) );
                sheet["number_formats"] = number_formats;

                return true;

            })

        ) ) {
            this["epoch_offset"] = old_offset;
            return false;
        }

        this.raw = spreadsheet["spreadsheet"];
        this["sheets"] = sheets;
        return true;
    }

    /**
     * Copy data from this.associated to this.sheets
     * @return {boolean}
     */
    ["synchronise"]() {
        return this.rules.every( sheet_rule => {

            const is_dictionary = sheet_rule["type"] == "dictionary";

            let headers = [];
            let number_formats = [];
            sheet_rule["cells"].forEach( cell => {
                headers = headers.concat( cell["members"] )
                number_formats = number_formats.concat( cell["formats"] );
            });

            const added_sheet = this["get_sheet"](sheet_rule["sheet"],headers,number_formats);
            const added = added_sheet[0];
            const sheet = added_sheet[1];
            let cells = sheet["cells"] = [
                headers.map(header => Spreadsheet.create_cell(header,"#FFEEEEEE,#FFEEEEEE"))
            ];

            const associated = this.associated[sheet_rule["member"] || sheet_rule["sheet"]];
            function process_row(array_element) {
                let row = [], offset = 0;
                cells.push(row);
                return sheet_rule["cells"].every(
                    cell => cell["export"]( array_element, row, ( offset += cell["members"].length ) - cell["members"].length )
                );
            }

            if ( is_dictionary ) {
                if ( !process_row(associated)       ) return false;
            } else {
                if ( !associated.every(process_row) ) return false;
            }

            if ( added ) this["sheets"].push(sheet);
            return true;

        });
    }

    /**
     * Generate a spreadsheet based on this.sheets
     * @return {Promise}
     */
    ["serialise"]() {

        function decode_style(style) {
            switch ( style[0] ) {
            case '#': return { "argb"   :          style.slice(1)     };
            case 'i': return { "indexed": parseInt(style.slice(1),10) };
            case 't': return { "theme"  : parseInt(style.slice(1),10) };
            default : return {};
            }
        }

        const fix_timestamps = !this.raw;

        if ( !this.raw ) {
            try {
                this.raw = new window["ExcelJS"]["Workbook"]();
            } catch (e) {
                this.raw = new ( require("exceljs")["Workbook"] )();
            }
            this["epoch_offset"] = (
                ( this.raw["properties"] || {} ) ["date1904"]
                ? 2082844800000
                : 2209161600000
            );
        }

        const epoch_offset = this["epoch_offset"];

        // Remove deleted worksheets:
        let raw_sheets = {};
        this["sheets"].forEach( sheet => raw_sheets[sheet["name"]] = 0 );
        this.raw["eachSheet"]( (worksheet, sheetId) => {
            if ( raw_sheets.hasOwnProperty(worksheet["name"]) ) {
                raw_sheets[worksheet["name"]] = worksheet;
            } else {
                this.raw.removeWorksheet(sheetId);
            }
        });

        // Add/update worksheets:
        this["sheets"].forEach( sheet => {
            let raw_sheet = raw_sheets[sheet["name"]] || this.raw["addWorksheet"](sheet["name"]);

            // Remove deleted cells:
            raw_sheet["eachRow"]( { "includeEmpty": true }, (raw_row, row_number) => {
                let row = sheet["cells"][row_number-1] || [];
                raw_row["eachCell"]({ "includeEmpty": true }, (raw_cell, col_number) => {
                    if ( !row[col_number] ) {
                        raw_cell["value"] = null;
                        raw_cell["style"] = {};
                    }
                })
            });

            // Add/update cells:
            sheet["cells"].forEach( (row,n) => {
                let raw_row = raw_sheet["getRow"](n+1);
                row.forEach( (cell,n) => {
                    let raw_cell = raw_row["getCell"](n+1);
                    if ( fix_timestamps && (cell["value"]||{}).getTime && cell["value"].getTime() >= 0 && cell["value"].getTime() < 24 * 60 * 60 * 1000 ) {
                        // reset times relative to the new epoch
                        raw_cell["value"] = new Date( cell["value"].getTime() - epoch_offset );
                    } else {
                        raw_cell["value"] = cell["value"];
                    }
                    let style = cell["style"].split(',');
                    if ( style[0] || style[1] ) {
                        // Note: we remove any existing style, in case it interacts with the style we add:
                        const raw_style = raw_cell["style"] = {};
                        raw_style["fill"] = raw_style["fill"] || {};
                        raw_style["fill"]["type"] = "pattern";
                        raw_style["fill"]["pattern"] = "solid";
                        if ( style[0] ) {
                            raw_style["fill"]["bgColor"] = decode_style(style[0]);
                        } else {
                            delete raw_style["fill"]["bgColor"];
                        }
                        if ( style[1] ) {
                            raw_style["fill"]["fgColor"] = decode_style(style[1]);
                        } else {
                            delete raw_style["fill"]["fgColor"];
                        }
                    } else {
                        const raw_style = raw_cell;
                        if ( raw_style && raw_style["fill"] ) {
                            delete raw_style["fill"]["bgColor"];
                            delete raw_style["fill"]["fgColor"];
                        }
                    }
                });
                raw_row["commit"]();
            });

            if ( sheet["widths"] ) {
                sheet["widths"].forEach( (w,n) => raw_sheet["columns"][n]["width"] = w );
            } else {
                raw_sheet["columns"].forEach( col => col["width"] = 18 );
            }

            sheet["number_formats"].forEach (
                (format,n) => raw_sheet["getColumn"](n+1)["numFmt"] = format
            );

        });

        return this.raw["xlsx"]["writeBuffer"]();

    }

    ["file_format"]() { return "Spreadsheet"; }

}
