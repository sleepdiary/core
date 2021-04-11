var sleep_diary_exports = (
    ( typeof module !== "undefined" && module.exports )
        ? require("./sleep-diary-formats.js")
        : window
);
var sleep_diary_formats = sleep_diary_exports.sleep_diary_formats;
var new_sleep_diary = sleep_diary_exports.new_sleep_diary;
var Spreadsheet     = sleep_diary_exports.Spreadsheet;
var serialiser      = ( sleep_diary_exports.DiaryLoader || {} ).serialiser;

var roundtrip_modifiers = {};
function register_roundtrip_modifier(format,callback) {
    roundtrip_modifiers[format] = callback;
}

function compare_diaries(observed,expected) {
    var clone_observed = Object.assign({},observed);
    var clone_expected = Object.assign({},expected);
    delete clone_observed.spreadsheet;
    delete clone_expected.spreadsheet;
    Object.keys(clone_observed).forEach( function(key) {
        if ( clone_observed[key] == serialiser ) delete clone_observed[key];
    });
    Object.keys(clone_expected).forEach( function(key) {
        if ( clone_expected[key] == serialiser ) delete clone_expected[key];
    });
    //console.error("Observed and expected objects should have been equal:\n",observed,expected);
    return expect(clone_observed).toEqual(clone_expected);
}

function test_constructor(test,serialiser) {
    var diary = null, error = false;
    var console_error = console.error;
    if ( test.quiet ) console.error = function() {};
    try {
        var input = test.input;
        if ( test.clone_contents ) {
            input.contents = JSON.parse(JSON.stringify(input.contents));
        }
        if ( input && typeof(input) == "function" ) input = input();
        if ( typeof(test.input) == "string" || test.input.file_format ) {
            diary = new_sleep_diary(test.input,serialiser);
        } else {
            diary = new_sleep_diary({ "file_format": function() { return "archive" }, "contents": test.input },serialiser);
        }
    } catch (e) {
        if ( !test.error ) console.warn(e);
        error = true;
    }
    if ( test.quiet ) console.error = console_error;

    it(`produces the correct error for "${test.name}"`, function() {
        expect(error).toEqual(!!test.error);
    });

    if ( !error ) {
        // if the following error occurs, you need to edit your ["extension"]() function:
        it(`produces an extension other than ".exm" for "${test.name}"`, function() {
            expect(diary.format_info().extension).not.toEqual(".exm");
        });
    }
    return error == !!test.error ? diary : null;
}


function test_parse(test) {

    if ( !test.name ) test.name = "format's 'parse' test";

    var debug = (
        false
        // || test.name == "my test"
        // || true
    );

    var spreadsheetify = (test.spreadsheetify||'') != "disable";
    var output         = (test.output        ||'') != "disable";

    var diary = test_constructor(test,serialiser);

    if ( diary ) {

        it(`reads test "${test.name}" correctly`, function() {
            compare_diaries(diary,test.expected);
        });

        it(`produces a file of the correct format for "${test.name||"format's 'parse' test"}"`, function() {
            expect(diary.file_format()).toEqual(test.file_format);
        });

        it(`URL-ifies "${test.name||"format's 'parse' test"}" correctly`, function() {
            var url = diary.to("url");
            var observed = new_sleep_diary({
                "file_format": "url",
                "contents": url,
            },serialiser);
            compare_diaries(observed,diary);
        });

        /*
         * This is a very rough test for roundtripping between formats.
         * It compares two diaries modified like so:
         *
         * 1. current_format                                     -> Standard
         * 2. current_format -> another_format -> current_format -> Standard
         *
         * It's normal to lose data in the conversion to Standard format,
         * but formats shouldn't lose any more data than that.
         */
        var n = 0;
        sleep_diary_formats.forEach( function(format) {
            it(`converts "${test.name||"format's 'parse' test"}" to ${format.name} correctly`, function() {
                return new Promise(function(resolve, reject) {
                    diary.to_async(format.name)
                        .then(
                            function(formatted) {
                                formatted.to_async(diary.file_format())
                                    .then(
                                        function(roundtripped) {
                                            var observed = Object.assign({},roundtripped.to("Standard"));
                                            var expected = Object.assign({},diary       .to("Standard"));
                                            if ( debug ) console.log({
                                                "original": diary,
                                                "original to Standard": diary.to("Standard"),
                                                "original to formatted": formatted,
                                                "original to formatted to Standard": formatted.to("Standard"),
                                                "original to formatted and back again": roundtripped,
                                                "observed": observed,
                                                "expected": expected,
                                            });
                                            [observed,expected].forEach(
                                                diary => diary.records = diary.records.map(
                                                    record => Object.assign({},record)
                                                )
                                            );
                                            if ( roundtrip_modifiers[diary.file_format()] ) {
                                                roundtrip_modifiers[diary.file_format()](expected,observed,format);
                                            }
                                            if ( formatted.format_info().statuses ) {
                                                var statuses = {};
                                                formatted.format_info().statuses.forEach( s => statuses[s] = 1 );
                                                var total_expected = expected.records.length;
                                                expected.records = expected.records.filter(
                                                    r => statuses[r["status"]]
                                                );
                                                if ( total_expected != expected.records.length ) {
                                                    [observed,expected].forEach(
                                                        diary => diary.records = diary.records.map( r => {
                                                            var ret = Object.assign( {}, r );
                                                            delete ret.missing_record_after;
                                                            return ret;
                                                        })
                                                    );
                                                }
                                            }
                                            compare_diaries(observed,expected);
                                            resolve();
                                        },
                                        reject
                                    );
                            },
                            reject
                        );
                });
            });
        });

        if ( typeof module === "undefined" || !module.exports ) {

            if ( output ) {
                it(`outputs "${test.name||"format's 'parse' test"}" correctly`, function() {
                    return new Promise(function(resolve, reject) {
                        diary.to_async("output")
                            .then( function(output) {
                                var diary_loader = new DiaryLoader(
                                    function(observed,source) {
                                        if ( debug ) {
                                            console.log({
                                                original: diary,
                                                observed: observed,
                                                source: source,
                                            });
                                        }
                                        compare_diaries(observed,diary);
                                        resolve();
                                    },
                                    reject
                                );
                                diary_loader.load( DiaryLoader.to_url(output) );
                            });
                    });
                });
            }

            if ( spreadsheetify ) {
                it(`converts "${test.name||"format's 'parse' test"}" to spreadsheet correctly`, function() {
                    var clone1 = Object.assign({},diary);
                    Object.keys(clone1)
                        .forEach( function(key) {
                            if ( (typeof(clone1[key])).toLocaleLowerCase() == "function" ) { delete clone1[key] }
                        })
                    ;
                    return new Promise(function(resolve, reject) {
                        diary.to_async("spreadsheet")
                            .then( function(raw) {
                                return Spreadsheet.buffer_to_spreadsheet(raw).then(
                                    function(spreadsheet) {
                                        var diary_loader = new DiaryLoader(
                                            function(diary,source) {
                                                var clone2 = Object.assign({},diary);
                                                Object.keys(clone2)
                                                    .forEach( function(key) {
                                                        if ( (typeof(clone2[key])).toLocaleLowerCase() == "function" ) { delete clone2[key] }
                                                    })
                                                ;
                                                compare_diaries(clone2,clone1);
                                                resolve();
                                            },
                                            reject
                                        );
                                        diary_loader.load( spreadsheet );
                                    })
                            })
                    });
                });
            }

        }

    }

}

function test_from_standard(test) {

    if ( !test.name ) test.name = "format's 'from standard' test";

    var diary = test_constructor({
        name: test.name,
        input: {
            "file_format": function() { return "Standard" },
            contents: {
                file_format: "Standard",
                records: test.input
            }
        }},serialiser);
    var expected_diary = test_constructor({ name: test.name, input: test.expected },serialiser);

    it(`initialises "${test.name}" from Standard format correctly`, function() {

        expect( !!diary ).toEqual( true );
        expect( !!expected_diary ).toEqual( true );

        if ( diary && expected_diary ) {
            compare_diaries(diary.to(test.format),expected_diary);
        }

    });

}

function test_to(test) {

    if ( !test.name ) test.name = "format's 'to' test";

    var diary = test_constructor(test);

    if ( diary ) {
        it(`converts "${test.name}" to "${test.format}" correctly`, function() {
            return diary.to_async(test.format).then(
                function(converted) {
                    return expect(
                        ( test.format == "Standard" )
                        ? converted.records
                        : converted.contents
                    ).toEqual( test.expected )
                });
        });
    }

}

function test_merge(test) {

    if ( !test.name ) test.name = "format's 'merge' test";

    it(`merges "${test.name}" correctly`, function() {
        var clone = Object.assign(
            {},
            new_sleep_diary(test.left)
                .merge(new_sleep_diary(test.right))
        );
        delete clone.spreadsheet;
        expect(clone).toEqual(test.expected);
    });

}
describe("Spreadsheet", () => {

    [
        [        null, NaN ],
        [          0 ,   0 ],
        [          1 ,   1 ],
        [ new Date(0),   0 ],
        [ new Date(1),   1 ],
        [         "0",   0 ],
        [       "1"  , 3600000 ],
        [       "1AM", 3600000 ],
        [       "1am", 3600000 ],
        [       "1Am", 3600000 ],
        [       "1aM", 3600000 ],
        [ "MidNight - 01:00", 0 ],
        [ "01:00 - MidNight", 3600000 ],
        [ "14:30", 52200000 ],
    ].forEach(
        function(test) {
            it(`parses "${test[0]}" correctly`, function() {
                expect(Spreadsheet.parse_timestamp(test[0])).toEqual(test[1]);
            });
        }
    );

    it(`converts between sheets and objects correctly`, function() {

        let associated = {};

        var spreadsheet = new Spreadsheet(associated,[
            {
                sheet: "records",
                cells: [
                    { member: "test_time", type: "time", },
                    { member: "test_duration", type: "duration", },
                    { member: "test_number", type: "number", },
                    { member: "test_text", type: "text", },
                    {
                        members: [ "test_low_level_1", "test_low_level_2" ],
                        "export": (array_element,row,offset) => {
                            row[offset+0] = { "value": array_element["test_low_level_1"] * 2, "style": "" };
                            row[offset+1] = { "value": 'a' + array_element["test_low_level_2"], "style": "" };
                            return true;
                        },
                        "import": (array_element,row,offset) => {
                            array_element["test_low_level_1"] = row[offset+0]["value"] / 2;
                            array_element["test_low_level_2"] = row[offset+1]["value"].substr(1);
                            return true;
                        },
                    }
                ]
            },

        ]);

        var input = {

            "spreadsheet": spreadsheet,
            "sheets": [
                {
                    "name": "records",
                    "cells": [
                        [
                            { "style": "", "value": "test_time" },
                            { "style": "", "value": "test_duration" },
                            { "style": "", "value": "test_number" },
                            { "style": "", "value": "test_text" },
                            { "style": "", "value": "test_low_level_1" },
                            { "style": "", "value": "test_low_level_2" }
                        ],
                        [
                            { "style": "", "value": new Date( "1970-01-01T03:25:45.678Z" ) },
                            { "style": "", "value": new Date( "1899-12-30T06:30:56.789Z" ) },
                            { "style": "", "value": 987654321 },
                            { "style": "", "value": "abcdefghij" },
                            { "style": "", "value": 6 },
                            { "style": "", "value": "a3" }
                        ]
                    ]
                }
            ]

        };

        var expected = {
            "records": [
                {
                    "test_time": 12345678,
                    "test_duration": 23456789,
                    "test_number": 987654321,
                    "test_text": "abcdefghij",
                    "test_low_level_1": 3,
                    "test_low_level_2": "3",
                }
            ]
        };
        expect( spreadsheet.load(input) ).toBeTrue();
        expect( spreadsheet.synchronise() ).toBeTrue();
        expect( associated ).toEqual(expected);

    });

});
register_roundtrip_modifier("Standard",function(our_diary,roundtripped_diary,other_format) {
    [our_diary,roundtripped_diary].forEach(function(diary) {
        diary.records  = diary.records.slice(0).map(function(record) {
            if ( record.comments ) record.comments = record.comments.slice(0);
            return record;
        });
        diary.settings = Object.assign( {}, diary.settings );
    });
    if ( our_diary.settings.minimum_day_duration != 72000000 || our_diary.settings.maximum_day_duration != 144000000 ) {
        // not supported in most formats - we don't expect to get any meaningful data
        [our_diary,roundtripped_diary].forEach(function(diary) {
            delete diary.settings.minimum_day_duration;
            delete diary.settings.maximum_day_duration;
            diary.records.forEach( function(record) {
                /*
                 * calculations will be wrong with different durations
                 */
                ["start_of_new_day","day_number"].forEach(function(key) {
                    delete record[key];
                });
            });

        });
    }
    switch ( other_format.name ) {
    case "SpreadsheetGraph":
    case "SpreadsheetTable":
    case "PleesTracker":
        [our_diary,roundtripped_diary].forEach(function(diary) {
            diary.records.forEach( function(record) {
                /*
                 * Values not supported - and guessed incorrectly - in these formats
                 */
                ["duration","day_number","is_primary_sleep","start_of_new_day"].forEach(function(key) {
                    delete record[key];
                });
            });
        });
    }
    switch ( other_format.name ) {
    case "SpreadsheetTable":
        our_diary.records.forEach( function(record) {
            /*
             * Values not supported - in these formats
             */
            if ( record.comments ) {
                record.comments = record.comments.map(
                    comment => ( typeof(comment) == "string" ) ? comment : comment["text"]
                );
            }
        });
    }
    switch ( other_format.name ) {
    case "Sleepmeter":
    case "SleepAsAndroid":
        our_diary.records.forEach( function(r,n) {
            /*
             * These formats converts missing timezones to Etc/GMT, which can also be specified manually.
             * Standard format allows missing timezones.
             * Therefore, roundtripping breaks some timezones.
             */
            ["start_timezone","end_timezone"].forEach(function(key) {
                if ( r[key] === undefined &&
                     !((roundtripped_diary.records[n]||{})[key]||'').search(/^Etc\/GMT(-1)?$/) ) {
                    delete r[key];
                    delete roundtripped_diary.records[n][key];
                }
            });
        });
    }
});

describe("Standard format", () => {

    function wrap_expected(expected) { return expected; }

    function wrap_input(contents) {
        contents.file_format = "Standard";
        return {
            "file_format": () => "Standard",
            "contents": contents,
        }
    }

    test_parse({
        name: "simple example",
        file_format:"Standard",
        input: "{\"file_format\":\"Standard\",\"records\":[]}",
        expected: {
            settings: {
                minimum_day_duration: 72000000,
                maximum_day_duration: 144000000,
            },
            records: [],
        }
    });

    test_parse({
        name: "invaid JSON",
        parseable: true,
        file_format:"Standard",
        input: '{',
        error: true,
        quiet: true,
    });

    test_parse({
        name: "missing records",
        file_format:"Standard",
        input:  { "file_format": "Standard" },
        error: true,
        quiet: true,
    });

    test_parse({
        name: "input object",
        file_format:"Standard",
        input:  wrap_input({
            "records": [],
        }),
        expected: {
            settings: {
                minimum_day_duration: 72000000,
                maximum_day_duration: 144000000,
            },
            records: [],
        }
    });

    test_parse({
        name: "min/max durations",
        file_format:"Standard",
        input: wrap_input({
            "records": [],
            "minimum_day_duration": 16,
            "maximum_day_duration": 32,
        }),
        expected: wrap_expected({
            settings: {
                minimum_day_duration: 16,
                maximum_day_duration: 32,
            },
            records: [],
        }),
    });

    test_parse({
        name: "hard-to-parse comment",
        file_format:"Standard",
        input:  wrap_input({
            "records": [
                {
                    status   : "awake",
                    comments : [
                        "this is a single field containing one comma (,) one newline (\n) and one double quote (\")",
                    ],
                },
            ],
        }),
        expected: {
            settings: {
                minimum_day_duration: 72000000,
                maximum_day_duration: 144000000,
            },
            records: [
                {
                    status   : "awake",
                    comments : [
                        "this is a single field containing one comma (,) one newline (\n) and one double quote (\")",
                    ],
                    day_number       : 0,
                    start_of_new_day : false,
                },
            ],
        }
    });

    test_parse({
        name: "records with various members defined",
        spreadsheetify: 'disable',
        file_format:"Standard",
        input: wrap_input({ "file_format": "Standard", "records": [
            {
                start               : 1,
                end                 : 2,
                duration            : 3,
                status              : "awake",
                comments            : [
                   "comment string",
                    { time: 4, text:"comment object" },
                ],
                day_number          : 1,
                start_of_new_day    : true,
                is_primary_sleep    : true,
                missing_record_after: true,
            },
            {
                start               : 1,
                end                 : 2,
                //duration            : 3,
                status              : "awake",
                comments            : [
                   "comment string",
                    { time: 4, text:"comment object" },
                ],
                day_number          : 1,
                start_of_new_day    : true,
                is_primary_sleep    : true,
                missing_record_after: true,
            },
            {
                start               : 1,
                //end                 : 2,
                //duration            : 3,
                status              : "awake",
                comments            : [
                   "comment string",
                    { time: 4, text:"comment object" },
                ],
                day_number          : 1,
                start_of_new_day    : true,
                is_primary_sleep    : true,
                missing_record_after: true,
            },
            {
                start               : 1,
                //end                 : 2,
                //duration            : 3,
                status              : "awake",
                comments            : [
                   "comment string",
                    { time: 4, text:"comment object" },
                ],
                //day_number          : 1,
                start_of_new_day    : true,
                is_primary_sleep    : true,
                missing_record_after: true,
            },
            {
                start               : 1,
                //end                 : 2,
                //duration            : 3,
                status              : "awake",
                comments            : [
                   "comment string",
                    { time: 4, text:"comment object" },
                ],
                //day_number          : 1,
                //start_of_new_day    : true,
                is_primary_sleep    : true,
                missing_record_after: true,
            },
            {
                start               : 1,
                //end                 : 2,
                //duration            : 3,
                status              : "awake",
                comments            : [
                   "comment string",
                    { time: 4, text:"comment object" },
                ],
                //day_number          : 1,
                //start_of_new_day    : true,
                //is_primary_sleep    : true,
                missing_record_after: true,
            },
            {
                start               : 1,
                //end                 : 2,
                //duration            : 3,
                status              : "awake",
                comments            : [
                   "comment string",
                    { time: 4, text:"comment object" },
                ],
                //day_number          : 1,
                //start_of_new_day    : true,
                //is_primary_sleep    : true,
                //missing_record_after: true,
            },
        ] }),
        expected: wrap_expected({
            settings: {
                minimum_day_duration: 72000000,
                maximum_day_duration: 144000000,
            },
            records: [
                {
                    start               : 1,
                    end                 : 2,
                    duration            : 3,
                    status              : "awake",
                    comments            : [
                        "comment string",
                        { time: 4, text:"comment object" },
                    ],
                    day_number          : 1,
                    start_of_new_day    : true,
                    is_primary_sleep    : true,
                    missing_record_after: true,
                },
                {
                    start               : 1,
                    end                 : 2,
                    duration            : 1,
                    status              : "awake",
                    comments            : [
                        "comment string",
                        { time: 4, text:"comment object" },
                    ],
                    day_number          : 1,
                    start_of_new_day    : true,
                    is_primary_sleep    : true,
                    missing_record_after: true,
                },
                {
                    start               : 1,
                    status              : "awake",
                    comments            : [
                        "comment string",
                        { time: 4, text:"comment object" },
                    ],
                    day_number          : 1,
                    start_of_new_day    : true,
                    is_primary_sleep    : true,
                    missing_record_after: true,
                },
                {
                    start               : 1,
                    status              : "awake",
                    comments            : [
                        "comment string",
                        { time: 4, text:"comment object" },
                    ],
                    day_number          : 2,
                    start_of_new_day    : true,
                    is_primary_sleep    : true,
                    missing_record_after: true,
                },
                {
                    start               : 1,
                    status              : "awake",
                    comments            : [
                        "comment string",
                        { time: 4, text:"comment object" },
                    ],
                    day_number          : 2,
                    start_of_new_day    : false,
                    is_primary_sleep    : true,
                    missing_record_after: true,
                },
                {
                    start               : 1,
                    status              : "awake",
                    comments            : [
                        "comment string",
                        { time: 4, text:"comment object" },
                    ],
                    day_number          : 2,
                    start_of_new_day    : false,
                    missing_record_after: true,
                },
                {
                    start               : 1,
                    status              : "awake",
                    comments            : [
                        "comment string",
                        { time: 4, text:"comment object" },
                    ],
                    day_number          : 2,
                    start_of_new_day    : false,
                },
            ],
        }),
    });

    test_parse({
        name: "Day-length calculations",
        spreadsheetify: 'disable',
        file_format:"Standard",
        input: wrap_input({ "file_format": "Standard", "records": [
            {
                start               : 72000000*0,
                status              : "asleep",
            },
            {
                start               : 72000000*1,
                status              : "asleep",
            },
            {
                start               : 72000000*1 + 1,
                status              : "asleep",
            },
            {
                start               : 72000000*3 + 1,
                status              : "asleep",
            },
            {
                start               : 72000000*5 + 2,
                status              : "asleep",
            },
        ] }),
        expected: wrap_expected({
            settings: {
                minimum_day_duration: 72000000,
                maximum_day_duration: 144000000,
            },
            records: [
                {
                    start               : 72000000*0,
                    status              : "asleep",
                    day_number          : 0,
                    start_of_new_day    : false,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*1,
                    status              : "asleep",
                    day_number          : 0,
                    start_of_new_day    : false,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*1 + 1,
                    status              : "asleep",
                    day_number          : 1,
                    start_of_new_day    : true,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*3 + 1,
                    status              : "asleep",
                    day_number          : 2,
                    start_of_new_day    : true,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*5 + 2,
                    status              : "asleep",
                    day_number          : 4,
                    start_of_new_day    : true,
                },
            ],
        }),
    });

    test_parse({
        name: "Day-length calculations with specified min/max duration",
        spreadsheetify: 'disable',
        output: 'disable',
        file_format:"Standard",
        input: wrap_input({
            "file_format": "Standard",
            "records": [
                {
                    start               : 72000000*0,
                    status              : "asleep",
                },
                {
                    start               : 72000000*1,
                    status              : "asleep",
                },
                {
                    start               : 72000000*1 + 1,
                    status              : "asleep",
                },
                {
                    start               : 72000000*3 + 1,
                    status              : "asleep",
                },
                {
                    start               : 72000000*5 + 2,
                    status              : "asleep",
                },
            ],
            "minimum_day_duration": 1,
            "maximum_day_duration": Math.pow(2,31),
        }),
        expected: wrap_expected({
            settings: {
                minimum_day_duration: 1,
                maximum_day_duration: Math.pow(2,31),
            },
            records: [
                {
                    start               : 72000000*0,
                    status              : "asleep",
                    day_number          : 0,
                    start_of_new_day    : false,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*1,
                    status              : "asleep",
                    day_number          : 1,
                    start_of_new_day    : true,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*1 + 1,
                    status              : "asleep",
                    day_number          : 1,
                    start_of_new_day    : false,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*3 + 1,
                    status              : "asleep",
                    day_number          : 2,
                    start_of_new_day    : true,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*5 + 2,
                    status              : "asleep",
                    day_number          : 3,
                    start_of_new_day    : true,
                },
            ],
        }),
    });

    test_parse({
        name: "Out-of-order records",
        spreadsheetify: 'disable',
        file_format:"Standard",
        input: wrap_input({
            "file_format": "Standard",
            "records": [
                {
                    start               : 72000000*1,
                    status              : "asleep",
                },
                {
                    start               : 72000000*0,
                    status              : "asleep",
                },
            ],
        }),
        expected: wrap_expected({
            settings: {
                minimum_day_duration: 72000000,
                maximum_day_duration: 144000000,
            },
            records: [
                {
                    start               : 72000000*0,
                    status              : "asleep",
                    day_number          : 0,
                    start_of_new_day    : false,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*1,
                    status              : "asleep",
                    day_number          : 0,
                    start_of_new_day    : false,
                },
            ],
        }),
    });

    test_parse({
        name: "Multiple sleeps",
        file_format:"Standard",
        input: wrap_input({
            "file_format": "Standard",
            "records": [
                {
                    duration: 16,
                    status  : "asleep",
                },
                {
                    duration: 32,
                    status  : "asleep",
                },
            ],
        }),
        expected: wrap_expected({
            settings: {
                minimum_day_duration: 72000000,
                maximum_day_duration: 144000000,
            },
            records: [
                {
                    duration            : 16,
                    status              : "asleep",
                    day_number          : 0,
                    start_of_new_day    : false,
                    missing_record_after: true,
                },
                {
                    duration            : 32,
                    status              : "asleep",
                    day_number          : 0,
                    start_of_new_day    : false,
                    is_primary_sleep    : true,
                },
            ],
        }),
    });

    it(`serialises data correctly`, function() {
        expect(
            new_sleep_diary(wrap_input({
                "records": [
                    {
                        duration: 1,
                        status  : "asleep",
                    },
                    {
                        duration: 2,
                        status  : "asleep",
                    },
                ],
            })).to("output").contents
        ).toEqual('{"file_format":"Standard","records":[{"duration":1,"status":"asleep","start_of_new_day":false,"day_number":0,"missing_record_after":true},{"duration":2,"status":"asleep","start_of_new_day":false,"day_number":0,"is_primary_sleep":true}],"settings":{"minimum_day_duration":72000000,"maximum_day_duration":144000000}}');
    });

    [
        {
            left: [],
            right: [],
            expected: [],
        },
        {
            left: [ { start: 1, end: 2 } ],
            right: [],
            expected: [ { start: 1, end: 2, duration: 1, start_of_new_day: false, day_number: 0 } ],
        },
        {
            left: [],
            right: [ { start: 1, end: 2 } ],
            expected: [ { start: 1, end: 2, duration: 1, start_of_new_day: false, day_number: 0 } ],
        },
        {
            left: [ { start: 1, end: 2 } ],
            right: [ { start: 1, end: 2 } ],
            expected: [ { start: 1, end: 2, duration: 1, start_of_new_day: false, day_number: 0 } ],
        },
        {
            left: [ { start: 2, end: 3 } ],
            right: [ { start: 1, end: 2 } ],
            expected: [
                { start: 1, end: 2, duration: 1, start_of_new_day: false, day_number: 0 },
                { start: 2, end: 3, duration: 1, start_of_new_day: false, day_number: 0 },
            ],
        },
        {
            left: [ { start: 1, end: 2 } ],
            right: [ { start: 2, end: 3 } ],
            expected: [
                { start: 1, end: 2, duration: 1, start_of_new_day: false, day_number: 0 },
                { start: 2, end: 3, duration: 1, start_of_new_day: false, day_number: 0 },
            ],
        },
    ].forEach(function(test) {
        test_merge({
            left: wrap_input({
                "file_format": "Standard",
                "records": test.left,
            }),
            right: wrap_input({
                "file_format": "Standard",
                "records": test.right,
            }),
            expected: {
                settings: {
                    "minimum_day_duration":  72000000,
                    "maximum_day_duration": 144000000,
                },
                "records": test.expected,
            },
        });
    });

    it(`summarises records correctly`, function() {

        var tests = [
            {
                records: [],
                expected: null,
            },
            {
                records: [{ start: 1 }],
                expected: null,
            },
            {
                records: [{ duration: 1 }],
                expected: wrap_expected({
                    average: 1,
                    mean: 1,
                    interquartile_mean: 1,
                    median: 1,
                    interquartile_range: 0,
                    durations: [ 1 ],
                    interquartile_durations: [ 1 ],
                    standard_deviation: 0,
                    interquartile_standard_deviation: 0,
                }),
            },
            {
                records: [{ duration: 1 }, { start: 1 }],
                expected: wrap_expected({
                    average: 1,
                    mean: 1,
                    interquartile_mean: 1,
                    median: 1,
                    interquartile_range: 0,
                    durations: [ 1, undefined ],
                    interquartile_durations: [ 1 ],
                    standard_deviation: 0,
                    interquartile_standard_deviation: 0,
                }),
            },
            {
                records: [1,1,1,1].map( d => ({ duration: d }) ),
                expected: wrap_expected({
                    average: 1,
                    mean: 1,
                    interquartile_mean: 1,
                    median: 1,
                    interquartile_range: 0,
                    durations: [ 1, 1, 1, 1 ],
                    interquartile_durations: [ 1, 1 ],
                    standard_deviation: 0,
                    interquartile_standard_deviation: 0,
                }),
            },
            {
                records: [-10,1,1,11].map( d => ({ duration: d }) ),
                expected: wrap_expected({
                    average: 0.75,
                    mean: 0.75,
                    interquartile_mean: 1,
                    median: 1,
                    interquartile_range: 0,
                    durations: [ -10, 1, 1, 11 ],
                    interquartile_durations: [ 1, 1 ],
                    standard_deviation: 7.428828979051813,
                    interquartile_standard_deviation: 0,
                }),
            },
        ];

        tests.forEach(function(test) {
            expect(
                new_sleep_diary(wrap_input({
                    "file_format": "Standard",
                    "records": test.records,
                })).summarise_records()
            ).toEqual(test.expected);
        });

    });

    it(`calculates the correct sleep/wake status`, function() {

        var tests = [
            {
                records: [],
                expected: "",
            },
            {
                records: [ { status: "awake" } ],
                expected: "awake",
            },
            {
                records: [ { status: "asleep" } ],
                expected: "asleep",
            },
            {
                records: [ { status: "awake" }, { status: "asleep" } ],
                expected: "asleep",
            },
            {
                records: [ { status: "asleep" }, { status: "awake" } ],
                expected: "awake",
            },
        ];

        tests.forEach(function(test) {
            expect(
                new_sleep_diary(wrap_input({
                    "file_format": "Standard",
                    "records": test.records,
                })).latest_sleep_status()
            ).toEqual(test.expected);
        });

    });

    it(`calculates the correct daily schedule`, function() {


        var tests = [
            {
                records: [],
                expected: {
                    wake: null,
                    sleep: null,
                },
            },

            {
                records: [
                    { is_primary_sleep: true, start: 1 },
                ],
                expected: {
                    wake: null,
                    sleep: {
                        average: 1,
                        mean: 1,
                        interquartile_mean: 1,
                        median: 1,
                        interquartile_range: 0,
                        durations: [ 1 ],
                        interquartile_durations: [ 1 ],
                        standard_deviation: 0,
                        interquartile_standard_deviation: 0,
                    },
                },
            },

            {
                records: [
                    { is_primary_sleep: true, end: 1 },
                ],
                expected: {
                    wake: {
                        average: 1,
                        mean: 1,
                        interquartile_mean: 1,
                        median: 1,
                        interquartile_range: 0,
                        durations: [ 1 ],
                        interquartile_durations: [ 1 ],
                        standard_deviation: 0,
                        interquartile_standard_deviation: 0,
                    },
                    sleep: null,
                },
            },

            {
                records: [
                    { is_primary_sleep: true, start: 1, end: 1 },
                ],
                expected: {
                    wake: {
                        average: 1,
                        mean: 1,
                        interquartile_mean: 1,
                        median: 1,
                        interquartile_range: 0,
                        durations: [ 1 ],
                        interquartile_durations: [ 1 ],
                        standard_deviation: 0,
                        interquartile_standard_deviation: 0,
                    },
                    sleep: {
                        average: 1,
                        mean: 1,
                        interquartile_mean: 1,
                        median: 1,
                        interquartile_range: 0,
                        durations: [ 1 ],
                        interquartile_durations: [ 1 ],
                        standard_deviation: 0,
                        interquartile_standard_deviation: 0,
                    },
                },
            },

            {
                records: [
                    { is_primary_sleep: true, start: 1, end: 24*60*60*1000-1 },
                ],
                expected: {
                    wake: {
                        average: 24*60*60*1000-1,
                        mean: 24*60*60*1000-1,
                        interquartile_mean: 24*60*60*1000-1,
                        median: 24*60*60*1000-1,
                        interquartile_range: 0,
                        durations: [ 24*60*60*1000-1 ],
                        interquartile_durations: [ 24*60*60*1000-1 ],
                        standard_deviation: 0,
                        interquartile_standard_deviation: 0,
                    },
                    sleep: {
                        average: 1,
                        mean: 1,
                        interquartile_mean: 1,
                        median: 1,
                        interquartile_range: 0,
                        durations: [ 1 ],
                        interquartile_durations: [ 1 ],
                        standard_deviation: 0,
                        interquartile_standard_deviation: 0,
                    },
                },
            },

            {
                records: [
                    { is_primary_sleep: true, start: 1 },
                    { is_primary_sleep: true, start: 3 },
                ],
                expected: {
                    wake: null,
                    sleep: {
                        average: 2,
                        mean: 2,
                        interquartile_mean: 3,
                        median: 3,
                        interquartile_range: 0,
                        durations: [ 1, 3 ],
                        interquartile_durations: [ 3 ],
                        standard_deviation: 1,
                        interquartile_standard_deviation: 0,
                    },
                },
            },

            {
                records: [
                    { is_primary_sleep: true, start: 24*60*60*1000-1 },
                    { is_primary_sleep: true, start: 1 },
                ],
                expected: {
                    wake: null,
                    sleep: {
                        average: 0,
                        mean: 0,
                        interquartile_mean: 1,
                        median: 1,
                        interquartile_range: 0,
                        durations: [ 1, 24*60*60*1000-1 ],
                        interquartile_durations: [ 24*60*60*1000-1 ],
                        standard_deviation: 1,
                        interquartile_standard_deviation: 0,
                    },
                },
            },

        ];

        tests.forEach(function(test) {
            expect(
                new_sleep_diary(wrap_input({
                    "file_format": "Standard",
                    "records": test.records,
                })).summarise_schedule()
            ).toEqual(test.expected);
        });

    });

});
register_roundtrip_modifier("Sleepmeter",function(our_diary,roundtripped_diary,other_format) {
    switch ( other_format.name ) {
    case "PleesTracker":
    case "SpreadsheetGraph":
    case "SpreadsheetTable":
        [our_diary,roundtripped_diary].forEach(function(diary) {
            diary.records.forEach( function(record) {
                /*
                 * Sleepmeter stores explicit timezones, durations and tags.
                 * These formats do not support those values.
                 * Therefore, roundtripping necessarily breaks the timezone.
                 */
                ["start_timezone","end_timezone","duration","tags"].forEach(function(key) {
                    delete record[key];
                });
            });
        });
    }
    switch ( other_format.name ) {
    case "PleesTracker":
        [our_diary,roundtripped_diary].forEach(function(diary) {
            diary.records.forEach( function(record) {
                /*
                 * Values not supported - and guessed incorrectly - in these formats
                 */
                ["comments"].forEach(function(key) {
                    delete record[key];
                });
            });
        });
    }
});

describe("Sleepmeter format", () => {

    var empty_diary = "wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n";

    test_parse({
        file_format: "Sleepmeter",
        "name": "simple example from README.md",
        "input": "wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        "expected": {
            "custom_aids": [],
            "custom_hindrances": [],
            "custom_tags": [],
            "records": [
                {
                    "end": 1289567640000,
                    "wake": {
                        "string": "\"2010-11-12 13:14+0000\"",
                        "year"  : 2010,
                        "month" : 11,
                        "day"   : 12,
                        "hour"  : 13,
                        "minute": 14,
                        "offset": 0
                    },
                    //"sleep timestamp": 1289574960000,
                    "sleep": {
                        "string": "\"2010-11-12 15:16+0000\"",
                        "year"  : 2010,
                        "month" : 11,
                        "day"   : 12,
                        "hour"  : 15,
                        "minute": 16,
                        "offset": 0
                    },
                    "start": 1289582280000,
                    "bedtime": {
                        "string": "\"2010-11-12 17:18+0000\"",
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 17,
                        "minute": 18,
                        "offset": 0
                    },
                    "duration": -7320000,
                    "holes": [],
                    "type": "NIGHT_SLEEP",
                    "dreams": [],
                    "aids": [],
                    "hindrances": [],
                    "tags": [],
                    "quality": 5,
                    "notes": ""
                }
            ]
        }
    });

    test_parse({
        file_format: "Sleepmeter",
        name: "complex example from README.md",
        input: "custom_aid_id,class,name\nCUSTOM_0002,RELAXATION,\"custom aid 2\"\nCUSTOM_0003,EXERTION,\"custom aid 3\"\nCUSTOM_0001,HERBAL,\"custom aid 1\"\n\ncustom_hindrance_id,class,name\nCUSTOM_0003,OBLIGATION,\"custom hindrance 3\"\nCUSTOM_0002,MENTAL,\"custom hindrance 2\"\nCUSTOM_0001,NOISE,\"custom hindrance 1\"\n\ncustom_tag_id,name\nCUSTOM_0001,\"custom tag 1\"\nCUSTOM_0002,\"custom tag 2\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2099-12-31 23:59+1000\",\"2099-12-31 23:58+1000\",\"2099-12-31 23:57+1000\",,NIGHT_SLEEP,NONE,CUSTOM_0001,CUSTOM_0001,CUSTOM_0001,5,\"\"\n\"1900-01-02 00:00+0000\",\"1900-01-01 00:02+0000\",\"1900-01-01 00:01+0000\",1-57|1436-1437,NAP,NONE,NONE,NONE,NONE,5,\"comment\"\n",
        expected: {
            "custom_aids": [
                {
                    "custom_aid_id": "CUSTOM_0002",
                    "class": "RELAXATION",
                    "name": "custom aid 2"
                },
                {
                    "custom_aid_id": "CUSTOM_0003",
                    "class": "EXERTION",
                    "name": "custom aid 3"
                },
                {
                    "custom_aid_id": "CUSTOM_0001",
                    "class": "HERBAL",
                    "name": "custom aid 1"
                }
            ],
            "custom_hindrances": [
                {
                    "custom_hindrance_id": "CUSTOM_0003",
                    "class": "OBLIGATION",
                    "name": "custom hindrance 3"
                },
                {
                    "custom_hindrance_id": "CUSTOM_0002",
                    "class": "MENTAL",
                    "name": "custom hindrance 2"
                },
                {
                    "custom_hindrance_id": "CUSTOM_0001",
                    "class": "NOISE",
                    "name": "custom hindrance 1"
                }
            ],
            "custom_tags": [
                {
                    "custom_tag_id": "CUSTOM_0001",
                    "name": "custom tag 1"
                },
                {
                    "custom_tag_id": "CUSTOM_0002",
                    "name": "custom tag 2"
                }
            ],
            "records": [
                {
                    "start": 4102408620000,
                    "end": 4102408740000,
                    "wake": {
                        "string": "\"2099-12-31 23:59+1000\"",
                        "year": 2099,
                        "month": 12,
                        "day": 31,
                        "hour": 23,
                        "minute": 59,
                        "offset": 600
                    },
                    //"sleep timestamp": 4102408680000,
                    "sleep": {
                        "string": "\"2099-12-31 23:58+1000\"",
                        "year": 2099,
                        "month": 12,
                        "day": 31,
                        "hour": 23,
                        "minute": 58,
                        "offset": 600
                    },
                    "bedtime": {
                        "string": "\"2099-12-31 23:57+1000\"",
                        "year": 2099,
                        "month": 12,
                        "day": 31,
                        "hour": 23,
                        "minute": 57,
                        "offset": 600
                    },
                    "duration": 60000,
                    "holes": [],
                    "type": "NIGHT_SLEEP",
                    "dreams": [],
                    "aids": [
                        "CUSTOM_0001"
                    ],
                    "hindrances": [
                        "CUSTOM_0001"
                    ],
                    "tags": [
                        "CUSTOM_0001"
                    ],
                    "quality": 5,
                    "notes": ""
                },
                {
                    "end": -2208902400000,
                    "wake": {
                        "string": "\"1900-01-02 00:00+0000\"",
                        "year": 1900,
                        "month": 1,
                        "day": 2,
                        "hour": 0,
                        "minute": 0,
                        "offset": 0
                    },
                    //"sleep timestamp": -2208988680000,
                    "sleep": {
                        "string": "\"1900-01-01 00:02+0000\"",
                        "year": 1900,
                        "month": 1,
                        "day": 1,
                        "hour": 0,
                        "minute": 2,
                        "offset": 0
                    },
                    "start": -2208988740000,
                    "bedtime": {
                        "string": "\"1900-01-01 00:01+0000\"",
                        "year": 1900,
                        "month": 1,
                        "day": 1,
                        "hour": 0,
                        "minute": 1,
                        "offset": 0
                    },
                    "duration": 86280057,
                    "holes": [
                        {
                            "wake": 1,
                            "sleep": 57
                        },
                        {
                            "wake": 1436,
                            "sleep": 1437
                        }
                    ],
                    "type": "NAP",
                    "dreams": [],
                    "aids": [],
                    "hindrances": [],
                    "tags": [],
                    "quality": 5,
                    "notes": "comment"
                }
            ]
        }
    });


    test_parse({
        file_format: "Sleepmeter",
        "name": "multi-line strings",
        "input": "custom_aid_id,class,name\nCUSTOM_0001,HERBAL,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\ncustom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\ncustom_tag_id,name\nCUSTOM_0001,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2099-12-31 23:57+1000\",\"2099-12-31 23:58+1000\",\"2099-12-31 23:59+1000\",,NIGHT_SLEEP,NONE,CUSTOM_0001,CUSTOM_0001,CUSTOM_0001,5,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n",
        "expected": {
            "custom_aids": [
                {
                    "custom_aid_id": "CUSTOM_0001",
                    "class": "HERBAL",
                    "name": ",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): "
                }
            ],
            "custom_hindrances": [
                {
                    "custom_hindrance_id": "CUSTOM_0001",
                    "class": "NOISE",
                    "name": ",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): "
                }
            ],
            "custom_tags": [
                {
                    "custom_tag_id": "CUSTOM_0001",
                    "name": ",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): "
                }
            ],
            "records": [
                {
                    "end": 4102408620000,
                    "wake": {
                        "string": "\"2099-12-31 23:57+1000\"",
                        "year": 2099,
                        "month": 12,
                        "day": 31,
                        "hour": 23,
                        "minute": 57,
                        "offset": 600
                    },
                    //"sleep timestamp": 4102408680000,
                    "sleep": {
                        "string": "\"2099-12-31 23:58+1000\"",
                        "year": 2099,
                        "month": 12,
                        "day": 31,
                        "hour": 23,
                        "minute": 58,
                        "offset": 600
                    },
                    "start": 4102408740000,
                    "bedtime": {
                        "string": "\"2099-12-31 23:59+1000\"",
                        "year": 2099,
                        "month": 12,
                        "day": 31,
                        "hour": 23,
                        "minute": 59,
                        "offset": 600
                    },
                    "duration": -60000,
                    "holes": [],
                    "type": "NIGHT_SLEEP",
                    "dreams": [],
                    "aids": [
                        "CUSTOM_0001"
                    ],
                    "hindrances": [
                        "CUSTOM_0001"
                    ],
                    "tags": [
                        "CUSTOM_0001"
                    ],
                    "quality": 5,
                    "notes": ",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): "
                }
            ]
        }
    });

    test_to({
        name: "output test",
        format: "output",
        input: "custom_aid_id,class,name\nCUSTOM_0001,HERBAL,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\ncustom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\ncustom_tag_id,name\nCUSTOM_0001,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2099-12-31 23:57+1000\",\"2099-12-31 23:58+1000\",\"2099-12-31 23:59+1000\",,NIGHT_SLEEP,NONE,CUSTOM_0001,CUSTOM_0001,CUSTOM_0001,5,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n",
        expected: "custom_aid_id,class,name\nCUSTOM_0001,HERBAL,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\ncustom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\ncustom_tag_id,name\nCUSTOM_0001,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2099-12-31 23:57+1000\",\"2099-12-31 23:58+1000\",\"2099-12-31 23:59+1000\",,NIGHT_SLEEP,NONE,CUSTOM_0001,CUSTOM_0001,CUSTOM_0001,5,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n"
    });

    test_merge({
        left: empty_diary,
        right: empty_diary,
        expected: {
            custom_aids: [],
            custom_hindrances: [],
            custom_tags: [],
            records: [],
        },
    });
    test_merge({
        left: "wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: empty_diary,
        expected: {
            custom_aids: [],
            custom_hindrances: [],
            custom_tags: [],
            records: [{
                end: 1289567640000,
                wake: {
                    string: '"2010-11-12 13:14+0000"',
                    year: 2010,
                    month: 11,
                    day: 12,
                    hour: 13,
                    minute: 14,
                    offset: 0
                },
                //"sleep timestamp": 1289574960000,
                sleep: {
                    string: '"2010-11-12 15:16+0000"',
                    year: 2010,
                    month: 11,
                    day: 12,
                    hour: 15,
                    minute: 16,
                    offset: 0
                },
                start: 1289582280000,
                bedtime: {
                    string: '"2010-11-12 17:18+0000"',
                    year: 2010,
                    month: 11,
                    day: 12,
                    hour: 17,
                    minute: 18,
                    offset: 0
                },
                holes: [],
                duration: -7320000,
                type: 'NIGHT_SLEEP',
                dreams: [],
                aids: [],
                hindrances: [],
                tags: [],
                quality:
                5, notes: ''
            }],
        },
    });
    test_merge({
        left: empty_diary,
        right: "wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            custom_aids: [],
            custom_hindrances: [],
            custom_tags: [],
            records: [{
                end: 1289567640000,
                wake: {
                    string: '"2010-11-12 13:14+0000"',
                    year: 2010,
                    month: 11,
                    day: 12,
                    hour: 13,
                    minute: 14,
                    offset: 0
                },
                //"sleep timestamp": 1289574960000,
                sleep: {
                    string: '"2010-11-12 15:16+0000"',
                    year: 2010,
                    month: 11,
                    day: 12,
                    hour: 15,
                    minute: 16,
                    offset: 0
                },
                start: 1289582280000,
                bedtime: {
                    string: '"2010-11-12 17:18+0000"',
                    year: 2010,
                    month: 11,
                    day: 12,
                    hour: 17,
                    minute: 18,
                    offset: 0
                },
                duration: -7320000,
                holes: [],
                type: 'NIGHT_SLEEP',
                dreams: [],
                aids: [],
                hindrances: [],
                tags: [],
                quality:
                5, notes: ''
            }],
        },
    });
    test_merge({
        left: "wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: "wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            custom_aids: [],
            custom_hindrances: [],
            custom_tags: [],
            records: [{
                end: 1289567640000,
                wake: {
                    string: '"2010-11-12 13:14+0000"',
                    year: 2010,
                    month: 11,
                    day: 12,
                    hour: 13,
                    minute: 14,
                    offset: 0
                },
                //"sleep timestamp": 1289574960000,
                sleep: {
                    string: '"2010-11-12 15:16+0000"',
                    year: 2010,
                    month: 11,
                    day: 12,
                    hour: 15,
                    minute: 16,
                    offset: 0
                },
                start: 1289582280000,
                bedtime: {
                    string: '"2010-11-12 17:18+0000"',
                    year: 2010,
                    month: 11,
                    day: 12,
                    hour: 17,
                    minute: 18,
                    offset: 0
                },
                duration: -7320000,
                holes: [],
                type: 'NIGHT_SLEEP',
                dreams: [],
                aids: [],
                hindrances: [],
                tags: [],
                quality:
                5, notes: ''
            }],
        },
    });
    test_merge({
        left: "wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: "wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            custom_aids: [],
            custom_hindrances: [],
            custom_tags: [],
            records: [
                {
                    end: 1289567700000,
                    wake: {
                        string: '"2010-11-12 13:15+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 13,
                        minute: 15,
                        offset: 0
                    },
                    //"sleep timestamp": 1289574960000,
                    sleep: {
                        string: '"2010-11-12 15:16+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 15,
                        minute: 16,
                        offset: 0
                    },
                    start: 1289582280000,
                    bedtime: {
                        string: '"2010-11-12 17:18+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 17,
                        minute: 18,
                        offset: 0
                    },
                    duration: -7260000,
                    holes: [],
                    type: 'NIGHT_SLEEP',
                    dreams: [],
                    aids: [],
                    hindrances: [],
                    tags: [],
                    quality: 5,
                    notes: ''
                },
                {
                    end: 1289567640000,
                    wake: {
                        string: '"2010-11-12 13:14+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 13,
                        minute: 14,
                        offset: 0
                    },
                    //"sleep timestamp": 1289574960000,
                    sleep: {
                        string: '"2010-11-12 15:16+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 15,
                        minute: 16,
                        offset: 0
                    },
                    start: 1289582280000,
                    bedtime: {
                        string: '"2010-11-12 17:18+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 17,
                        minute: 18,
                        offset: 0
                    },
                    duration: -7320000,
                    holes: [],
                    type: 'NIGHT_SLEEP',
                    dreams: [],
                    aids: [],
                    hindrances: [],
                    tags: [],
                    quality: 5,
                    notes: ''
                }
            ],
        },
    });

    test_merge({
        left: "custom_aid_id,class,name\nCUSTOM_0001,RELAXATION,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: "custom_aid_id,class,name\nCUSTOM_0001,RELAXATION,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            custom_aids: [
                { custom_aid_id: 'CUSTOM_0001', class: 'RELAXATION', name: 'value 1' },
            ],
            custom_hindrances: [],
            custom_tags: [],
            records: [
                {
                    end: 1289567700000,
                    wake: {
                        string: '"2010-11-12 13:15+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 13,
                        minute: 15,
                        offset: 0
                    },
                    //"sleep timestamp": 1289574960000,
                    sleep: {
                        string: '"2010-11-12 15:16+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 15,
                        minute: 16,
                        offset: 0
                    },
                    start: 1289582280000,
                    bedtime: {
                        string: '"2010-11-12 17:18+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 17,
                        minute: 18,
                        offset: 0
                    },
                    duration: -7260000,
                    holes: [],
                    type: 'NIGHT_SLEEP',
                    dreams: [],
                    aids: [],
                    hindrances: [],
                    tags: [],
                    quality: 5,
                    notes: ''
                },
                {
                    end: 1289567640000,
                    wake: {
                        string: '"2010-11-12 13:14+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 13,
                        minute: 14,
                        offset: 0
                    },
                    //"sleep timestamp": 1289574960000,
                    sleep: {
                        string: '"2010-11-12 15:16+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 15,
                        minute: 16,
                        offset: 0
                    },
                    start: 1289582280000,
                    bedtime: {
                        string: '"2010-11-12 17:18+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 17,
                        minute: 18,
                        offset: 0
                    },
                    duration: -7320000,
                    holes: [],
                    type: 'NIGHT_SLEEP',
                    dreams: [],
                    aids: [],
                    hindrances: [],
                    tags: [],
                    quality: 5,
                    notes: ''
                }
            ],
        },
    });
    test_merge({
        left: "custom_aid_id,class,name\nCUSTOM_0001,RELAXATION,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: "custom_aid_id,class,name\nCUSTOM_0001,RELAXATION,\"value 2\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            custom_aids: [
                { custom_aid_id: 'CUSTOM_0001', class: 'RELAXATION', name: 'value 1' },
                { custom_aid_id: 'CUSTOM_0002', class: 'RELAXATION', name: 'value 2' },
            ],
            custom_hindrances: [],
            custom_tags: [],
            records: [
                {
                    end: 1289567700000,
                    wake: {
                        string: '"2010-11-12 13:15+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 13,
                        minute: 15,
                        offset: 0
                    },
                    //"sleep timestamp": 1289574960000,
                    sleep: {
                        string: '"2010-11-12 15:16+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 15,
                        minute: 16,
                        offset: 0
                    },
                    start: 1289582280000,
                    bedtime: {
                        string: '"2010-11-12 17:18+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 17,
                        minute: 18,
                        offset: 0
                    },
                    duration: -7260000,
                    holes: [],
                    type: 'NIGHT_SLEEP',
                    dreams: [],
                    aids: [],
                    hindrances: [],
                    tags: [],
                    quality: 5,
                    notes: ''
                },
                {
                    end: 1289567640000,
                    wake: {
                        string: '"2010-11-12 13:14+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 13,
                        minute: 14,
                        offset: 0
                    },
                    //"sleep timestamp": 1289574960000,
                    sleep: {
                        string: '"2010-11-12 15:16+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 15,
                        minute: 16,
                        offset: 0
                    },
                    start: 1289582280000,
                    bedtime: {
                        string: '"2010-11-12 17:18+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 17,
                        minute: 18,
                        offset: 0
                    },
                    duration: -7320000,
                    holes: [],
                    type: 'NIGHT_SLEEP',
                    dreams: [],
                    aids: [],
                    hindrances: [],
                    tags: [],
                    quality: 5,
                    notes: ''
                }
            ],
        },
    });

    test_merge({
        left: "custom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: "custom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            custom_aids: [],
            custom_hindrances: [
                { custom_hindrance_id: 'CUSTOM_0001', class: 'NOISE', name: 'value 1' },
            ],
            custom_tags: [],
            records: [
                {
                    end: 1289567700000,
                    wake: {
                        string: '"2010-11-12 13:15+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 13,
                        minute: 15,
                        offset: 0
                    },
                    //"sleep timestamp": 1289574960000,
                    sleep: {
                        string: '"2010-11-12 15:16+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 15,
                        minute: 16,
                        offset: 0
                    },
                    start: 1289582280000,
                    bedtime: {
                        string: '"2010-11-12 17:18+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 17,
                        minute: 18,
                        offset: 0
                    },
                    duration: -7260000,
                    holes: [],
                    type: 'NIGHT_SLEEP',
                    dreams: [],
                    aids: [],
                    hindrances: [],
                    tags: [],
                    quality: 5,
                    notes: ''
                },
                {
                    end: 1289567640000,
                    wake: {
                        string: '"2010-11-12 13:14+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 13,
                        minute: 14,
                        offset: 0
                    },
                    //"sleep timestamp": 1289574960000,
                    sleep: {
                        string: '"2010-11-12 15:16+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 15,
                        minute: 16,
                        offset: 0
                    },
                    start: 1289582280000,
                    bedtime: {
                        string: '"2010-11-12 17:18+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 17,
                        minute: 18,
                        offset: 0
                    },
                    duration: -7320000,
                    holes: [],
                    type: 'NIGHT_SLEEP',
                    dreams: [],
                    aids: [],
                    hindrances: [],
                    tags: [],
                    quality: 5,
                    notes: ''
                }
            ],
        },
    });
    test_merge({
        left: "custom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: "custom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\"value 2\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            custom_aids: [],
            custom_hindrances: [
                { custom_hindrance_id: 'CUSTOM_0001', class: 'NOISE', name: 'value 1' },
                { custom_hindrance_id: 'CUSTOM_0002', class: 'NOISE', name: 'value 2' },
            ],
            custom_tags: [],
            records: [
                {
                    end: 1289567700000,
                    wake: {
                        string: '"2010-11-12 13:15+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 13,
                        minute: 15,
                        offset: 0
                    },
                    //"sleep timestamp": 1289574960000,
                    sleep: {
                        string: '"2010-11-12 15:16+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 15,
                        minute: 16,
                        offset: 0
                    },
                    start: 1289582280000,
                    bedtime: {
                        string: '"2010-11-12 17:18+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 17,
                        minute: 18,
                        offset: 0
                    },
                    duration: -7260000,
                    holes: [],
                    type: 'NIGHT_SLEEP',
                    dreams: [],
                    aids: [],
                    hindrances: [],
                    tags: [],
                    quality: 5,
                    notes: ''
                },
                {
                    end: 1289567640000,
                    wake: {
                        string: '"2010-11-12 13:14+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 13,
                        minute: 14,
                        offset: 0
                    },
                    //"sleep timestamp": 1289574960000,
                    sleep: {
                        string: '"2010-11-12 15:16+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 15,
                        minute: 16,
                        offset: 0
                    },
                    start: 1289582280000,
                    bedtime: {
                        string: '"2010-11-12 17:18+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 17,
                        minute: 18,
                        offset: 0
                    },
                    duration: -7320000,
                    holes: [],
                    type: 'NIGHT_SLEEP',
                    dreams: [],
                    aids: [],
                    hindrances: [],
                    tags: [],
                    quality: 5,
                    notes: ''
                }
            ],
        },
    });

    test_merge({
        left: "custom_tag_id,name\nCUSTOM_0001,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: "custom_tag_id,name\nCUSTOM_0001,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            custom_aids: [],
            custom_hindrances: [],
            custom_tags: [
                { custom_tag_id: 'CUSTOM_0001', name: 'value 1' },
            ],
            records: [
                {
                    end: 1289567700000,
                    wake: {
                        string: '"2010-11-12 13:15+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 13,
                        minute: 15,
                        offset: 0
                    },
                    //"sleep timestamp": 1289574960000,
                    sleep: {
                        string: '"2010-11-12 15:16+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 15,
                        minute: 16,
                        offset: 0
                    },
                    start: 1289582280000,
                    bedtime: {
                        string: '"2010-11-12 17:18+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 17,
                        minute: 18,
                        offset: 0
                    },
                    duration: -7260000,
                    holes: [],
                    type: 'NIGHT_SLEEP',
                    dreams: [],
                    aids: [],
                    hindrances: [],
                    tags: [],
                    quality: 5,
                    notes: ''
                },
                {
                    end: 1289567640000,
                    wake: {
                        string: '"2010-11-12 13:14+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 13,
                        minute: 14,
                        offset: 0
                    },
                    //"sleep timestamp": 1289574960000,
                    sleep: {
                        string: '"2010-11-12 15:16+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 15,
                        minute: 16,
                        offset: 0
                    },
                    start: 1289582280000,
                    bedtime: {
                        string: '"2010-11-12 17:18+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 17,
                        minute: 18,
                        offset: 0
                    },
                    duration: -7320000,
                    holes: [],
                    type: 'NIGHT_SLEEP',
                    dreams: [],
                    aids: [],
                    hindrances: [],
                    tags: [],
                    quality: 5,
                    notes: ''
                }
            ],
        },
    });
    test_merge({
        left: "custom_tag_id,name\nCUSTOM_0001,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: "custom_tag_id,name\nCUSTOM_0001,\"value 2\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            custom_aids: [],
            custom_hindrances: [],
            custom_tags: [
                { custom_tag_id: 'CUSTOM_0001', name: 'value 1' },
                { custom_tag_id: 'CUSTOM_0002', name: 'value 2' },
            ],
            records: [
                {
                    end: 1289567700000,
                    wake: {
                        string: '"2010-11-12 13:15+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 13,
                        minute: 15,
                        offset: 0
                    },
                    //"sleep timestamp": 1289574960000,
                    sleep: {
                        string: '"2010-11-12 15:16+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 15,
                        minute: 16,
                        offset: 0
                    },
                    start: 1289582280000,
                    bedtime: {
                        string: '"2010-11-12 17:18+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 17,
                        minute: 18,
                        offset: 0
                    },
                    duration: -7260000,
                    holes: [],
                    type: 'NIGHT_SLEEP',
                    dreams: [],
                    aids: [],
                    hindrances: [],
                    tags: [],
                    quality: 5,
                    notes: ''
                },
                {
                    end: 1289567640000,
                    wake: {
                        string: '"2010-11-12 13:14+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 13,
                        minute: 14,
                        offset: 0
                    },
                    //"sleep timestamp": 1289574960000,
                    sleep: {
                        string: '"2010-11-12 15:16+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 15,
                        minute: 16,
                        offset: 0
                    },
                    start: 1289582280000,
                    bedtime: {
                        string: '"2010-11-12 17:18+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 17,
                        minute: 18,
                        offset: 0
                    },
                    duration: -7320000,
                    holes: [],
                    type: 'NIGHT_SLEEP',
                    dreams: [],
                    aids: [],
                    hindrances: [],
                    tags: [],
                    quality: 5,
                    notes: ''
                }
            ],
        },
    });

    test_merge({
        left: "custom_aid_id,class,name\nCUSTOM_0001,RELAXATION,\"value 1\"\n\ncustom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\"value 1\"\n\ncustom_tag_id,name\nCUSTOM_0001,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,CUSTOM_0001,CUSTOM_0001,CUSTOM_0001,5,\"\"\n",
        right: "custom_aid_id,class,name\nCUSTOM_0001,RELAXATION,\"value 2\"\n\ncustom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\"value 2\"\n\ncustom_tag_id,name\nCUSTOM_0001,\"value 2\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,CUSTOM_0001,CUSTOM_0001,CUSTOM_0001,5,\"\"\n",
        expected: {
            custom_aids: [
                { custom_aid_id: 'CUSTOM_0001', class: 'RELAXATION', name: 'value 1' },
                { custom_aid_id: 'CUSTOM_0002', class: 'RELAXATION', name: 'value 2' },
            ],
            custom_hindrances: [
                { custom_hindrance_id: 'CUSTOM_0001', class: 'NOISE', name: 'value 1' },
                { custom_hindrance_id: 'CUSTOM_0002', class: 'NOISE', name: 'value 2' },
            ],
            custom_tags: [
                { custom_tag_id: 'CUSTOM_0001', name: 'value 1' },
                { custom_tag_id: 'CUSTOM_0002', name: 'value 2' },
            ],
            records: [
                {
                    end: 1289567700000,
                    wake: {
                        string: '"2010-11-12 13:15+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 13,
                        minute: 15,
                        offset: 0
                    },
                    //"sleep timestamp": 1289574960000,
                    sleep: {
                        string: '"2010-11-12 15:16+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 15,
                        minute: 16,
                        offset: 0
                    },
                    start: 1289582280000,
                    bedtime: {
                        string: '"2010-11-12 17:18+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 17,
                        minute: 18,
                        offset: 0
                    },
                    duration: -7260000,
                    holes: [],
                    type: 'NIGHT_SLEEP',
                    dreams: [],
                    aids: [ "CUSTOM_0001" ],
                    hindrances: [ "CUSTOM_0001" ],
                    tags: [ "CUSTOM_0001" ],
                    quality: 5,
                    notes: ''
                },
                {
                    end: 1289567640000,
                    wake: {
                        string: '"2010-11-12 13:14+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 13,
                        minute: 14,
                        offset: 0
                    },
                    //"sleep timestamp": 1289574960000,
                    sleep: {
                        string: '"2010-11-12 15:16+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 15,
                        minute: 16,
                        offset: 0
                    },
                    start: 1289582280000,
                    bedtime: {
                        string: '"2010-11-12 17:18+0000"',
                        year: 2010,
                        month: 11,
                        day: 12,
                        hour: 17,
                        minute: 18,
                        offset: 0
                    },
                    duration: -7320000,
                    holes: [],
                    type: 'NIGHT_SLEEP',
                    dreams: [],
                    aids: [ "CUSTOM_0002" ],
                    hindrances: [ "CUSTOM_0002" ],
                    tags: [ "CUSTOM_0002" ],
                    quality: 5,
                    notes: ''
                }
            ],
        },
    });

    test_to({
        name: "empty diary to Standard",
        format: "Standard",
        input: empty_diary,
        expected: [],
    });

    test_to({
        name: "non-empty diary to Standard",
        format: "Standard",
        input: "custom_aid_id,class,name\nCUSTOM_0001,RELAXATION,\"value 1\"\n\ncustom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\"value 2\"\n\ncustom_tag_id,name\nCUSTOM_0001,\"value 3\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 17:18+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 13:14+0000\",,NIGHT_SLEEP,NONE,CUSTOM_0001,CUSTOM_0001,CUSTOM_0001,5,\"\"\n",
        expected: [
            {
                status: 'in bed',
                start: 1289567640000,
                end: 1289574960000,
                start_timezone: 'Etc/GMT',
                  end_timezone: 'Etc/GMT',
                duration: 7320000,
                start_of_new_day: false,
                day_number: 0,
            },
            {
                status: 'asleep',
                start: 1289574960000,
                end  : 1289582280000,
                start_timezone: 'Etc/GMT',
                  end_timezone: 'Etc/GMT',
                tags: [ 'value 1', 'value 2', 'value 3' ],
                is_primary_sleep: true,
                duration: 7320000,
                start_of_new_day: true,
                day_number: 2,
            },
        ],
    });

    test_from_standard({
        name: 'empty diary',
        format: 'Sleepmeter',
        input: [],
        expected: empty_diary,
    });

    test_from_standard({
        name: 'non-empty diary',
        format: 'Sleepmeter',
        input: [
            {
                status: 'asleep',
                start: 1289574960000,
                end  : 1289567700000,
                tags: [ 'SOUND_MACHINE', 'BUNKMATE_SNORING', 'OUT_OF_TOWN' ],
                comments: [],
                is_primary_sleep: true,
                duration: -7260000,
                start_of_new_day: true,
                day_number: 2,
            },
            {
                status: 'in bed',
                start: 1289582280000,
                end: 1289574960000,
                duration: -7320000,
                start_of_new_day: false,
                day_number: 2
            },
        ],
        expected:
        "wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n" +
        "\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 15:16+0000\",,NIGHT_SLEEP,NONE,SOUND_MACHINE,BUNKMATE_SNORING,OUT_OF_TOWN,5,\"\"\n"
    });

});
register_roundtrip_modifier("SleepAsAndroid",function(our_diary,roundtripped_diary,other_format) {
    switch ( other_format.name ) {
    case "PleesTracker":
        [our_diary,roundtripped_diary].forEach(function(diary) {
            diary.records.forEach( function(record) {
                /*
                 * Sleep As Android requires exactly one string comment.
                 * PleesTracker does not support comments.
                 * Therefore, roundtripping necessarily breaks comments.
                 */
                ["comments"].forEach(function(key) {
                    delete record[key];
                });
            });
        });
    case "SpreadsheetGraph":
    case "SpreadsheetTable":
    case "Sleepmeter":
        [our_diary,roundtripped_diary].forEach(function(diary) {
            diary.records.forEach( function(record) {
                /*
                 * Sleep As Android requires timezones.
                 * These formats do not support timezones.
                 * Therefore, roundtripping necessarily breaks the timezone.
                 */
                ["start_timezone","end_timezone"].forEach(function(key) {
                    delete record[key];
                });
            });
        });
    }
});

describe("SleepAsAndroid format", () => {

    function wrap_input(contents) {
        return {
            "file_format": () => "archive",
            "contents": contents,
        }
    }

    var empty_diary = wrap_input({
        "alarms.json": "[]",
        "prefs.xml": "<?xml version='1.0' encoding='utf-8' standalone='yes' ?>\n<map></map>",
        "sleep-export.csv": "",
    });

    var alarms_json_input = "[{}]";
    var alarms_json_expected = [{}];

    var prefs_xml_input = (
        "<?xml version='1.0' encoding='utf-8' standalone='yes' ?>\n<map>\n" +
            '<boolean name="bool_value" value="false" />\n' +
            '<string name="string_value"><![CDATA[my_string]]></string>\n' +
            '<long name="long_value" value="' + Math.pow(2,31) + '" />\n' +
            '<int name="int_value" value="0" />\n' +
            "</map>\n"
    );
    var prefs_xml_expected = {
        bool_value: false,
        string_value: "my_string",
        long_value: Math.pow(2,31),
        int_value: 0,
    };


    test_parse({
        file_format: "SleepAsAndroid",
        name: "empty diary",
        input: empty_diary,
        spreadsheetify: 'disable',
        expected: {
            prefs: {},
            alarms: [],
            records: [],
        }
    });

    test_parse({
        file_format: "SleepAsAndroid",
        name: "string example",
        input:
            "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
            '"1044072300000","Europe/London","01. 02. 2003 4:05","01. 02. 2003 5:06","01. 02. 2003 6:07","1.017","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        expected: {
            alarms: [],
            prefs: {},
            records: [
                {

                    start: 1044072300000,
                    end: 1044075961200,
                    alarm: 1044079620000,
                    duration: 3661200,

                    Id: '1044072300000',
                    Tz: 'Europe/London',
                    From: {
                        string: '"01. 02. 2003 4:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    To: {
                        string: '"01. 02. 2003 5:06"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 5,
                        minute: 6
                    },
                    Sched: {
                        string: '"01. 02. 2003 6:07"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 6,
                        minute: 7
                    },

                    Hours: 1.017,
                    Rating: 0,
                    Comment: { string: 'Comment text', tags: [], notags: 'Comment text' },
                    Framerate: '10000',
                    Snore: null,
                    Noise: null,
                    Cycles: null,
                    DeepSleep: null,
                    LenAdjust: 0,
                    Geo: '',
                    times: [],
                    events: []

                }
            ],
        }
    });

    test_parse({
        file_format: "SleepAsAndroid",
        name: "object example",
        input: wrap_input({
            "alarms.json": alarms_json_input,
            "prefs.xml": prefs_xml_input,
            "sleep-export.csv":
            "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
            '"1044072300000","Europe/London","01. 02. 2003 4:05","01. 02. 2003 5:06","01. 02. 2003 6:07","1.017","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
            ,
        }),
        expected: {
            alarms: alarms_json_expected,
            prefs: prefs_xml_expected,
            records: [
                {

                    start: 1044072300000,
                    end: 1044075961200,
                    alarm: 1044079620000,
                    duration: 3661200,

                    Id: '1044072300000',
                    Tz: 'Europe/London',
                    From: {
                        string: '"01. 02. 2003 4:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    To: {
                        string: '"01. 02. 2003 5:06"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 5,
                        minute: 6
                    },
                    Sched: {
                        string: '"01. 02. 2003 6:07"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 6,
                        minute: 7
                    },

                    Hours: 1.017,
                    Rating: 0,
                    Comment: { string: 'Comment text', tags: [], notags: 'Comment text' },
                    Framerate: '10000',
                    Snore: null,
                    Noise: null,
                    Cycles: null,
                    DeepSleep: null,
                    LenAdjust: 0,
                    Geo: '',
                    times: [],
                    events: []

                }
            ],
        }
    });

    test_parse({
        file_format: "SleepAsAndroid",
        name: "string escapes",
        input:
            "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
            '"1044072300000","Europe/London","01. 02. 2003 4:05","01. 02. 2003 5:06","01. 02. 2003 6:07","1.017","0.0","""Comment \\n ""text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        expected: {
            alarms: [],
            prefs: {},
            records: [
                {

                    start: 1044072300000,
                    end: 1044075961200,
                    alarm: 1044079620000,
                    duration: 3661200,

                    Id: '1044072300000',
                    Tz: 'Europe/London',
                    From: {
                        string: '"01. 02. 2003 4:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    To: {
                        string: '"01. 02. 2003 5:06"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 5,
                        minute: 6
                    },
                    Sched: {
                        string: '"01. 02. 2003 6:07"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 6,
                        minute: 7
                    },

                    Hours: 1.017,
                    Rating: 0,
                    Comment: { string: "\"Comment\n\"text", tags: [], notags: "\"Comment\n\"text" },
                    Framerate: '10000',
                    Snore: null,
                    Noise: null,
                    Cycles: null,
                    DeepSleep: null,
                    LenAdjust: 0,
                    Geo: '',
                    times: [],
                    events: []

                }
            ],
        }
    });

    test_to({
        name: "output test",
        format: "output",
        input: "custom_aid_id,class,name\nCUSTOM_0001,HERBAL,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\ncustom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\ncustom_tag_id,name\nCUSTOM_0001,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2099-12-31 23:57+1000\",\"2099-12-31 23:58+1000\",\"2099-12-31 23:59+1000\",,NIGHT_SLEEP,NONE,CUSTOM_0001,CUSTOM_0001,CUSTOM_0001,5,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n",
        expected: "custom_aid_id,class,name\nCUSTOM_0001,HERBAL,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\ncustom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\ncustom_tag_id,name\nCUSTOM_0001,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2099-12-31 23:57+1000\",\"2099-12-31 23:58+1000\",\"2099-12-31 23:59+1000\",,NIGHT_SLEEP,NONE,CUSTOM_0001,CUSTOM_0001,CUSTOM_0001,5,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n"
    });

    test_to({
        name: "output test",
        format: "output",
        input:
            "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
            '"1044072300000","Etc/GMT","01. 02. 2003 4:05","01. 02. 2003 5:06","01. 02. 2003 6:07","1.017","0.0","""Comment \\n ""text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        expected: {
            "prefs.xml": "<?xml version='1.0' encoding='utf-8' standalone='yes' ?>\n<map>\n</map>\n",
            "alarms.json": "[]",
            "sleep-export.csv": "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
            '"1044072300000","Etc/GMT","01. 02. 2003 4:05","01. 02. 2003 5:06","01. 02. 2003 6:07","1.017","0","""Comment \\n ""text","10000","-1","-1.0","-1","-1.0","0",""\n',
        },
    });

    test_to({
        name: "standard format test 1",
        format: "Standard",
        input:
        "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
       '"1044072300000","Europe/London","01. 02. 2003 4:05","01. 02. 2003 5:06","01. 02. 2003 6:07","1.017","0.0","""Comment \\n ""text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        expected: [
            {
                status: 'asleep',
                start: 1044072300000,
                  end: 1044075961200,
                start_timezone: "Europe/London",
                  end_timezone: "Europe/London",
                comments: [ '"Comment\n"text' ],
                duration: 3661200,
                start_of_new_day: true,
                day_number: 2,
                is_primary_sleep: true
            }
        ],
    });

    test_from_standard({
        name: "standard format test 2",
        format: "SleepAsAndroid",
        input: [
            {
                status: 'asleep',
                start: 1044072300000,
                end: 1044075961200,
                comments: [ '"Comment\n"text' ],
                duration: 3661200,
                start_of_new_day: true,
                day_number: 1,
                is_primary_sleep: true
            }
        ],
        expected:
        "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
       '"1044072300000","Etc/GMT","01. 02. 2003 4:05","01. 02. 2003 5:06","01. 02. 2003 5:06","1.017","2.5","""Comment \\n ""text","10000","-1","-1.0","-1","-1.0","-1.0",""\n'
        ,
    });


    test_merge({
        left: empty_diary,
        right: empty_diary,
        expected: {
            prefs: {},
            alarms: [],
            records: [],
        },
    });

    test_merge({
        left: empty_diary,
        right:
        "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
        '"1044072300000","Europe/London","01. 02. 2003 4:05","01. 02. 2003 5:06","01. 02. 2003 6:07","1.017","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        expected: {
            prefs: {},
            alarms: [],
            records: [
                {
                    Id: '1044072300000',
                    Tz: 'Europe/London',
                    From: {
                        string: '"01. 02. 2003 4:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    To: {
                        string: '"01. 02. 2003 5:06"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 5,
                        minute: 6
                    },
                    Sched: {
                        string: '"01. 02. 2003 6:07"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 6,
                        minute: 7
                    },
                    Hours: 1.017,
                    Rating: 0,
                    Comment: {
                        string: 'Comment text',
                        tags: [],
                        notags: 'Comment text'
                    },
                    Framerate: '10000',
                    Snore: null,
                    Noise: null,
                    Cycles: null,
                    DeepSleep: null,
                    LenAdjust: 0,
                    Geo: '',
                    times: [],
                    events: [],
                    start: 1044072300000,
                    end: 1044075961200,
                    duration: 3661200,
                    alarm: 1044079620000
                }
            ],
        },
    });

    test_merge({
        left:
        "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
        '"1044072300000","Europe/London","01. 02. 2003 4:05","01. 02. 2003 5:06","01. 02. 2003 6:07","1.017","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        right: empty_diary,
        expected: {
            prefs: {},
            alarms: [],
            records: [
                {
                    Id: '1044072300000',
                    Tz: 'Europe/London',
                    From: {
                        string: '"01. 02. 2003 4:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    To: {
                        string: '"01. 02. 2003 5:06"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 5,
                        minute: 6
                    },
                    Sched: {
                        string: '"01. 02. 2003 6:07"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 6,
                        minute: 7
                    },
                    Hours: 1.017,
                    Rating: 0,
                    Comment: {
                        string: 'Comment text',
                        tags: [],
                        notags: 'Comment text'
                    },
                    Framerate: '10000',
                    Snore: null,
                    Noise: null,
                    Cycles: null,
                    DeepSleep: null,
                    LenAdjust: 0,
                    Geo: '',
                    times: [],
                    events: [],
                    start: 1044072300000,
                    end: 1044075961200,
                    duration: 3661200,
                    alarm: 1044079620000
                }
            ],
        },
    });

    test_merge({
        left:
        "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
        '"1044072300000","Europe/London","01. 02. 2003 4:05","01. 02. 2003 5:06","01. 02. 2003 6:07","1.017","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        right:
        "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
        '"1044072300000","Europe/London","01. 02. 2003 4:05","01. 02. 2003 5:06","01. 02. 2003 6:07","1.017","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        expected: {
            prefs: {},
            alarms: [],
            records: [
                {
                    Id: '1044072300000',
                    Tz: 'Europe/London',
                    From: {
                        string: '"01. 02. 2003 4:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    To: {
                        string: '"01. 02. 2003 5:06"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 5,
                        minute: 6
                    },
                    Sched: {
                        string: '"01. 02. 2003 6:07"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 6,
                        minute: 7
                    },
                    Hours: 1.017,
                    Rating: 0,
                    Comment: {
                        string: 'Comment text',
                        tags: [],
                        notags: 'Comment text'
                    },
                    Framerate: '10000',
                    Snore: null,
                    Noise: null,
                    Cycles: null,
                    DeepSleep: null,
                    LenAdjust: 0,
                    Geo: '',
                    times: [],
                    events: [],
                    start: 1044072300000,
                    end: 1044075961200,
                    duration: 3661200,
                    alarm: 1044079620000
                }
            ],
        },
    });

    test_merge({
        left:
        "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
        '"123456788","Europe/London","01. 02. 2003 4:05","01. 02. 2003 5:06","01. 02. 2003 6:07","1.017","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        right:
        "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
        '"1044072300000","Europe/London","01. 02. 2003 4:05","01. 02. 2003 5:06","01. 02. 2003 6:07","1.017","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        expected: {
            prefs: {},
            alarms: [],
            records: [
                {
                    Id: '123456788',
                    Tz: 'Europe/London',
                    From: {
                        string: '"01. 02. 2003 4:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    To: {
                        string: '"01. 02. 2003 5:06"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 5,
                        minute: 6
                    },
                    Sched: {
                        string: '"01. 02. 2003 6:07"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 6,
                        minute: 7
                    },
                    Hours: 1.017,
                    Rating: 0,
                    Comment: {
                        string: 'Comment text',
                        tags: [],
                        notags: 'Comment text'
                    },
                    Framerate: '10000',
                    Snore: null,
                    Noise: null,
                    Cycles: null,
                    DeepSleep: null,
                    LenAdjust: 0,
                    Geo: '',
                    times: [],
                    events: [],
                    start: 123456788,
                    end: 127117988,
                    duration: 3661200,
                    alarm: 130800000
                },
                {
                    Id: '1044072300000',
                    Tz: 'Europe/London',
                    From: {
                        string: '"01. 02. 2003 4:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    To: {
                        string: '"01. 02. 2003 5:06"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 5,
                        minute: 6
                    },
                    Sched: {
                        string: '"01. 02. 2003 6:07"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 6,
                        minute: 7
                    },
                    Hours: 1.017,
                    Rating: 0,
                    Comment: {
                        string: 'Comment text',
                        tags: [],
                        notags: 'Comment text'
                    },
                    Framerate: '10000',
                    Snore: null,
                    Noise: null,
                    Cycles: null,
                    DeepSleep: null,
                    LenAdjust: 0,
                    Geo: '',
                    times: [],
                    events: [],
                    start: 1044072300000,
                    end: 1044075961200,
                    duration: 3661200,
                    alarm: 1044079620000
                }
            ],
        },
    });

});
describe("PleesTracker format", () => {

    var empty_diary = "sid,start,stop,rating\n";

    var normal_diary = (
        "sid,start,stop,rating\n" +
        "1,1608323029380,1608323057541,0\n" +
        "2,1608323062156,1608323063678,5\n" +
        "3,1608323066387,1608323067794,3\n"
    );

    var normal_records = [
        {
            "sid"     : 1,
            "start"   : 1608323029380,
            "stop"    : 1608323057541,
            "rating"  : 0,
        },
        {
            "sid"     : 2,
            "start"   : 1608323062156,
            "stop"    : 1608323063678,
            "rating"  : 5,
        },
        {
            "sid"     : 3,
            "start"   : 1608323066387,
            "stop"    : 1608323067794,
            "rating"  : 3,
        },
    ];

    test_parse({
        file_format: "PleesTracker",
        name: "empty diary",
        input: empty_diary,
        expected: {
            records: [],
        }
    });

    test_parse({
        file_format: "PleesTracker",
        name: "simple example",
        input: normal_diary,
        expected: {
            records: normal_records,
        }
    });

    test_to({
        name: "output test",
        format: "output",
        input: normal_diary,
        expected: normal_diary,
    });

    test_to({
        name: "standard format test",
        format: "Standard",
        input: normal_diary,
        expected: [
            {
                status: 'asleep',
                start: 1608323029380,
                end: 1608323057541,
                duration: 28161,
                start_of_new_day: true,
                day_number: 2,
                missing_record_after: true,
                is_primary_sleep: true,
            },
            {
                status: 'asleep',
                start: 1608323062156,
                end: 1608323063678,
                duration: 1522,
                start_of_new_day: false,
                day_number: 2,
                missing_record_after: true
            },
            {
                status: 'asleep',
                start: 1608323066387,
                end: 1608323067794,
                duration: 1407,
                start_of_new_day: false,
                day_number: 2,
            }
        ],
    });

    test_from_standard({
        name: "standard format test",
        format: "PleesTracker",
        input: [

            {
                status: 'asleep',
                start: 1608323029380,
                end: 1608323057541,
                duration: 28161,
                start_of_new_day: true,
                day_number: 2,
                missing_record_after: true,
                is_primary_sleep: true,
            },
            {
                status: 'asleep',
                start: 1608323062156,
                end: 1608323063678,
                duration: 1522,
                start_of_new_day: false,
                day_number: 2,
                missing_record_after: true
            },
            {
                status: 'asleep',
                start: 1608323066387,
                end: 1608323067794,
                duration: 1407,
                start_of_new_day: false,
                day_number: 2,
            }
        ],
        expected: (
            "sid,start,stop,rating\n" +
            "1,1608323029380,1608323057541,0\n" +
            "2,1608323062156,1608323063678,0\n" +
            "3,1608323066387,1608323067794,0\n"
        ),
    });

    test_merge({
        name: "two empty diaries",
        left: empty_diary,
        right: empty_diary,
        expected: {
            records: [],
        }
    });

    test_merge({
        name: "left empty, right non-empty",
        left: empty_diary,
        right: normal_diary,
        expected: {
            records: normal_records,
        },
    });

    test_merge({
        name: "left non-empty, right empty",
        left: normal_diary,
        right: empty_diary,
        expected: {
            records: normal_records,
        },
    });

    test_merge({
        name: "two identical diaries",
        left: normal_diary,
        right: normal_diary,
        expected: {
            records: normal_records,
        },
    });

    test_merge({
        name: "two different diaries",
        left: normal_diary,
        right: (
            "sid,start,stop,rating\n" +
            "1,608323029380,608323057541,0\n" +
            "2,608323062156,608323063678,5\n" +
            "3,608323066387,608323067794,3\n"
        ),
        expected: {
            records: normal_records.concat([
                {
                    start: 608323029380,
                    stop: 608323057541,
                    sid: 4,
                    rating: 0
                },
                {
                    start: 608323062156,
                    stop: 608323063678,
                    sid: 5,
                    rating: 5
                },
                {
                    start: 608323066387,
                    stop: 608323067794,
                    sid: 6,
                    rating: 3
                },
            ]),
        },
    });

});
describe("SpreadsheetTable format", () => {

    var empty_diary = "start,end\n";
    var empty_member_map = { start: [ "start", 0 ], end: [ "end", 1 ] };

    var non_empty_diary = "SleepStart,SleepEnd,sTaTe,comments,NOTES\n123456789,123456789,slept\n2020-01-01 01:01-0100,2020-02-02 02:02+0200,awoke,comment 1,comment 2\n";
    var non_empty_member_map = {
        start: [ "SleepStart", 0 ],
        end: [ "SleepEnd", 1 ],
        status: [ "sTaTe", 2 ],
        comments: [ "comments", 3, [ "comments", "NOTES" ] ]
    };

    test_parse({
        file_format: "SpreadsheetTable",
        name: "empty diary",
        input: empty_diary,
        expected: {
            records: [],
            member_map: empty_member_map,
        }
    });

    test_parse({
        file_format: "SpreadsheetTable",
        name: "simple SpreadsheetTable with one row",
        input: "start,end\n123456789,123456789\n",
        expected: {
            records: [
                {
                    "start" : 123456789000,
                    "end"   : 123456789000,
                    "status": "asleep",
                },
            ],
            member_map: empty_member_map,
        }
    });

    test_parse({
        file_format: "SpreadsheetTable",
        name: "Simple SpreadsheetTable with two rows",
        input: "Sleep,Wake\n123456789,123456789\n2020-01-01 01:01-0100,2020-02-02 02:02+0200\n",
        expected: {
            records: [
                {
                    "Sleep" : 123456789000,
                    "Wake"  : 123456789000,
                    "status": "asleep",
                },
                {
                    "Sleep" : 1577844060000,
                    "Wake"  : 1580601720000,
                    "status": "asleep",
                },
            ],
            member_map: { start: [ "Sleep", 0 ], end: [ "Wake", 1 ] },
        }
    });

    test_parse({
        file_format: "SpreadsheetTable",
        name: "Complex SpreadsheetTable",
        input: "SleepStart,SleepEnd,sTaTe,comments,NOTES\n123456789,123456789,slept\n2020-01-01 01:01-0100,2020-02-02 02:02+0200,awoke,comment 1,\"this is a single field containing one comma (,) one newline (\n) and one double quote (\"\")\",ignored comment\n",
        expected: {
            records: [
                {
                    "SleepStart" : 123456789000,
                    "SleepEnd"  : 123456789000,
                    "sTaTe": "asleep",
                    "comments": [],
                },
                {
                    "SleepStart" : 1577844060000,
                    "SleepEnd"  : 1580601720000,
                    "sTaTe": "awake",
                    "comments": [ "comment 1", "this is a single field containing one comma (,) one newline (\n) and one double quote (\")" ],
                },
            ],
            member_map: non_empty_member_map,
        }
    });


    test_to({
        name: "output test",
        format: "output",
        input: non_empty_diary,
        expected: "SleepStart,SleepEnd,sTaTe,comments,NOTES\n123456789000,123456789000,asleep\n1577844060000,1580601720000,awake,comment 1,comment 2\n",
    });

    test_to({
        name: "standard format test",
        format: "Standard",
        input: non_empty_diary,
        expected: [
            {
                status: "asleep",
                start: 123456789000,
                end: 123456789000,
                duration: 0,
                start_of_new_day: true,
                day_number: 2,
                missing_record_after: false,
                is_primary_sleep: true,
            },
            {
                status: "awake",
                start: 1577844060000,
                end: 1580601720000,
                comments: [ 'comment 1', 'comment 2' ],
                duration: 2757660000,
                start_of_new_day: false,
                day_number: 2,
            },
        ],
    });

    /*
     * This format can't be meaningfully initialised from Standard format,
     * because the record layout is specific to the headers in each input file.
     */
    /*
    test_from_standard({
        name: "standard format test",
        format: "SpreadsheetTable",
        input: [
            ...
        ],
        expected: ...,
    });
    */

    test_merge({
        name: "two empty diaries",
        left: empty_diary,
        right: empty_diary,
        expected: {
            records: [],
            member_map: empty_member_map,
        },
    });

    test_merge({
        name: "left empty, right non-empty",
        left: empty_diary,
        right: non_empty_diary,
        expected: {
            records: [
                {
                    start: 123456789000,
                    end: 123456789000,
                },
                {
                    start: 1577844060000,
                    end: 1580601720000,
                },
            ],
            member_map: empty_member_map,
        },
    });

    test_merge({
        name: "left non-empty, right empty",
        left: non_empty_diary,
        right: empty_diary,
        expected: {
            records: [
                {
                    SleepStart: 123456789000,
                    SleepEnd: 123456789000,
                    sTaTe: "asleep",
                    comments: [],
                },
                {
                    SleepStart: 1577844060000,
                    SleepEnd: 1580601720000,
                    sTaTe: "awake",
                    comments: [ "comment 1", "comment 2" ],
                },
            ],
            member_map: non_empty_member_map,
        },
    });

    test_merge({
        name: "two identical diaries",
        left: non_empty_diary,
        right: non_empty_diary,
        expected: {
            records: [
                {
                    SleepStart: 123456789000,
                    SleepEnd: 123456789000,
                    sTaTe: "asleep",
                    comments: [],
                },
                {
                    SleepStart: 1577844060000,
                    SleepEnd: 1580601720000,
                    sTaTe: "awake",
                    comments: [ "comment 1", "comment 2" ],
                },
            ],
            member_map: non_empty_member_map,
        },
    });

    test_merge({
        name: "two different diaries",
        left: non_empty_diary,
        right: "SleepStart,SleepEnd,sTaTe,comments,NOTES\n12346,12346,slept\n2020-01-01 01:02-0100,2020-02-02 02:03+0200,awoke,comment 1,comment 2\n",
        expected: {
            records: [
                {
                    SleepStart: 123456789000,
                    SleepEnd: 123456789000,
                    sTaTe: "asleep",
                    comments: [],
                },
                {
                    SleepStart: 1577844060000,
                    SleepEnd: 1580601720000,
                    sTaTe: "awake",
                    comments: [ "comment 1", "comment 2" ],
                },
                {
                    SleepStart: 12346000,
                    SleepEnd: 12346000,
                    sTaTe: "asleep",
                },
                {
                    SleepStart: 1577844120000,
                    SleepEnd: 1580601780000,
                    sTaTe: "awake",
                    comments: [ "comment 1", "comment 2" ],
                },
            ],
            member_map: non_empty_member_map,

        },
    });

});
register_roundtrip_modifier("SpreadsheetGraph",function(our_diary,roundtripped_diary,other_format) {
    switch ( other_format.name ) {
    case "Sleepmeter":
        /*
         * This format supports the "in bed" status, but only when followed by "asleep".
         * This is a quick workaround - a better solution would remove more selectively.
         */
        [our_diary,roundtripped_diary].forEach(function(diary) {
            diary.records = diary.records.filter( function(record) {
                delete record.missing_record_after;
                return record.status == 'asleep';
            });
        });
    }
});

describe("SpreadsheetGraph format", () => {

    const explicit_time_header = [
        "",
        "midnight",
        "1am",
        "2am",
        "3am",
        "4am",
        "5am",
        "6am",
        "7am",
        "8am",
        "9am",
        "10am",
        "11am",
        "12 noon",
        "1:00 PM",
        "2pm",
        "3p m",
        "4pm",
        "5pm",
        "6pm",
        "7pm",
        "8pm",
        "9pm",
        "10pm",
        "11-midnight",
    ];

    function create_diary(cells) {
        return {
            file_format: () => "spreadsheet",
            spreadsheet: Spreadsheet.parse_csv("").spreadsheet,
            sheets: [{
                cells: cells || [
                    explicit_time_header.slice(0),
                    [
                        { value: "2000-01-01" },
                        { value: "", style: "#FFFFFFFF,#FFFFFFFF" },
                    ],
                ]
            }],
        };
    }

    const twenty_four_hours = 24 * 60 * 60 * 1000;

    const now = new Date().getTime();
    const today = now - ( now % (twenty_four_hours) );

    test_parse({
        file_format: "SpreadsheetGraph",
        name: "minimal diary",
        input: create_diary([
            explicit_time_header.slice(1),
            [ { value: "", style: "#FFFFFFFF,#FFFFFFFF" } ],
        ]),
        spreadsheetify: "disable",
        expected: {
            records: [
                {
                    start: today,
                    comments: [],
                    end: today + 3599999,
                    status: 'awake',
                },
                {
                    start: today + 3600000,
                    comments: [],
                    status: 'asleep',
                }
            ],
            status_map: {
                awake: '#FFFFFFFF,#FFFFFFFF',
                asleep: '',
            },
        }
    });

    test_parse({
        file_format: "SpreadsheetGraph",
        name: "simple diary",
        input: create_diary(),
        spreadsheetify: "disable",
        expected: {
            records: [
                {
                    start: 946684800000,
                    comments: [],
                    end: 946684800000 + 3599999,
                    status: 'awake',
                },
                {
                    start: 946684800000 + 3600000,
                    comments: [],
                    status: 'asleep',
                }
            ],
            status_map: {
                awake: '#FFFFFFFF,#FFFFFFFF',
                asleep: '',
            },
        }
    });

    test_parse({
        file_format: "SpreadsheetGraph",
        name: "hard-to-parse comment",
        input: create_diary([
            explicit_time_header.slice(0),
            [
                { value: "2000-01-01" },
                { value: "this is a single field containing one comma (,) one newline (\n) and one double quote (\")", style: "#FFFFFFFF,#FFFFFFFF" },
            ],
        ]),
        spreadsheetify: "disable",
        expected: {
            records: [
                {
                    start: 946684800000,
                    comments: ["this is a single field containing one comma (,) one newline (\n) and one double quote (\")"],
                    end: 946684800000 + 3599999,
                    status: 'awake',
                },
                {
                    start: 946684800000 + 3600000,
                    comments: [],
                    status: 'asleep',
                }
            ],
            status_map: {
                awake: '#FFFFFFFF,#FFFFFFFF',
                asleep: '',
            },
        }
    });

    // this is a very rough test, but the best we can do without reading the spreadsheet back in again:
    {
        var test_diary = test_constructor({
            name: "output test",
            input: create_diary(),
        });

        it(`converts "output test" to "output" correctly`, function() {
            return test_diary.to_async("output").then(function(converted) {
                expect( converted.contents.length ).toBeGreaterThan( 0 );
            });
        });
    }

    test_to({
        name: "standard format test 1",
        format: "Standard",
        input: create_diary(),
        expected: [
            {
                start: 946684800000,
                end: 946684800000 + 3599999,
                status: 'awake',
                duration: 3599999,
                start_of_new_day: false,
                day_number: 0,
                missing_record_after: false,

            },
            {
                start: 946684800000 + 3600000,
                status: 'asleep',
                start_of_new_day: true,
                day_number: 2,
            }
        ],
    });

    test_from_standard({
        name: "standard format test 2",
        format: "SpreadsheetGraph",
        input: [
            {
                start: 946684800000,
                comments: [ "Comment\ntext" ],
                end: 946684800000 + 3599999,
                status: 'asleep',
                duration: 3599999,
                start_of_new_day: false,
                day_number: 0,
                missing_record_after: false,

            },
            {
                start: 946684800000 + 3600000,
                status: 'awake',
                start_of_new_day: true,
                day_number: 2,
            },
        ],
        expected: create_diary([
            explicit_time_header.slice(0),
            [
                { value: "2000-01-01" },
                { value: "Comment\ntext", style: "#FFFFFF00,#FF0000FF" },
            ],
            [],
            [{ value: "asleep", style: "#FFFFFF00,#FF0000FF" }],
        ]),
    });

    // left and right have the same records (should be deduplicated):
    test_merge({
        name: "two identical diaries",
        left: create_diary(),
        right: create_diary(),
        expected: {
            records: [
                {
                    start: 946684800000,
                    comments: [],
                    end: 946684800000 + 3599999,
                    status: 'awake',
                },
                {
                    start: 946684800000 + 3600000,
                    comments: [],
                    status: 'asleep',
                }
            ],
            status_map: {
                awake: '#FFFFFFFF,#FFFFFFFF',
                asleep: '',
            },
        },
    });

    // left and right have different records:
    test_merge({
        name: "two different diaries",
        left: create_diary(),
        right: create_diary([
            explicit_time_header.slice(0),
            [
                { value: "2000-01-01" },
                { value: "Comment\ntext", style: "#FFFFFF00,#FF0000FF" },
            ],
            [],
            [{ value: "asleep", style: "#FFFFFF00,#FF0000FF" }],
        ]),
        expected: {
            records: [
                {
                    start: 946684800000,
                    comments: [],
                    end: 946684800000 + 3599999,
                    status: 'awake',
                },
                {
                    start: 946684800000 + 3600000,
                    comments: [],
                    status: 'asleep',
                },
                {
                    start: 946684800000,
                    comments: [ "Comment\ntext" ],
                    end: 946684800000 + 3599999,
                    status: 'asleep',
                },
                {
                    start: 946684800000 + 3600000,
                    comments: [],
                    status: 'awake',
                },
            ],
            status_map: {
                awake: '#FFFFFFFF,#FFFFFFFF',
                asleep: '',
            },
        },
    });

    /*
     * Test every combination of headers
     */

    for ( var row_offset = 0; row_offset < 2; ++row_offset ) {

        var cells = [
            explicit_time_header.slice(0),
            [ { value: "2001-01-01" }, {}, { value: "", style: "#FFFFFFFF,#FFFFFFFF" } ],
            [ { value: "2001-01-02" }, {}, {}, { value: "", style: "#FFFFFFFF,#FFFFFFFF" } ],
            [ { value: "2001-01-03" }, {}, {}, {}, { value: "", style: "#FFFFFFFF,#FFFFFFFF" } ],
            [ { value: "2001-01-04" }, {}, {}, {}, {}, { value: "", style: "#FFFFFFFF,#FFFFFFFF" } ],
        ];

        cells.forEach( r => {
            while ( r.length < explicit_time_header.length ) r.push({});
        });

        if ( row_offset ) cells.shift();

        var cells_rotated = [];
        cells.forEach(
            (r,n) => r.forEach( (c,m) => {
                if ( !cells_rotated[m] ) cells_rotated[m] = [];
                cells_rotated[m][n] = c;
            })
        );

        var header_expected = {
            records: [
                { start: 978307200000, comments: [], end: 978310799999, status: 'awake' },
                { start: 978310800000, comments: [], end: 978314399999, status: 'asleep' },
                { start: 978314400000, comments: [], end: 978400799999, status: 'awake' },
                { start: 978400800000, comments: [], end: 978404399999, status: 'asleep' },
                { start: 978404400000, comments: [], end: 978490799999, status: 'awake' },
                { start: 978490800000, comments: [], end: 978494399999, status: 'asleep' },
                { start: 978494400000, comments: [], end: 978580799999, status: 'awake' },
                { start: 978580800000, comments: [], end: 978584399999, status: 'asleep' },
                { start: 978584400000, comments: []                   , status: 'awake' },
            ],
            status_map: {
                awake: '',
                asleep: '#FFFFFFFF,#FFFFFFFF',
            },
        };

        test_parse({
            file_format: "SpreadsheetGraph",
            name: "sheet with row_offset==" + row_offset,
            input: create_diary(cells),
            spreadsheetify: "disable",
            expected: header_expected,
        });

        test_parse({
            file_format: "SpreadsheetGraph",
            name: "sheet with row_offset==" + row_offset + " (rotated)",
            input: create_diary(cells_rotated),
            spreadsheetify: "disable",
            expected: header_expected,
        });

    }

    /*
     * Test different header durations
     */

    [ 60, 30, 15, 5 ].forEach( duration => {

        var time_headers = [ '' ];
        for ( var time = 0; time !=60*24; time += duration ) {
            var hours   = Math.floor( time / 60 ).toString();
            var minutes =           ( time % 60 ).toString();
            if ( hours  .length == 1 ) hours   = '0' + hours;
            if ( minutes.length == 1 ) minutes = '0' + minutes;
            time_headers.push( hours + ':' + minutes );
        }

        test_parse({
            file_format: "SpreadsheetGraph",
            name: "diary with duration=" + duration,
            input: create_diary([
                time_headers,
                [
                    { value: "2000-01-01" },
                    {},
                    { value: "", style: "#FFFFFFFF,#FFFFFFFF" },
                ],
            ]),
            spreadsheetify: "disable",
            expected: {
                records: [
                    {
                        start: 946684800000 + 0*duration,
                        comments: [],
                        end: 946684800000   + 1*duration*1000*60 - 1,
                        status: 'awake',
                    },
                    {
                        start: 946684800000 + 1*duration*1000*60,
                        comments: [],
                        end: 946684800000   + 2*duration*1000*60 - 1,
                        status: 'asleep',
                    },
                    {
                        start: 946684800000 + 2*duration*1000*60,
                        comments: [],
                        status: 'awake',
                    }
                ],
                status_map: {
                    asleep: '#FFFFFFFF,#FFFFFFFF',
                    awake: '',
                },
            }
        });

    });

    /*
     * Test data outside the header/body
     */

    [
        {
            name: "unused values outside the header/body",
            cells:
            [
                [ {}, { value: "unused value" } ],
                [ {}, { value: "unused value" } ],
                [ {}, { value: "unused value" } ],
                [ {}, { value: "unused value" } ],
            ],
            statuses: [
                "toilet", "sleep aid", "caffeine", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "drink", "exercise", "noise", "alarm", "in bed", "out of bed", "toilet", "sleep aid", "caffeine", "awake", "asleep", "snack", "meal", "alcohol", "chocolate",
                "sleep aid", "caffeine", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "drink", "exercise", "noise", "alarm", "in bed", "out of bed", "toilet", "sleep aid", "caffeine", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "drink",
                "caffeine", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "drink", "exercise", "noise", "alarm", "in bed", "out of bed", "toilet", "sleep aid", "caffeine", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "drink", "exercise",
                "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "drink", "exercise", "noise", "alarm", "in bed", "out of bed", "toilet", "sleep aid", "caffeine", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "drink", "exercise", "noise",
            ],
            status_map: {
                "awake"     :"#FFFFFFFF,#FFFFF0003",
                "asleep"    :"#FFFFFFFF,#FFFFF0004",
                "snack"     :"#FFFFFFFF,#FFFFF0005",
                "meal"      :"#FFFFFFFF,#FFFFF0006",
                "alcohol"   :"#FFFFFFFF,#FFFFF0007",
                "chocolate" :"#FFFFFFFF,#FFFFF0008",
                "caffeine"  :"#FFFFFFFF,#FFFFF0002",
                "drink"     :"#FFFFFFFF,#FFFFF0009",
                "sleep aid" :"#FFFFFFFF,#FFFFF0001",
                "exercise"  :"#FFFFFFFF,#FFFFF0010",
                "toilet"    :"#FFFFFFFF,#FFFFF0000",
                "noise"     :"#FFFFFFFF,#FFFFF0011",
                "alarm"     :"#FFFFFFFF,#FFFFF0012",
                "in bed"    :"#FFFFFFFF,#FFFFF0013",
                "out of bed":"#FFFFFFFF,#FFFFF0014"
            }

        },

        {
            name: "full legend",
            cells:
            [
                [
                    { style: "#FFFFFFFF,#FFFFF0000", value: "awake" },
                    { style: "#FFFFFFFF,#FFFFF0001", value: "asleep" },
                    { style: "#FFFFFFFF,#FFFFF0002", value: "snack" },
                    { style: "#FFFFFFFF,#FFFFF0003", value: "meal" },
                    { style: "#FFFFFFFF,#FFFFF0004", value: "alcohol" },
                    { style: "#FFFFFFFF,#FFFFF0005", value: "chocolate" },
                    { style: "#FFFFFFFF,#FFFFF0006", value: "caffeine" },
                    { style: "#FFFFFFFF,#FFFFF0007", value: "drink" },
                    { style: "#FFFFFFFF,#FFFFF0008", value: "sleep aid" },
                    { style: "#FFFFFFFF,#FFFFF0009", value: "exercise" },
                    { style: "#FFFFFFFF,#FFFFF0010", value: "toilet" },
                    { style: "#FFFFFFFF,#FFFFF0011", value: "noise" },
                    { style: "#FFFFFFFF,#FFFFF0012", value: "alarm" },
                    { style: "#FFFFFFFF,#FFFFF0013", value: "in bed" },
                    { style: "#FFFFFFFF,#FFFFF0014", value: "out of bed" },
                ]
            ],
            statuses: [
                "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid",
                "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise",
                "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet",
                "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise",
            ],
            status_map: {
                "awake"     :"#FFFFFFFF,#FFFFF0000",
                "asleep"    :"#FFFFFFFF,#FFFFF0001",
                "snack"     :"#FFFFFFFF,#FFFFF0002",
                "meal"      :"#FFFFFFFF,#FFFFF0003",
                "alcohol"   :"#FFFFFFFF,#FFFFF0004",
                "chocolate" :"#FFFFFFFF,#FFFFF0005",
                "caffeine"  :"#FFFFFFFF,#FFFFF0006",
                "drink"     :"#FFFFFFFF,#FFFFF0007",
                "sleep aid" :"#FFFFFFFF,#FFFFF0008",
                "exercise"  :"#FFFFFFFF,#FFFFF0009",
                "toilet"    :"#FFFFFFFF,#FFFFF0010",
                "noise"     :"#FFFFFFFF,#FFFFF0011",
                "alarm"     :"#FFFFFFFF,#FFFFF0012",
                "in bed"    :"#FFFFFFFF,#FFFFF0013",
                "out of bed":"#FFFFFFFF,#FFFFF0014"
            }

        },

        {
            name: "legend with text below styles",
            cells:
            [
                [
                    { style: "#FFFFFFFF,#FFFFF0000" },
                    { style: "#FFFFFFFF,#FFFFF0001" },
                    { style: "#FFFFFFFF,#FFFFF0002" },
                    { style: "#FFFFFFFF,#FFFFF0003" },
                    { style: "#FFFFFFFF,#FFFFF0004" },
                    { style: "#FFFFFFFF,#FFFFF0005" },
                    { style: "#FFFFFFFF,#FFFFF0006" },
                    { style: "#FFFFFFFF,#FFFFF0007" },
                    { style: "#FFFFFFFF,#FFFFF0008" },
                    { style: "#FFFFFFFF,#FFFFF0009" },
                    { style: "#FFFFFFFF,#FFFFF0010" },
                    { style: "#FFFFFFFF,#FFFFF0011" },
                    { style: "#FFFFFFFF,#FFFFF0012" },
                    { style: "#FFFFFFFF,#FFFFF0013" },
                    { style: "#FFFFFFFF,#FFFFF0014" },
                ],
                [
                    { value: "awake" },
                    { value: "asleep" },
                    { value: "snack" },
                    { value: "meal" },
                    { value: "alcohol" },
                    { value: "chocolate" },
                    { value: "caffeine" },
                    { value: "drink" },
                    { value: "sleep aid" },
                    { value: "exercise" },
                    { value: "toilet" },
                    { value: "noise" },
                    { value: "alarm" },
                    { value: "in bed" },
                    { value: "out of bed" },
                ]
            ],
            statuses: [
                "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid",
                "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise",
                "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet",
                "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise",
            ],
            status_map: {
                "awake"     :"#FFFFFFFF,#FFFFF0000",
                "asleep"    :"#FFFFFFFF,#FFFFF0001",
                "snack"     :"#FFFFFFFF,#FFFFF0002",
                "meal"      :"#FFFFFFFF,#FFFFF0003",
                "alcohol"   :"#FFFFFFFF,#FFFFF0004",
                "chocolate" :"#FFFFFFFF,#FFFFF0005",
                "caffeine"  :"#FFFFFFFF,#FFFFF0006",
                "drink"     :"#FFFFFFFF,#FFFFF0007",
                "sleep aid" :"#FFFFFFFF,#FFFFF0008",
                "exercise"  :"#FFFFFFFF,#FFFFF0009",
                "toilet"    :"#FFFFFFFF,#FFFFF0010",
                "noise"     :"#FFFFFFFF,#FFFFF0011",
                "alarm"     :"#FFFFFFFF,#FFFFF0012",
                "in bed"    :"#FFFFFFFF,#FFFFF0013",
                "out of bed":"#FFFFFFFF,#FFFFF0014"
            }

        },

        {
            name: "one legend item missing",
            cells:
            [
                [
                    { style: "#FFFFFFFF,#FFFFF0000", value: "awake" },
                    { style: "#FFFFFFFF,#FFFFF0001", value: "asleep" },
                    { style: "#FFFFFFFF,#FFFFF0002", value: "snack" },
                    { style: "#FFFFFFFF,#FFFFF0003", value: "meal" },
                    { style: "#FFFFFFFF,#FFFFF0004", value: "alcohol" },
                    { style: "#FFFFFFFF,#FFFFF0005", value: "chocolate" },
                    { style: "#FFFFFFFF,#FFFFF0006", value: "caffeine" },
                    //{ style: "#FFFFFFFF,#FFFFF0007", value: "drink" },
                    { style: "#FFFFFFFF,#FFFFF0008", value: "sleep aid" },
                    { style: "#FFFFFFFF,#FFFFF0009", value: "exercise" },
                    { style: "#FFFFFFFF,#FFFFF0010", value: "toilet" },
                    { style: "#FFFFFFFF,#FFFFF0011", value: "noise" },
                    { style: "#FFFFFFFF,#FFFFF0012", value: "alarm" },
                    { style: "#FFFFFFFF,#FFFFF0013", value: "in bed" },
                    { style: "#FFFFFFFF,#FFFFF0014", value: "out of bed" },
                ]
            ],
            statuses: [
                "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid",
                "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise",
                "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet",
                "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise",
            ],
            status_map: {
                "awake"     :"#FFFFFFFF,#FFFFF0000",
                "asleep"    :"#FFFFFFFF,#FFFFF0001",
                "snack"     :"#FFFFFFFF,#FFFFF0002",
                "meal"      :"#FFFFFFFF,#FFFFF0003",
                "alcohol"   :"#FFFFFFFF,#FFFFF0004",
                "chocolate" :"#FFFFFFFF,#FFFFF0005",
                "caffeine"  :"#FFFFFFFF,#FFFFF0006",
                "drink"     :"#FFFFFFFF,#FFFFF0007",
                "sleep aid" :"#FFFFFFFF,#FFFFF0008",
                "exercise"  :"#FFFFFFFF,#FFFFF0009",
                "toilet"    :"#FFFFFFFF,#FFFFF0010",
                "noise"     :"#FFFFFFFF,#FFFFF0011",
                "alarm"     :"#FFFFFFFF,#FFFFF0012",
                "in bed"    :"#FFFFFFFF,#FFFFF0013",
                "out of bed":"#FFFFFFFF,#FFFFF0014"
            }

        },

        {
            name: "several legend items missing",
            cells:
            [
                [
                    { style: "#FFFFFFFF,#FFFFF0000", value: "awake" },
                    //{ style: "#FFFFFFFF,#FFFFF0001", value: "asleep" },
                    { style: "#FFFFFFFF,#FFFFF0002", value: "snack" },
                    //{ style: "#FFFFFFFF,#FFFFF0003", value: "meal" },
                    { style: "#FFFFFFFF,#FFFFF0004", value: "alcohol" },
                    //{ style: "#FFFFFFFF,#FFFFF0005", value: "chocolate" },
                    { style: "#FFFFFFFF,#FFFFF0006", value: "caffeine" },
                    //{ style: "#FFFFFFFF,#FFFFF0007", value: "drink" },
                    { style: "#FFFFFFFF,#FFFFF0008", value: "sleep aid" },
                    //{ style: "#FFFFFFFF,#FFFFF0009", value: "exercise" },
                    { style: "#FFFFFFFF,#FFFFF0010", value: "toilet" },
                    //{ style: "#FFFFFFFF,#FFFFF0011", value: "noise" },
                    { style: "#FFFFFFFF,#FFFFF0012", value: "alarm" },
                    //{ style: "#FFFFFFFF,#FFFFF0013", value: "in bed" },
                    { style: "#FFFFFFFF,#FFFFF0014", value: "out of bed" },
                ]
            ],
            statuses: [
                "awake", "exercise", "snack", "asleep", "alcohol", "meal", "caffeine", "chocolate", "sleep aid", "drink", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "exercise", "snack", "asleep", "alcohol", "meal", "caffeine", "chocolate", "sleep aid",
                "exercise", "snack", "asleep", "alcohol", "meal", "caffeine", "chocolate", "sleep aid", "drink", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "exercise", "snack", "asleep", "alcohol", "meal", "caffeine", "chocolate", "sleep aid", "drink",
                "snack", "asleep", "alcohol", "meal", "caffeine", "chocolate", "sleep aid", "drink", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "exercise", "snack", "asleep", "alcohol", "meal", "caffeine", "chocolate", "sleep aid", "drink", "toilet",
                "asleep", "alcohol", "meal", "caffeine", "chocolate", "sleep aid", "drink", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "exercise", "snack", "asleep", "alcohol", "meal", "caffeine", "chocolate", "sleep aid", "drink", "toilet", "noise",
            ],
            status_map: {
                "awake"     :"#FFFFFFFF,#FFFFF0000",
                "asleep"    :"#FFFFFFFF,#FFFFF0003",
                "snack"     :"#FFFFFFFF,#FFFFF0002",
                "meal"      :"#FFFFFFFF,#FFFFF0005",
                "alcohol"   :"#FFFFFFFF,#FFFFF0004",
                "chocolate" :"#FFFFFFFF,#FFFFF0007",
                "caffeine"  :"#FFFFFFFF,#FFFFF0006",
                "drink"     :"#FFFFFFFF,#FFFFF0009",
                "sleep aid" :"#FFFFFFFF,#FFFFF0008",
                "exercise"  :"#FFFFFFFF,#FFFFF0001",
                "toilet"    :"#FFFFFFFF,#FFFFF0010",
                "noise"     :"#FFFFFFFF,#FFFFF0011",
                "alarm"     :"#FFFFFFFF,#FFFFF0012",
                "in bed"    :"#FFFFFFFF,#FFFFF0013",
                "out of bed":"#FFFFFFFF,#FFFFF0014"
            }

        },

    ].forEach( test => {

        let cells = [
            [ { value: "2000-01-01" } ],
            [ { value: "2000-01-02" } ],
            [ { value: "2000-01-03" } ],
            [ { value: "2000-01-04" } ],
        ];

        for ( var n=0; n!=24; ++n ) {
            cells.forEach( (row,m) => {
                var value = ( ( n + m ) % 15 /* current value of DiaryBase.status_matches().length */ ).toString();
                while ( value.length < 4 ) value = '0' + value;
                row[n+1] = { value: "", style: "#FFFFFFFF,#FFFFF" + value };
            });
        }

        test.cells.forEach( (e,n) => cells[n] = cells[n].concat(e) );

        let records = test.statuses.map(
            (status,n) => ({
                start: 946684800000 + n*3600000,
                comments:[],
                end: 946684800000 + (n+1)*3600000 - 1,
                status: status
            })
        );

        delete records[records.length-1].end;

        test_parse({
            file_format: "SpreadsheetGraph",
            name: test.name,
            input: create_diary(cells),
            spreadsheetify: "disable",
            expected: {
                records: records,
                status_map: test.status_map,
            }
        });

    });

});
