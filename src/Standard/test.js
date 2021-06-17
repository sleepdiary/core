register_roundtrip_modifier("Standard",function(our_diary,roundtripped_diary,other_format) {
    [our_diary,roundtripped_diary].forEach(function(diary) {
        diary["records"]  = diary["records"].slice(0).map(function(record) {
            if ( record["comments"] ) record["comments"] = record["comments"].slice(0);
            return record;
        });
        diary["settings"] = Object.assign( {}, diary["settings"] );
    });
    if ( our_diary["settings"]["minimum_day_duration"] != 57600000 || our_diary["settings"]["maximum_day_duration"] != 115200000 ) {
        // not supported in most formats - we don't expect to get any meaningful data
        [our_diary,roundtripped_diary].forEach(function(diary) {
            delete diary["settings"]["minimum_day_duration"];
            delete diary["settings"]["maximum_day_duration"];
            diary["records"].forEach( function(record) {
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
    case "ActivityLog":
    case "SpreadsheetGraph":
    case "SpreadsheetTable":
    case "PleesTracker":
    case "SleepChart1":
        [our_diary,roundtripped_diary].forEach(function(diary) {
            diary["records"].forEach( function(record) {
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
        our_diary["records"].forEach( function(record) {
            /*
             * Values not supported - in these formats
             */
            if ( record["comments"] ) {
                record["comments"] = record["comments"].map(
                    comment => ( typeof(comment) == "string" ) ? comment : comment["text"]
                );
            }
        });
    }
    switch ( other_format.name ) {
    case "Sleepmeter":
    case "SleepAsAndroid":
        our_diary["records"].forEach( function(r,n) {
            /*
             * These formats converts missing timezones to Etc/GMT, which can also be specified manually.
             * Standard format allows missing timezones.
             * Therefore, roundtripping breaks some timezones.
             */
            ["start_timezone","end_timezone"].forEach(function(key) {
                if ( r[key] === undefined &&
                     !((roundtripped_diary["records"][n]||{})[key]||'').search(/^Etc\/GMT(-1)?$/) ) {
                    delete r[key];
                    delete roundtripped_diary["records"][n][key];
                }
            });
        });
    }
    switch ( other_format.name ) {
    case "ActivityLog":
    case "SleepChart1":
    case "PleesTracker":
        [our_diary,roundtripped_diary].forEach(function(diary) {
            diary["records"].forEach( function(record) {
                ["comments"].forEach(function(key) {
                    delete record[key];
                });
            });
        });
    }
});

describe("Standard format", () => {

    function wrap_expected(expected) { return expected; }

    function wrap_input(contents) {
        contents["file_format"] = "Standard";
        return {
            "file_format": () => "Standard",
            "contents": contents,
        }
    }

    test_parse({
        name: "simple diary",
        file_format:"Standard",
        input: "{\"file_format\":\"Standard\",\"records\":[]}",
        expected: {
            "settings": {
                "minimum_day_duration": 57600000,
                "maximum_day_duration": 115200000,
            },
            "records": [],
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
            "settings": {
                "minimum_day_duration": 57600000,
                "maximum_day_duration": 115200000,
            },
            "records": [],
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
            "settings": {
                "minimum_day_duration": 16,
                "maximum_day_duration": 32,
            },
            "records": [],
        }),
    });

    test_parse({
        name: "hard-to-parse comment",
        file_format:"Standard",
        input:  wrap_input({
            "records": [
                {
                    "status"   : "awake",
                    "comments" : [
                        "this is a single field containing one comma (,) one newline (\n) and one double quote (\")",
                    ],
                },
            ],
        }),
        expected: {
            "settings": {
                "minimum_day_duration": 57600000,
                "maximum_day_duration": 115200000,
            },
            "records": [
                {
                    "status"   : "awake",
                    "comments" : [
                        "this is a single field containing one comma (,) one newline (\n) and one double quote (\")",
                    ],
                    "day_number"       : 0,
                    "start_of_new_day" : false,
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
                "start"               : 1,
                "end"                 : 2,
                "duration"            : 3,
                "status"              : "awake",
                "comments"            : [
                   "comment string",
                    { time: 4, text:"comment object" },
                ],
                "day_number"          : 1,
                "start_of_new_day"    : true,
                "is_primary_sleep"    : true,
                "missing_record_after": true,
            },
            {
                "start"               : 1,
                "end"                 : 2,
                //duration            : 3,
                "status"              : "awake",
                "comments"            : [
                   "comment string",
                    { time: 4, text:"comment object" },
                ],
                "day_number"          : 1,
                "start_of_new_day"    : true,
                "is_primary_sleep"    : true,
                "missing_record_after": true,
            },
            {
                "start"               : 1,
                //end                 : 2,
                //duration            : 3,
                "status"              : "awake",
                "comments"            : [
                   "comment string",
                    { time: 4, text:"comment object" },
                ],
                "day_number"          : 1,
                "start_of_new_day"    : true,
                "is_primary_sleep"    : true,
                "missing_record_after": true,
            },
            {
                "start"               : 1,
                //end                 : 2,
                //duration            : 3,
                "status"              : "awake",
                "comments"            : [
                   "comment string",
                    { time: 4, text:"comment object" },
                ],
                //day_number          : 1,
                "start_of_new_day"    : true,
                "is_primary_sleep"    : true,
                "missing_record_after": true,
            },
            {
                "start"               : 1,
                //end                 : 2,
                //duration            : 3,
                "status"              : "awake",
                "comments"            : [
                   "comment string",
                    { time: 4, text:"comment object" },
                ],
                //day_number          : 1,
                //start_of_new_day    : true,
                "is_primary_sleep"    : true,
                "missing_record_after": true,
            },
            {
                "start"               : 1,
                //end                 : 2,
                //duration            : 3,
                "status"              : "awake",
                "comments"            : [
                   "comment string",
                    { time: 4, text:"comment object" },
                ],
                //day_number          : 1,
                //start_of_new_day    : true,
                //is_primary_sleep    : true,
                "missing_record_after": true,
            },
            {
                "start"               : 1,
                //end                 : 2,
                //duration            : 3,
                "status"              : "awake",
                "comments"            : [
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
            "settings": {
                "minimum_day_duration": 57600000,
                "maximum_day_duration": 115200000,
            },
            "records": [
                {
                    "start"               : 1,
                    "end"                 : 2,
                    "duration"            : 3,
                    "status"              : "awake",
                    "comments"            : [
                        "comment string",
                        { time: 4, text:"comment object" },
                    ],
                    "day_number"          : 1,
                    "start_of_new_day"    : true,
                    "is_primary_sleep"    : true,
                    "missing_record_after": true,
                },
                {
                    "start"               : 1,
                    "end"                 : 2,
                    "duration"            : 1,
                    "status"              : "awake",
                    "comments"            : [
                        "comment string",
                        { time: 4, text:"comment object" },
                    ],
                    "day_number"          : 1,
                    "start_of_new_day"    : true,
                    "is_primary_sleep"    : true,
                    "missing_record_after": true,
                },
                {
                    "start"               : 1,
                    "status"              : "awake",
                    "comments"            : [
                        "comment string",
                        { time: 4, text:"comment object" },
                    ],
                    "day_number"          : 1,
                    "start_of_new_day"    : true,
                    "is_primary_sleep"    : true,
                    "missing_record_after": true,
                },
                {
                    "start"               : 1,
                    "status"              : "awake",
                    "comments"            : [
                        "comment string",
                        { time: 4, text:"comment object" },
                    ],
                    "day_number"          : 2,
                    "start_of_new_day"    : true,
                    "is_primary_sleep"    : true,
                    "missing_record_after": true,
                },
                {
                    "start"               : 1,
                    "status"              : "awake",
                    "comments"            : [
                        "comment string",
                        { time: 4, text:"comment object" },
                    ],
                    "day_number"          : 2,
                    "start_of_new_day"    : false,
                    "is_primary_sleep"    : true,
                    "missing_record_after": true,
                },
                {
                    "start"               : 1,
                    "status"              : "awake",
                    "comments"            : [
                        "comment string",
                        { time: 4, text:"comment object" },
                    ],
                    "day_number"          : 2,
                    "start_of_new_day"    : false,
                    "missing_record_after": true,
                },
                {
                    "start"               : 1,
                    "status"              : "awake",
                    "comments"            : [
                        "comment string",
                        { time: 4, text:"comment object" },
                    ],
                    "day_number"          : 2,
                    "start_of_new_day"    : false,
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
                "start"               : 57600000*0,
                "status"              : "asleep",
            },
            {
                "start"               : 57600000*1,
                "status"              : "asleep",
            },
            {
                "start"               : 57600000*1 + 1,
                "status"              : "asleep",
            },
            {
                "start"               : 57600000*3 + 1,
                "status"              : "asleep",
            },
            {
                "start"               : 57600000*5 + 2,
                "status"              : "asleep",
            },
        ] }),
        expected: wrap_expected({
            "settings": {
                "minimum_day_duration": 57600000,
                "maximum_day_duration": 115200000,
            },
            "records": [
                {
                    "start"               : 57600000*0,
                    "status"              : "asleep",
                    "day_number"          : 0,
                    "start_of_new_day"    : false,
                    "missing_record_after": true,
                },
                {
                    "start"               : 57600000*1,
                    "status"              : "asleep",
                    "day_number"          : 0,
                    "start_of_new_day"    : false,
                    "missing_record_after": true,
                },
                {
                    "start"               : 57600000*1 + 1,
                    "status"              : "asleep",
                    "day_number"          : 1,
                    "start_of_new_day"    : true,
                    "missing_record_after": true,
                },
                {
                    "start"               : 57600000*3 + 1,
                    "status"              : "asleep",
                    "day_number"          : 2,
                    "start_of_new_day"    : true,
                    "missing_record_after": true,
                },
                {
                    "start"               : 57600000*5 + 2,
                    "status"              : "asleep",
                    "day_number"          : 4,
                    "start_of_new_day"    : true,
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
                    "start"               : 57600000*0,
                    "status"              : "asleep",
                },
                {
                    "start"               : 57600000*1,
                    "status"              : "asleep",
                },
                {
                    "start"               : 57600000*1 + 1,
                    "status"              : "asleep",
                },
                {
                    "start"               : 57600000*3 + 1,
                    "status"              : "asleep",
                },
                {
                    "start"               : 57600000*5 + 2,
                    "status"              : "asleep",
                },
            ],
            "minimum_day_duration": 1,
            "maximum_day_duration": Math.pow(2,31),
        }),
        expected: wrap_expected({
            "settings": {
                "minimum_day_duration": 1,
                "maximum_day_duration": Math.pow(2,31),
            },
            "records": [
                {
                    "start"               : 57600000*0,
                    "status"              : "asleep",
                    "day_number"          : 0,
                    "start_of_new_day"    : false,
                    "missing_record_after": true,
                },
                {
                    "start"               : 57600000*1,
                    "status"              : "asleep",
                    "day_number"          : 1,
                    "start_of_new_day"    : true,
                    "missing_record_after": true,
                },
                {
                    "start"               : 57600000*1 + 1,
                    "status"              : "asleep",
                    "day_number"          : 1,
                    "start_of_new_day"    : false,
                    "missing_record_after": true,
                },
                {
                    "start"               : 57600000*3 + 1,
                    "status"              : "asleep",
                    "day_number"          : 2,
                    "start_of_new_day"    : true,
                    "missing_record_after": true,
                },
                {
                    "start"               : 57600000*5 + 2,
                    "status"              : "asleep",
                    "day_number"          : 3,
                    "start_of_new_day"    : true,
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
                    "start"               : 57600000*1,
                    "status"              : "asleep",
                },
                {
                    "start"               : 57600000*0,
                    "status"              : "asleep",
                },
            ],
        }),
        expected: wrap_expected({
            "settings": {
                "minimum_day_duration": 57600000,
                "maximum_day_duration": 115200000,
            },
            "records": [
                {
                    "start"               : 57600000*0,
                    "status"              : "asleep",
                    "day_number"          : 0,
                    "start_of_new_day"    : false,
                    "missing_record_after": true,
                },
                {
                    "start"               : 57600000*1,
                    "status"              : "asleep",
                    "day_number"          : 0,
                    "start_of_new_day"    : false,
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
                    "duration": 16,
                    "status"  : "asleep",
                },
                {
                    "duration": 32,
                    "status"  : "asleep",
                },
            ],
        }),
        expected: wrap_expected({
            "settings": {
                "minimum_day_duration": 57600000,
                "maximum_day_duration": 115200000,
            },
            "records": [
                {
                    "duration"            : 16,
                    "status"              : "asleep",
                    "day_number"          : 0,
                    "start_of_new_day"    : false,
                    "missing_record_after": true,
                },
                {
                    "duration"            : 32,
                    "status"              : "asleep",
                    "day_number"          : 0,
                    "start_of_new_day"    : false,
                    "is_primary_sleep"    : true,
                },
            ],
        }),
    });

    it(`serialises data correctly`, function() {
        expect(
            new_sleep_diary(wrap_input({
                "records": [
                    {
                        "duration": 1,
                        "status"  : "asleep",
                    },
                    {
                        "duration": 2,
                        "status"  : "asleep",
                    },
                ],
            }))["to"]("output")["contents"]
        )["toEqual"]('{"file_format":"Standard","records":[{"duration":1,"status":"asleep","start_of_new_day":false,"day_number":0,"missing_record_after":true},{"duration":2,"status":"asleep","start_of_new_day":false,"day_number":0,"is_primary_sleep":true}],"settings":{"minimum_day_duration":57600000,"maximum_day_duration":115200000}}');
    });

    [
        {
            "left": [],
            "right": [],
            "expected": [],
        },
        {
            "left": [ { "start": 1, "end": 2 } ],
            "right": [],
            "expected": [ { "start": 1, "end": 2, "duration": 1, "start_of_new_day": false, "day_number": 0 } ],
        },
        {
            "left": [],
            "right": [ { "start": 1, "end": 2 } ],
            "expected": [ { "start": 1, "end": 2, "duration": 1, "start_of_new_day": false, "day_number": 0 } ],
        },
        {
            "left": [ { "start": 1, "end": 2 } ],
            "right": [ { "start": 1, "end": 2 } ],
            "expected": [ { "start": 1, "end": 2, "duration": 1, "start_of_new_day": false, "day_number": 0 } ],
        },
        {
            "left": [ { "start": 2, "end": 3 } ],
            "right": [ { "start": 1, "end": 2 } ],
            "expected": [
                { "start": 1, "end": 2, "duration": 1, "start_of_new_day": false, "day_number": 0 },
                { "start": 2, "end": 3, "duration": 1, "start_of_new_day": false, "day_number": 0 },
            ],
        },
        {
            "left": [ { "start": 1, "end": 2 } ],
            "right": [ { "start": 2, "end": 3 } ],
            "expected": [
                { "start": 1, "end": 2, "duration": 1, "start_of_new_day": false, "day_number": 0 },
                { "start": 2, "end": 3, "duration": 1, "start_of_new_day": false, "day_number": 0 },
            ],
        },
    ].forEach(function(test) {
        test_merge({
            left: wrap_input({
                "file_format": "Standard",
                "records": test["left"],
            }),
            right: wrap_input({
                "file_format": "Standard",
                "records": test["right"],
            }),
            expected: {
                "settings": {
                    "minimum_day_duration":  57600000,
                    "maximum_day_duration": 115200000,
                },
                "records": test["expected"],
            },
        });
    });

    it(`summarises records correctly`, function() {

        var tests = [
            {
                "records": [],
                "expected": null,
            },
            {
                "records": [{ start: 1 }],
                "expected": null,
            },
            {
                "records": [{ duration: 1 }],
                "expected": wrap_expected({
                    "average": 1,
                    "mean": 1,
                    "interquartile_mean": 1,
                    "median": 1,
                    "interquartile_range": 0,
                    "durations": [ 1 ],
                    "interquartile_durations": [ 1 ],
                    "standard_deviation": 0,
                    "interquartile_standard_deviation": 0,
                }),
            },
            {
                "records": [{ duration: 1 }, { start: 1 }],
                "expected": wrap_expected({
                    "average": 1,
                    "mean": 1,
                    "interquartile_mean": 1,
                    "median": 1,
                    "interquartile_range": 0,
                    "durations": [ 1, undefined ],
                    "interquartile_durations": [ 1 ],
                    "standard_deviation": 0,
                    "interquartile_standard_deviation": 0,
                }),
            },
            {
                "records": [1,1,1,1].map( d => ({ duration: d }) ),
                "expected": wrap_expected({
                    "average": 1,
                    "mean": 1,
                    "interquartile_mean": 1,
                    "median": 1,
                    "interquartile_range": 0,
                    "durations": [ 1, 1, 1, 1 ],
                    "interquartile_durations": [ 1, 1 ],
                    "standard_deviation": 0,
                    "interquartile_standard_deviation": 0,
                }),
            },
            {
                "records": [-10,1,1,11].map( d => ({ duration: d }) ),
                "expected": wrap_expected({
                    "average": 0.75,
                    "mean": 0.75,
                    "interquartile_mean": 1,
                    "median": 1,
                    "interquartile_range": 0,
                    "durations": [ -10, 1, 1, 11 ],
                    "interquartile_durations": [ 1, 1 ],
                    "standard_deviation": 7.428828979051813,
                    "interquartile_standard_deviation": 0,
                }),
            },
        ];

        tests.forEach(function(test) {
            expect(
                new_sleep_diary(wrap_input({
                    "file_format": "Standard",
                    "records": test["records"],
                }))["summarise_records"]()
            )["toEqual"](test["expected"]);
        });

    });

    it(`calculates the correct sleep/wake status`, function() {

        var tests = [
            {
                "records": [],
                "expected": "",
            },
            {
                "records": [ { status: "awake" } ],
                "expected": "awake",
            },
            {
                "records": [ { status: "asleep" } ],
                "expected": "asleep",
            },
            {
                "records": [ { status: "awake" }, { status: "asleep" } ],
                "expected": "asleep",
            },
            {
                "records": [ { status: "asleep" }, { status: "awake" } ],
                "expected": "awake",
            },
        ];

        tests.forEach(function(test) {
            expect(
                new_sleep_diary(wrap_input({
                    "file_format": "Standard",
                    "records": test["records"],
                }))["latest_sleep_status"]()
            )["toEqual"](test["expected"]);
        });

    });

    it(`calculates the correct daily schedule`, function() {

        var tests = [

            {
                "records": [],
                "args": [],
                "expected": {
                    "wake": null,
                    "sleep": null,
                },
            },

            {
                "records": [
                    { "start_timezone": "Etc/GMT", "is_primary_sleep": true, "start": 1 },
                ],
                "args": [],
                "expected": {
                    "wake": null,
                    "sleep": {
                        "average": 1,
                        "mean": 1,
                        "interquartile_mean": 1,
                        "median": 1,
                        "interquartile_range": 0,
                        "durations": [ 1 ],
                        "interquartile_durations": [ 1 ],
                        "standard_deviation": 0,
                        "interquartile_standard_deviation": 0,
                    },
                },
            },

            {
                "records": [
                    { "start_timezone": "Etc/GMT", "is_primary_sleep": true, "end": 1 },
                ],
                "args": [],
                "expected": {
                    "wake": {
                        "average": 1,
                        "mean": 1,
                        "interquartile_mean": 1,
                        "median": 1,
                        "interquartile_range": 0,
                        "durations": [ 1 ],
                        "interquartile_durations": [ 1 ],
                        "standard_deviation": 0,
                        "interquartile_standard_deviation": 0,
                    },
                    "sleep": null,
                },
            },

            {
                "records": [
                    { "start_timezone": "Etc/GMT", "is_primary_sleep": true, "start": 1, "end": 1 },
                ],
                "args": [],
                "expected": {
                    "wake": {
                        "average": 1,
                        "mean": 1,
                        "interquartile_mean": 1,
                        "median": 1,
                        "interquartile_range": 0,
                        "durations": [ 1 ],
                        "interquartile_durations": [ 1 ],
                        "standard_deviation": 0,
                        "interquartile_standard_deviation": 0,
                    },
                    "sleep": {
                        "average": 1,
                        "mean": 1,
                        "interquartile_mean": 1,
                        "median": 1,
                        "interquartile_range": 0,
                        "durations": [ 1 ],
                        "interquartile_durations": [ 1 ],
                        "standard_deviation": 0,
                        "interquartile_standard_deviation": 0,
                    },
                },
            },

            {
                "records": [
                    {
                        "start_timezone": "Etc/GMT",
                        "end_timezone": "Etc/GMT",
                        "is_primary_sleep": true,
                        "start": 1,
                        "end": 24*60*60*1000-1
                    },
                ],
                "args": [],
                "expected": {
                    "wake": {
                        "average": 24*60*60*1000-1,
                        "mean": 24*60*60*1000-1,
                        "interquartile_mean": 24*60*60*1000-1,
                        "median": 24*60*60*1000-1,
                        "interquartile_range": 0,
                        "durations": [ 24*60*60*1000-1 ],
                        "interquartile_durations": [ 24*60*60*1000-1 ],
                        "standard_deviation": 0,
                        "interquartile_standard_deviation": 0,
                    },
                    "sleep": {
                        "average": 1,
                        "mean": 1,
                        "interquartile_mean": 1,
                        "median": 1,
                        "interquartile_range": 0,
                        "durations": [ 1 ],
                        "interquartile_durations": [ 1 ],
                        "standard_deviation": 0,
                        "interquartile_standard_deviation": 0,
                    },
                },
            },

            {
                "records": [
                    { "start_timezone": "Etc/GMT", "is_primary_sleep": true, "start": 1 },
                    { "start_timezone": "Etc/GMT", "is_primary_sleep": true, "start": 3 },
                ],
                "args": [],
                "expected": {
                    "wake": null,
                    "sleep": {
                        "average": 2,
                        "mean": 2,
                        "interquartile_mean": 3,
                        "median": 3,
                        "interquartile_range": 0,
                        "durations": [ 1, 3 ],
                        "interquartile_durations": [ 3 ],
                        "standard_deviation": 1,
                        "interquartile_standard_deviation": 0,
                    },
                },
            },

            {
                "records": [
                    { "start_timezone": "Etc/GMT", "is_primary_sleep": true, "start": 24*60*60*1000-1 },
                    { "start_timezone": "Etc/GMT", "is_primary_sleep": true, "start": 1 },
                ],
                "args": [],
                "expected": {
                    "wake": null,
                    "sleep": {
                        "average": 0,
                        "mean": 0,
                        "interquartile_mean": 1,
                        "median": 1,
                        "interquartile_range": 0,
                        "durations": [ 1, 24*60*60*1000-1 ],
                        "interquartile_durations": [ 24*60*60*1000-1 ],
                        "standard_deviation": 1,
                        "interquartile_standard_deviation": 0,
                    },
                },
            },

            {
                "records": [
                    // date --date='TZ="Europe/London" March 29 2020' +%s000
                    { "is_primary_sleep": true, "start": 1585440000000, "start_timezone": "Europe/London" },
                    // date --date='TZ="Europe/London" March 30 2020' +%s000
                    { "is_primary_sleep": true, "start": 1585522800000, "start_timezone": "Europe/London" },

                    // date --date='TZ="Europe/Prague" March 29 2020' +%s000
                    { "is_primary_sleep": true, "start": 1585436400000, "start_timezone": "Europe/Prague" },
                    // date --date='TZ="Europe/Prague" March 30 2020' +%s000
                    { "is_primary_sleep": true, "start": 1585519200000, "start_timezone": "Europe/Prague" },

                    // date --date='TZ="Asia/Seoul" March 29 2020' +%s000 - note: Seoul does not have DST
                    { "is_primary_sleep": true, "start": 1585407600000, "start_timezone": "Asia/Seoul" },
                    // date --date='TZ="Asia/Seoul" March 30 2020' +%s000 - note: Seoul does not have DST
                    { "is_primary_sleep": true, "start": 1585494000000, "start_timezone": "Asia/Seoul" },

                ],
                "args": [null,null,/*"Asia/Seoul"*/], //
                "expected": {
                    "wake": null,
                    "sleep": {
                        "average": 0,
                        "mean": 0,
                        "interquartile_mean": 0,
                        "median": 0,
                        "interquartile_range": 0,
                        "durations": [ 0, 0, 0, 0, 0, 0 ],
                        "interquartile_durations": [ 0, 0, 0 ],
                        "standard_deviation": 0,
                        "interquartile_standard_deviation": 0,
                    },
                },
            },

        ];

        tests.forEach(function(test) {
            let diary = new_sleep_diary(wrap_input({
                "file_format": "Standard",
                "records": test["records"],
            }));
            expect(
                diary["summarise_schedule"].apply(diary,test["args"])
            )["toEqual"](test["expected"]);
        });

    });

    it(`calculates the correct daily activities`, function() {

        var tests = [

            {
                "records": [],
                "args": [],
                "expected": [
                ],
            },

            /*
             * Base date generated with: date -d "2010-01-01T00:00:00.000" +%s000:
             */

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1262304000000,
                    },
                ],
                "args": [],
                "expected": [
                    {
                        "start": 1262304000000 - 21600000,
                        "end"  : 1262304000000 + 64800000,
                        "duration": 86400000,
                        "id"   : "2009-12-31T18:00:00.000 Etc/GMT",
                        "year" : 2009,
                        "month": 11,
                        "day"  : 30,
                        "activities": [
                            {
                                "offset_start": 0.25,
                                "offset_time": 0.25,
                                "start": 1262304000000,
                                "time" : 1262304000000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1262304000000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-01-01T00:00:00.000 Etc/GMT",
                                "first_start": "2010-01-01T00:00:00.000 Etc/GMT",
                            }
                        }
                    }
                ],
            },

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1262304000000,
                        "end"  : 1262304000000 + 86400000,
                    },
                ],
                "args": [],
                "expected": [
                    {
                        "start": 1262304000000 - 21600000,
                        "end"  : 1262304000000 + 64800000,
                        "duration": 86400000,
                        "id"   : "2009-12-31T18:00:00.000 Etc/GMT",
                        "year" : 2009,
                        "month": 11,
                        "day"  : 30,
                        "activities": [
                            {
                                "start": 1262304000000,
                                "time" : 1262304000000 + 32400000,
                                "end"  : 1262304000000 + 64800000,
                                "offset_start": 0.25,
                                "offset_end"  : 1,
                                "offset_time" : 0.625,
                                "type" : "start-mid",
                                "index": 0,
                                "record": {
                                    "start": 1262304000000,
                                    "end"  : 1262304000000 + 86400000,
                                    "duration": 86400000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 64800000,
                                "last_start": "2010-01-01T00:00:00.000 Etc/GMT",
                                "first_start": "2010-01-01T00:00:00.000 Etc/GMT",
                                "first_end": "2010-01-01T18:00:00.000 Etc/GMT",
                                "last_end": "2010-01-01T18:00:00.000 Etc/GMT",
                            }
                        }
                    },
                    {
                        "start": 1262304000000 + 64800000,
                        "end"  : 1262304000000 + 151200000,
                        "duration": 86400000,
                        "id": "2010-01-01T18:00:00.000 Etc/GMT",
                        "year" : 2010,
                        "month": 0,
                        "day"  : 0,
                        "activities": [
                            {
                                "start": 1262304000000 + 64800000,
                                "end"  : 1262304000000 + 86400000,
                                "type" : "mid-end",
                                "time" : 1262304000000 + 75600000,
                                "record": {
                                    "is_primary_sleep": true,
                                    "status": "asleep",
                                    "start": 1262304000000,
                                    "end"  : 1262304000000 + 86400000,
                                    "duration": 86400000,
                                    "start_of_new_day": true,
                                    "day_number": 2,
                                },
                                "index": 1,
                                "offset_start": 0,
                                "offset_end": 0.25,
                                "offset_time": 0.125,
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 21600000,
                                "last_start": "2010-01-01T18:00:00.000 Etc/GMT",
                                "first_start": "2010-01-01T18:00:00.000 Etc/GMT",
                                "last_end": "2010-01-02T00:00:00.000 Etc/GMT",
                                "first_end": "2010-01-02T00:00:00.000 Etc/GMT",
                            }
                        }
                    },
                ],
            },

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1262304000000,
                        "end"  : 1262304000000 + 172800000,
                    },
                ],
                "args": [],
                "expected": [
                    {
                        "start": 1262304000000 - 21600000,
                        "end"  : 1262304000000 + 64800000,
                        "duration": 86400000,
                        "id"   : "2009-12-31T18:00:00.000 Etc/GMT",
                        "year" : 2009,
                        "month": 11,
                        "day"  : 30,
                        "activities": [
                            {
                                "start": 1262304000000,
                                "time" : 1262304000000 + 32400000,
                                "end"  : 1262304000000 + 64800000,
                                "offset_start": 0.25,
                                "offset_end"  : 1,
                                "offset_time" : 0.625,
                                "type" : "start-mid",
                                "index": 0,
                                "record": {
                                    "start": 1262304000000,
                                    "end"  : 1262304000000 + 172800000,
                                    "duration": 172800000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 64800000,
                                "last_start": "2010-01-01T00:00:00.000 Etc/GMT",
                                "first_start": "2010-01-01T00:00:00.000 Etc/GMT",
                                "first_end": "2010-01-01T18:00:00.000 Etc/GMT",
                                "last_end": "2010-01-01T18:00:00.000 Etc/GMT",
                            }
                        }
                    },
                    {
                        "start": 1262304000000 + 64800000,
                        "end"  : 1262304000000 + 151200000,
                        "duration": 86400000,
                        "id": "2010-01-01T18:00:00.000 Etc/GMT",
                        "year" : 2010,
                        "month": 0,
                        "day"  : 0,
                        "activities": [
                            {
                                "start": 1262304000000 + 64800000,
                                "end"  : 1262304000000 + 151200000,
                                "type" : "mid-mid",
                                "time" : 1262304000000 + 108000000,
                                "record": {
                                    "is_primary_sleep": true,
                                    "status": "asleep",
                                    "start": 1262304000000,
                                    "end"  : 1262304000000 + 172800000,
                                    "duration": 172800000,
                                    "start_of_new_day": true,
                                    "day_number": 2,
                                },
                                "index": 1,
                                "offset_start": 0,
                                "offset_end": 1,
                                "offset_time": 0.5,
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 86400000,
                                "first_start": "2010-01-01T18:00:00.000 Etc/GMT",
                                "last_start": "2010-01-01T18:00:00.000 Etc/GMT",
                                "first_end": "2010-01-02T18:00:00.000 Etc/GMT",
                                "last_end": "2010-01-02T18:00:00.000 Etc/GMT",
                            }
                        }
                    },
                    {
                        "start": 1262304000000 + 151200000,
                        "end"  : 1262304000000 + 237600000,
                        "duration": 86400000,
                        "id"   : "2010-01-02T18:00:00.000 Etc/GMT",
                        "year" : 2010,
                        "month": 0,
                        "day": 1,
                        "activities": [
                            {
                                "start": 1262304000000 + 151200000,
                                "end"  : 1262304000000 + 172800000,
                                "type" : "mid-end",
                                "time" : 1262304000000 + 162000000,
                                "record": {
                                    "is_primary_sleep": true,
                                    "status": "asleep",
                                    "start": 1262304000000,
                                    "end"  : 1262304000000 + 172800000,
                                    "duration": 172800000,
                                    "start_of_new_day": true,
                                    "day_number": 2,
                                },
                                "index": 2,
                                "offset_start": 0,
                                "offset_end"  : 0.25,
                                "offset_time" : 0.125,
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 21600000,
                                "first_start": "2010-01-02T18:00:00.000 Etc/GMT",
                                "last_start": "2010-01-02T18:00:00.000 Etc/GMT",
                                "first_end": "2010-01-03T00:00:00.000 Etc/GMT",
                                "last_end": "2010-01-03T00:00:00.000 Etc/GMT",
                            }
                        }
                    },
                ],
            },

            /*
             * Base date generated with: date -d "2010-03-28T00:00:00.000" +%s000
             */

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1269734400000,
                    },
                ],
                "args": [],
                "expected": [
                    {
                        "start": 1269734400000 - 21600000,
                        "end"  : 1269734400000 + 64800000,
                        "duration": 86400000,
                        "id"   : "2010-03-27T18:00:00.000 Etc/GMT",
                        "year" : 2010,
                        "month": 2,
                        "day"  : 26,
                        "activities": [
                            {
                                "offset_start": 0.25,
                                "offset_time": 0.25,
                                "start": 1269734400000,
                                "time" : 1269734400000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1269734400000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-03-28T00:00:00.000 Etc/GMT",
                                "first_start": "2010-03-28T00:00:00.000 Etc/GMT",
                            }
                        }
                    }
                ],
            },

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1269734400000,
                        "end"  : 1269734400000 + 86400000,
                    },
                ],
                "args": [],
                "expected": [
                    {
                        "start": 1269734400000 - 21600000,
                        "end"  : 1269734400000 + 64800000,
                        "duration": 86400000,
                        "id"   : "2010-03-27T18:00:00.000 Etc/GMT",
                        "year" : 2010,
                        "month": 2,
                        "day"  : 26,
                        "activities": [
                            {
                                "start": 1269734400000,
                                "time" : 1269734400000 + 32400000,
                                "end"  : 1269734400000 + 64800000,
                                "offset_start": 0.25,
                                "offset_end"  : 1,
                                "offset_time" : 0.625,
                                "type" : "start-mid",
                                "index": 0,
                                "record": {
                                    "start": 1269734400000,
                                    "end"  : 1269734400000 + 86400000,
                                    "duration": 86400000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 64800000,
                                "last_start": "2010-03-28T00:00:00.000 Etc/GMT",
                                "first_start": "2010-03-28T00:00:00.000 Etc/GMT",
                                "first_end": "2010-03-28T18:00:00.000 Etc/GMT",
                                "last_end": "2010-03-28T18:00:00.000 Etc/GMT",
                            }
                        }
                    },
                    {
                        "start": 1269734400000 + 64800000,
                        "end"  : 1269734400000 + 151200000,
                        "duration": 86400000,
                        "id"   : "2010-03-28T18:00:00.000 Etc/GMT",
                        "year" : 2010,
                        "month": 2,
                        "day"  : 27,
                        "activities": [
                            {
                                "start": 1269734400000 + 64800000,
                                "end"  : 1269734400000 + 86400000,
                                "type" : "mid-end",
                                "time" : 1269734400000 + 75600000,
                                "record": {
                                    "is_primary_sleep": true,
                                    "status": "asleep",
                                    "start": 1269734400000,
                                    "end"  : 1269734400000 + 86400000,
                                    "duration": 86400000,
                                    "start_of_new_day": true,
                                    "day_number": 2,
                                },
                                "index": 1,
                                "offset_start": 0,
                                "offset_end": 0.25,
                                "offset_time": 0.125,
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 21600000,
                                "last_start": "2010-03-28T18:00:00.000 Etc/GMT",
                                "first_start": "2010-03-28T18:00:00.000 Etc/GMT",
                                "last_end": "2010-03-29T00:00:00.000 Etc/GMT",
                                "first_end": "2010-03-29T00:00:00.000 Etc/GMT",
                            }
                        }
                    },
                ],
            },

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1269734400000,
                        "end"  : 1269734400000 + 172800000,
                    },
                ],
                "args": [],
                "expected": [
                    {
                        "start": 1269734400000 - 21600000,
                        "end"  : 1269734400000 + 64800000,
                        "duration": 86400000,
                        "id"   : "2010-03-27T18:00:00.000 Etc/GMT",
                        "year" : 2010,
                        "month": 2,
                        "day"  : 26,
                        "activities": [
                            {
                                "start": 1269734400000,
                                "time" : 1269734400000 + 32400000,
                                "end"  : 1269734400000 + 64800000,
                                "offset_start": 0.25,
                                "offset_end"  : 1,
                                "offset_time" : 0.625,
                                "type" : "start-mid",
                                "index": 0,
                                "record": {
                                    "start": 1269734400000,
                                    "end"  : 1269734400000 + 172800000,
                                    "duration": 172800000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 64800000,
                                "last_start": "2010-03-28T00:00:00.000 Etc/GMT",
                                "first_start": "2010-03-28T00:00:00.000 Etc/GMT",
                                "first_end": "2010-03-28T18:00:00.000 Etc/GMT",
                                "last_end": "2010-03-28T18:00:00.000 Etc/GMT",
                            }
                        }
                    },
                    {
                        "start": 1269734400000 + 64800000,
                        "end"  : 1269734400000 + 151200000,
                        "duration": 86400000,
                        "id"   : "2010-03-28T18:00:00.000 Etc/GMT",
                        "year" : 2010,
                        "month": 2,
                        "day"  : 27,
                        "activities": [
                            {
                                "start": 1269734400000 + 64800000,
                                "end"  : 1269734400000 + 151200000,
                                "type" : "mid-mid",
                                "time" : 1269734400000 + 108000000,
                                "record": {
                                    "is_primary_sleep": true,
                                    "status": "asleep",
                                    "start": 1269734400000,
                                    "end"  : 1269734400000 + 172800000,
                                    "duration": 172800000,
                                    "start_of_new_day": true,
                                    "day_number": 2,
                                },
                                "index": 1,
                                "offset_start": 0,
                                "offset_end": 1,
                                "offset_time": 0.5,
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 86400000,
                                "first_start": "2010-03-28T18:00:00.000 Etc/GMT",
                                "last_start": "2010-03-28T18:00:00.000 Etc/GMT",
                                "first_end": "2010-03-29T18:00:00.000 Etc/GMT",
                                "last_end": "2010-03-29T18:00:00.000 Etc/GMT",
                            }
                        }
                    },
                    {
                        "start": 1269734400000 + 151200000,
                        "end"  : 1269734400000 + 237600000,
                        "duration": 86400000,
                        "id"   : "2010-03-29T18:00:00.000 Etc/GMT",
                        "year" : 2010,
                        "month": 2,
                        "day"  : 28,
                        "activities": [
                            {
                                "start": 1269734400000 + 151200000,
                                "end"  : 1269734400000 + 172800000,
                                "type" : "mid-end",
                                "time" : 1269734400000 + 162000000,
                                "record": {
                                    "is_primary_sleep": true,
                                    "status": "asleep",
                                    "start": 1269734400000,
                                    "end"  : 1269734400000 + 172800000,
                                    "duration": 172800000,
                                    "start_of_new_day": true,
                                    "day_number": 2,
                                },
                                "index": 2,
                                "offset_start": 0,
                                "offset_end"  : 0.25,
                                "offset_time" : 0.125,
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 21600000,
                                "first_start": "2010-03-29T18:00:00.000 Etc/GMT",
                                "last_start": "2010-03-29T18:00:00.000 Etc/GMT",
                                "first_end": "2010-03-30T00:00:00.000 Etc/GMT",
                                "last_end": "2010-03-30T00:00:00.000 Etc/GMT",
                            }
                        }
                    },
                ],
            },

            /*
             * As above, but timezone is Europe/London
             */

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1269734400000,
                    },
                ],
                "args": ["Europe/London"],
                "expected": [
                    {
                        "start": 1269734400000 - 21600000,
                        "end"  : 1269734400000 + 61200000,
                        "duration": 82800000,
                        "id"   : "2010-03-27T18:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 2,
                        "day"  : 26,
                        "activities": [
                            {
                                "offset_start": 0.2608695652173913,
                                "offset_time": 0.2608695652173913,
                                "start": 1269734400000,
                                "time" : 1269734400000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1269734400000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-03-28T00:00:00.000 Europe/London",
                                "first_start": "2010-03-28T00:00:00.000 Europe/London",
                            }
                        }
                    }
                ],
            },

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1269734400000,
                        "end"  : 1269734400000 + 86400000,
                    },
                ],
                "args": ["Europe/London"],
                "expected": [
                    {
                        "start": 1269734400000 - 21600000,
                        "end"  : 1269734400000 + 61200000,
                        "duration": 82800000,
                        "id"   : "2010-03-27T18:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 2,
                        "day"  : 26,
                        "activities": [
                            {
                                "start": 1269734400000,
                                "time" : 1269734400000 + 30600000,
                                "end"  : 1269734400000 + 61200000,
                                "offset_start": 0.2608695652173913,
                                "offset_end"  : 1,
                                "offset_time" : 0.6304347826086957,
                                "type" : "start-mid",
                                "index": 0,
                                "record": {
                                    "start": 1269734400000,
                                    "end"  : 1269734400000 + 86400000,
                                    "duration": 86400000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 61200000,
                                "last_start": "2010-03-28T00:00:00.000 Europe/London",
                                "first_start": "2010-03-28T00:00:00.000 Europe/London",
                                "first_end": "2010-03-28T18:00:00.000 Europe/London",
                                "last_end": "2010-03-28T18:00:00.000 Europe/London",
                            }
                        }
                    },
                    {
                        "start": 1269734400000 + 61200000,
                        "end"  : 1269734400000 + 147600000,
                        "duration": 86400000,
                        "id"   : "2010-03-28T18:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 2,
                        "day"  : 27,
                        "activities": [
                            {
                                "start": 1269734400000 + 61200000,
                                "end"  : 1269734400000 + 86400000,
                                "type" : "mid-end",
                                "time" : 1269734400000 + 73800000,
                                "record": {
                                    "is_primary_sleep": true,
                                    "status": "asleep",
                                    "start": 1269734400000,
                                    "end"  : 1269734400000 + 86400000,
                                    "duration": 86400000,
                                    "start_of_new_day": true,
                                    "day_number": 2,
                                },
                                "index": 1,
                                "offset_start": 0,
                                "offset_end": 0.2916666666666667,
                                "offset_time": 0.14583333333333334,
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 25200000,
                                "last_start": "2010-03-28T18:00:00.000 Europe/London",
                                "first_start": "2010-03-28T18:00:00.000 Europe/London",
                                "last_end": "2010-03-29T01:00:00.000 Europe/London",
                                "first_end": "2010-03-29T01:00:00.000 Europe/London",
                            }
                        }
                    },
                ],
            },

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1269734400000,
                        "end"  : 1269734400000 + 172800000,
                    },
                ],
                "args": ["Europe/London"],
                "expected": [
                    {
                        "start": 1269734400000 - 21600000,
                        "end"  : 1269734400000 + 61200000,
                        "duration": 82800000,
                        "id"   : "2010-03-27T18:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 2,
                        "day"  : 26,
                        "activities": [
                            {
                                "start": 1269734400000,
                                "time" : 1269734400000 + 30600000,
                                "end"  : 1269734400000 + 61200000,
                                "offset_start": 0.2608695652173913,
                                "offset_end"  : 1,
                                "offset_time" : 0.6304347826086957,
                                "type" : "start-mid",
                                "index": 0,
                                "record": {
                                    "start": 1269734400000,
                                    "end"  : 1269734400000 + 172800000,
                                    "duration": 172800000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 61200000,
                                "last_start": "2010-03-28T00:00:00.000 Europe/London",
                                "first_start": "2010-03-28T00:00:00.000 Europe/London",
                                "first_end": "2010-03-28T18:00:00.000 Europe/London",
                                "last_end": "2010-03-28T18:00:00.000 Europe/London",
                            }
                        }
                    },
                    {
                        "start": 1269734400000 + 61200000,
                        "end"  : 1269734400000 + 147600000,
                        "duration": 86400000,
                        "id"   : "2010-03-28T18:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 2,
                        "day"  : 27,
                        "activities": [
                            {
                                "start": 1269734400000 + 61200000,
                                "end"  : 1269734400000 + 147600000,
                                "type" : "mid-mid",
                                "time" : 1269734400000 + 104400000,
                                "record": {
                                    "is_primary_sleep": true,
                                    "status": "asleep",
                                    "start": 1269734400000,
                                    "end"  : 1269734400000 + 172800000,
                                    "duration": 172800000,
                                    "start_of_new_day": true,
                                    "day_number": 2,
                                },
                                "index": 1,
                                "offset_start": 0,
                                "offset_end": 1,
                                "offset_time": 0.5,
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 86400000,
                                "first_start": "2010-03-28T18:00:00.000 Europe/London",
                                "last_start": "2010-03-28T18:00:00.000 Europe/London",
                                "first_end": "2010-03-29T18:00:00.000 Europe/London",
                                "last_end": "2010-03-29T18:00:00.000 Europe/London",
                            }
                        }
                    },
                    {
                        "start": 1269734400000 + 147600000,
                        "end"  : 1269734400000 + 234000000,
                        "duration": 86400000,
                        "id"   : "2010-03-29T18:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 2,
                        "day"  : 28,
                        "activities": [
                            {
                                "start": 1269734400000 + 147600000,
                                "end"  : 1269734400000 + 172800000,
                                "type" : "mid-end",
                                "time" : 1269734400000 + 160200000,
                                "record": {
                                    "is_primary_sleep": true,
                                    "status": "asleep",
                                    "start": 1269734400000,
                                    "end"  : 1269734400000 + 172800000,
                                    "duration": 172800000,
                                    "start_of_new_day": true,
                                    "day_number": 2,
                                },
                                "index": 2,
                                "offset_start": 0,
                                "offset_end"  : 0.2916666666666667,
                                "offset_time" : 0.14583333333333334,
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 25200000,
                                "first_start": "2010-03-29T18:00:00.000 Europe/London",
                                "last_start": "2010-03-29T18:00:00.000 Europe/London",
                                "first_end": "2010-03-30T01:00:00.000 Europe/London",
                                "last_end": "2010-03-30T01:00:00.000 Europe/London",
                            }
                        }
                    },
                ],
            },

            /*
             * Base date generated with: date -d "2010-10-31T00:00:00.000" +%s000
             */

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1288479600000,
                    },
                ],
                "args": ["Europe/London"],
                "expected": [
                    {
                        "start": 1288479600000 - 21600000,
                        "end"  : 1288479600000 + 68400000,
                        "duration": 90000000,
                        "id"   : "2010-10-30T18:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 9,
                        "day"  : 29,
                        "activities": [
                            {
                                "offset_start": 0.24,
                                "offset_time": 0.24,
                                "start": 1288479600000,
                                "time" : 1288479600000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1288479600000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-10-31T00:00:00.000 Europe/London",
                                "first_start": "2010-10-31T00:00:00.000 Europe/London",
                            }
                        }
                    }
                ],
            },

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1288479600000,
                        "end"  : 1288479600000 + 86400000,
                    },
                ],
                "args": ["Europe/London"],
                "expected": [
                    {
                        "start": 1288479600000 - 21600000,
                        "end"  : 1288479600000 + 68400000,
                        "duration": 90000000,
                        "id"   : "2010-10-30T18:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 9,
                        "day"  : 29,
                        "activities": [
                            {
                                "start": 1288479600000,
                                "time" : 1288479600000 + 34200000,
                                "end"  : 1288479600000 + 68400000,
                                "offset_start": 0.24,
                                "offset_end"  : 1,
                                "offset_time" : 0.62,
                                "type" : "start-mid",
                                "index": 0,
                                "record": {
                                    "start": 1288479600000,
                                    "end"  : 1288479600000 + 86400000,
                                    "duration": 86400000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 68400000,
                                "last_start": "2010-10-31T00:00:00.000 Europe/London",
                                "first_start": "2010-10-31T00:00:00.000 Europe/London",
                                "first_end": "2010-10-31T18:00:00.000 Europe/London",
                                "last_end": "2010-10-31T18:00:00.000 Europe/London",
                            }
                        }
                    },
                    {
                        "start": 1288479600000 + 68400000,
                        "end"  : 1288479600000 + 154800000,
                        "duration": 86400000,
                        "id"   : "2010-10-31T18:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 9,
                        "day"  : 30,
                        "activities": [
                            {
                                "start": 1288479600000 + 68400000,
                                "end"  : 1288479600000 + 86400000,
                                "type" : "mid-end",
                                "time" : 1288479600000 + 77400000,
                                "record": {
                                    "is_primary_sleep": true,
                                    "status": "asleep",
                                    "start": 1288479600000,
                                    "end"  : 1288479600000 + 86400000,
                                    "duration": 86400000,
                                    "start_of_new_day": true,
                                    "day_number": 2,
                                },
                                "index": 1,
                                "offset_start": 0,
                                "offset_end": 0.20833333333333334,
                                "offset_time": 0.10416666666666667,
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 18000000,
                                "last_start": "2010-10-31T18:00:00.000 Europe/London",
                                "first_start": "2010-10-31T18:00:00.000 Europe/London",
                                "last_end": "2010-10-31T23:00:00.000 Europe/London",
                                "first_end": "2010-10-31T23:00:00.000 Europe/London",
                            }
                        }
                    },
                ],
            },

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1288479600000,
                        "end"  : 1288479600000 + 172800000,
                    },
                ],
                "args": ["Europe/London"],
                "expected": [
                    {
                        "start": 1288479600000 - 21600000,
                        "end"  : 1288479600000 + 68400000,
                        "duration": 90000000,
                        "id"   : "2010-10-30T18:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 9,
                        "day"  : 29,
                        "activities": [
                            {
                                "start": 1288479600000,
                                "time" : 1288479600000 + 34200000,
                                "end"  : 1288479600000 + 68400000,
                                "offset_start": 0.24,
                                "offset_end"  : 1,
                                "offset_time" : 0.62,
                                "type" : "start-mid",
                                "index": 0,
                                "record": {
                                    "start": 1288479600000,
                                    "end"  : 1288479600000 + 172800000,
                                    "duration": 172800000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 68400000,
                                "last_start": "2010-10-31T00:00:00.000 Europe/London",
                                "first_start": "2010-10-31T00:00:00.000 Europe/London",
                                "first_end": "2010-10-31T18:00:00.000 Europe/London",
                                "last_end": "2010-10-31T18:00:00.000 Europe/London",
                            }
                        }
                    },
                    {
                        "start": 1288479600000 + 68400000,
                        "end"  : 1288479600000 + 154800000,
                        "duration": 86400000,
                        "id"   : "2010-10-31T18:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 9,
                        "day"  : 30,
                        "activities": [
                            {
                                "start": 1288479600000 + 68400000,
                                "end"  : 1288479600000 + 154800000,
                                "type" : "mid-mid",
                                "time" : 1288479600000 + 111600000,
                                "record": {
                                    "is_primary_sleep": true,
                                    "status": "asleep",
                                    "start": 1288479600000,
                                    "end"  : 1288479600000 + 172800000,
                                    "duration": 172800000,
                                    "start_of_new_day": true,
                                    "day_number": 2,
                                },
                                "index": 1,
                                "offset_start": 0,
                                "offset_end": 1,
                                "offset_time": 0.5,
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 86400000,
                                "first_start": "2010-10-31T18:00:00.000 Europe/London",
                                "last_start": "2010-10-31T18:00:00.000 Europe/London",
                                "first_end": "2010-11-01T18:00:00.000 Europe/London",
                                "last_end": "2010-11-01T18:00:00.000 Europe/London",
                            }
                        }
                    },
                    {
                        "start": 1288479600000 + 154800000,
                        "end"  : 1288479600000 + 241200000,
                        "duration": 86400000,
                        "id"   : "2010-11-01T18:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 10,
                        "day"  : 0,
                        "activities": [
                            {
                                "start": 1288479600000 + 154800000,
                                "end"  : 1288479600000 + 172800000,
                                "type" : "mid-end",
                                "time" : 1288479600000 + 163800000,
                                "record": {
                                    "is_primary_sleep": true,
                                    "status": "asleep",
                                    "start": 1288479600000,
                                    "end"  : 1288479600000 + 172800000,
                                    "duration": 172800000,
                                    "start_of_new_day": true,
                                    "day_number": 2,
                                },
                                "index": 2,
                                "offset_start": 0,
                                "offset_end"  : 0.20833333333333334,
                                "offset_time" : 0.10416666666666667,
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 18000000,
                                "first_start": "2010-11-01T18:00:00.000 Europe/London",
                                "last_start": "2010-11-01T18:00:00.000 Europe/London",
                                "first_end": "2010-11-01T23:00:00.000 Europe/London",
                                "last_end": "2010-11-01T23:00:00.000 Europe/London",
                            }
                        }
                    },
                ],
            },

            /*
             * Base date generated with: date -d "2010-12-31T00:00:00.000" +%s000
             */

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1293753600000,
                    },
                ],
                "args": ["Europe/London"],
                "expected": [
                    {
                        "start": 1293753600000 - 21600000,
                        "end"  : 1293753600000 + 64800000,
                        "duration": 86400000,
                        "id"   : "2010-12-30T18:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 11,
                        "day"  : 29,
                        "activities": [
                            {
                                "offset_start": 0.25,
                                "offset_time": 0.25,
                                "start": 1293753600000,
                                "time" : 1293753600000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1293753600000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-12-31T00:00:00.000 Europe/London",
                                "first_start": "2010-12-31T00:00:00.000 Europe/London",
                            }
                        }
                    }
                ],
            },

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1293753600000,
                        "end"  : 1293753600000 + 86400000,
                    },
                ],
                "args": ["Europe/London"],
                "expected": [
                    {
                        "start": 1293753600000 - 21600000,
                        "end"  : 1293753600000 + 64800000,
                        "duration": 86400000,
                        "id"   : "2010-12-30T18:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 11,
                        "day"  : 29,
                        "activities": [
                            {
                                "start": 1293753600000,
                                "time" : 1293753600000 + 32400000,
                                "end"  : 1293753600000 + 64800000,
                                "offset_start": 0.25,
                                "offset_end"  : 1,
                                "offset_time" : 0.625,
                                "type" : "start-mid",
                                "index": 0,
                                "record": {
                                    "start": 1293753600000,
                                    "end"  : 1293753600000 + 86400000,
                                    "duration": 86400000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 64800000,
                                "last_start": "2010-12-31T00:00:00.000 Europe/London",
                                "first_start": "2010-12-31T00:00:00.000 Europe/London",
                                "first_end": "2010-12-31T18:00:00.000 Europe/London",
                                "last_end": "2010-12-31T18:00:00.000 Europe/London",
                            }
                        }
                    },
                    {
                        "start": 1293753600000 + 64800000,
                        "end"  : 1293753600000 + 151200000,
                        "duration": 86400000,
                        "id"   : "2010-12-31T18:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 11,
                        "day"  : 30,
                        "activities": [
                            {
                                "start": 1293753600000 + 64800000,
                                "end"  : 1293753600000 + 86400000,
                                "type" : "mid-end",
                                "time" : 1293753600000 + 75600000,
                                "record": {
                                    "is_primary_sleep": true,
                                    "status": "asleep",
                                    "start": 1293753600000,
                                    "end"  : 1293753600000 + 86400000,
                                    "duration": 86400000,
                                    "start_of_new_day": true,
                                    "day_number": 2,
                                },
                                "index": 1,
                                "offset_start": 0,
                                "offset_end": 0.25,
                                "offset_time": 0.125,
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 21600000,
                                "last_start": "2010-12-31T18:00:00.000 Europe/London",
                                "first_start": "2010-12-31T18:00:00.000 Europe/London",
                                "last_end": "2011-01-01T00:00:00.000 Europe/London",
                                "first_end": "2011-01-01T00:00:00.000 Europe/London",
                            }
                        }
                    },
                ],
            },

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1293753600000,
                        "end"  : 1293753600000 + 172800000,
                    },
                ],
                "args": ["Europe/London"],
                "expected": [
                    {
                        "start": 1293753600000 - 21600000,
                        "end"  : 1293753600000 + 64800000,
                        "duration": 86400000,
                        "id"   : "2010-12-30T18:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 11,
                        "day"  : 29,
                        "activities": [
                            {
                                "start": 1293753600000,
                                "time" : 1293753600000 + 32400000,
                                "end"  : 1293753600000 + 64800000,
                                "offset_start": 0.25,
                                "offset_end"  : 1,
                                "offset_time" : 0.625,
                                "type" : "start-mid",
                                "index": 0,
                                "record": {
                                    "start": 1293753600000,
                                    "end"  : 1293753600000 + 172800000,
                                    "duration": 172800000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 64800000,
                                "last_start": "2010-12-31T00:00:00.000 Europe/London",
                                "first_start": "2010-12-31T00:00:00.000 Europe/London",
                                "first_end": "2010-12-31T18:00:00.000 Europe/London",
                                "last_end": "2010-12-31T18:00:00.000 Europe/London",
                            }
                        }
                    },
                    {
                        "start": 1293753600000 + 64800000,
                        "end"  : 1293753600000 + 151200000,
                        "duration": 86400000,
                        "id"   : "2010-12-31T18:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 11,
                        "day"  : 30,
                        "activities": [
                            {
                                "start": 1293753600000 + 64800000,
                                "end"  : 1293753600000 + 151200000,
                                "type" : "mid-mid",
                                "time" : 1293753600000 + 108000000,
                                "record": {
                                    "is_primary_sleep": true,
                                    "status": "asleep",
                                    "start": 1293753600000,
                                    "end"  : 1293753600000 + 172800000,
                                    "duration": 172800000,
                                    "start_of_new_day": true,
                                    "day_number": 2,
                                },
                                "index": 1,
                                "offset_start": 0,
                                "offset_end": 1,
                                "offset_time": 0.5,
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 86400000,
                                "first_start": "2010-12-31T18:00:00.000 Europe/London",
                                "last_start": "2010-12-31T18:00:00.000 Europe/London",
                                "first_end": "2011-01-01T18:00:00.000 Europe/London",
                                "last_end": "2011-01-01T18:00:00.000 Europe/London",
                            }
                        }
                    },
                    {
                        "start": 1293753600000 + 151200000,
                        "end"  : 1293753600000 + 237600000,
                        "duration": 86400000,
                        "id"   : "2011-01-01T18:00:00.000 Europe/London",
                        "year" : 2011,
                        "month": 0,
                        "day"  : 0,
                        "activities": [
                            {
                                "start": 1293753600000 + 151200000,
                                "end"  : 1293753600000 + 172800000,
                                "type" : "mid-end",
                                "time" : 1293753600000 + 162000000,
                                "record": {
                                    "is_primary_sleep": true,
                                    "status": "asleep",
                                    "start": 1293753600000,
                                    "end"  : 1293753600000 + 172800000,
                                    "duration": 172800000,
                                    "start_of_new_day": true,
                                    "day_number": 2,
                                },
                                "index": 2,
                                "offset_start": 0,
                                "offset_end"  : 0.25,
                                "offset_time" : 0.125,
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": 21600000,
                                "first_start": "2011-01-01T18:00:00.000 Europe/London",
                                "last_start": "2011-01-01T18:00:00.000 Europe/London",
                                "first_end": "2011-01-02T00:00:00.000 Europe/London",
                                "last_end": "2011-01-02T00:00:00.000 Europe/London",
                            }
                        }
                    },
                ],
            },

            /*
             * Base date generated with: date -d "2010-01-01T00:00:00.000" +%s000,
             * day starts at 00:00 Etc/GMT
             */

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1262304000000,
                    },
                ],
                "args": [ "Etc/GMT", 0 ],
                "expected": [
                    {
                        "start": 1262304000000,
                        "end"  : 1262304000000 + 86400000,
                        "duration": 86400000,
                        "id"   : "2010-01-01T00:00:00.000 Etc/GMT",
                        "year" : 2010,
                        "month": 0,
                        "day"  : 0,
                        "activities": [
                            {
                                "offset_start": 0,
                                "offset_time": 0,
                                "start": 1262304000000,
                                "time" : 1262304000000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1262304000000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-01-01T00:00:00.000 Etc/GMT",
                                "first_start": "2010-01-01T00:00:00.000 Etc/GMT",
                            }
                        }
                    }
                ],
            },

            /*
             * Base date generated with: date -d "2010-01-01T00:00:00.000" +%s000,
             * day starts at 00:00, Etc/GMT-1
             */

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1262304000000,
                    },
                ],
                "args": [ "Etc/GMT-1", 0 ],
                "expected": [
                    {
                        "start": 1262304000000            - 3600000,
                        "end"  : 1262304000000 + 86400000 - 3600000,
                        "duration": 86400000,
                        "id"   : "2010-01-01T00:00:00.000 Etc/GMT-1",
                        "year" : 2010,
                        "month": 0,
                        "day"  : 0,
                        "activities": [
                            {
                                "offset_start": 0.041666666666666664,
                                "offset_time": 0.041666666666666664,
                                "start": 1262304000000,
                                "time" : 1262304000000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1262304000000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-01-01T01:00:00.000 Etc/GMT-1",
                                "first_start": "2010-01-01T01:00:00.000 Etc/GMT-1",
                            }
                        }
                    }
                ],
            },

            /*
             * Base date generated with: date -d "2010-01-01T00:00:00.000" +%s000,
             * day starts at 00:00 Etc/GMT, short day_stride
             */

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1262304000000,
                    },
                ],
                "args": [ "Etc/GMT", 0, 3600000 ],
                "expected": [
                    {
                        "start": 1262304000000,
                        "end"  : 1262304000000 + 3600000,
                        "duration": 3600000,
                        "id"   : "2010-01-01T00:00:00.000 Etc/GMT",
                        "year" : 2010,
                        "month": 0,
                        "day"  : 0,
                        "activities": [
                            {
                                "offset_start": 0,
                                "offset_time": 0,
                                "start": 1262304000000,
                                "time" : 1262304000000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1262304000000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-01-01T00:00:00.000 Etc/GMT",
                                "first_start": "2010-01-01T00:00:00.000 Etc/GMT",
                            }
                        }
                    }
                ],
            },

            /*
             * Base date generated with: date -d "2010-01-01T18:30:00.000" +%s000
             * day starts at 00:00 Etc/GMT, short day_stride
             */

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1262370600000,
                    },
                ],
                "args": [ "Etc/GMT", 0, 3600000 ],
                "expected": [
                    ,,,,,,,,,,,,,,,,,,
                    {
                        "start": 1262368800000,
                        "end"  : 1262368800000 + 3600000,
                        "duration": 3600000,
                        "id"   : "2010-01-01T18:00:00.000 Etc/GMT",
                        "year" : 2010,
                        "month": 0,
                        "day"  : 0,
                        "activities": [
                            {
                                "offset_start": 0.5,
                                "offset_time": 0.5,
                                "start": 1262370600000,
                                "time" : 1262370600000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1262370600000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-01-01T18:30:00.000 Etc/GMT",
                                "first_start": "2010-01-01T18:30:00.000 Etc/GMT",
                            }
                        }
                    }
                ],
            },

            /*
             * Base date generated with: date -d "2010-03-28T02:00:00.000" +%s000
             * day_start is 01:30, which is an invalid date on this day
             */

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1269738000000,
                    },
                ],
                "args": [ "Europe/London", 5400000 ],
                "expected": [
                    ,
                    {
                        "start": 1269736200000,
                        "end"  : 1269819000000,
                        "duration": 86400000 - 3600000,
                        "id"   : "2010-03-28T00:30:00.000 Europe/London",
                        "year" : 2010,
                        "month": 2,
                        "day"  : 27,
                        "activities": [
                            {
                                "offset_start": 0.021739130434782608,
                                "offset_time": 0.021739130434782608,
                                "start": 1269738000000,
                                "time" : 1269738000000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1269738000000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-03-28T02:00:00.000 Europe/London",
                                "first_start": "2010-03-28T02:00:00.000 Europe/London",
                            }
                        }
                    }
                ],
            },

            /*
             * Base date generated with: date -d "2010-01-01T12:00:00.000" +%s000
             * day_start is 6am/6pm
             */

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1262347200000,
                    },
                ],
                "args": [ "Etc/GMT", 86400000*1/4 ],
                "expected": [
                    {
                        "start": 1262347200000 - 86400000*1/4,
                        "end"  : 1262347200000 + 86400000*3/4,
                        "duration": 86400000,
                        "id"   : "2010-01-01T06:00:00.000 Etc/GMT",
                        "year" : 2010,
                        "month": 0,
                        "day"  : 0,
                        "activities": [
                            {
                                "offset_start": 0.25,
                                "offset_time": 0.25,
                                "start": 1262347200000,
                                "time" : 1262347200000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1262347200000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-01-01T12:00:00.000 Etc/GMT",
                                "first_start": "2010-01-01T12:00:00.000 Etc/GMT",
                            }
                        }
                    }
                ],
            },
            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1262347200000,
                    },
                ],
                "args": [ "Etc/GMT", 86400000*3/4 ],
                "expected": [
                    {
                        "start": 1262347200000 - 86400000*3/4,
                        "end"  : 1262347200000 + 86400000*1/4,
                        "duration": 86400000,
                        "id"   : "2009-12-31T18:00:00.000 Etc/GMT",
                        "year" : 2009,
                        "month": 11,
                        "day"  : 30,
                        "activities": [
                            {
                                "offset_start": 0.75,
                                "offset_time": 0.75,
                                "start": 1262347200000,
                                "time" : 1262347200000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1262347200000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-01-01T12:00:00.000 Etc/GMT",
                                "first_start": "2010-01-01T12:00:00.000 Etc/GMT",
                            }
                        }
                    }
                ],
            },


            /*
             * Base date generated with: date -d "2010-01-01T12:00:00.000" +%s000
             * check different segment_strides
             */

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1262347200000,
                    },
                ],
                "args": [ "Etc/GMT", 86400000*1/4, 86400000, 3600000 ],
                "expected": [
                    {
                        "start": 1262347200000 - 86400000*1/4,
                        "end"  : 1262347200000 + 86400000*3/4,
                        "duration": 86400000,
                        "id"   : "2010-01-01T06:00:00.000 Etc/GMT",
                        "year" : 2010,
                        "month": 0,
                        "day"  : 0,
                        "activities": [
                            {
                                "offset_start": 0.25,
                                "offset_time": 0.25,
                                "start": 1262347200000,
                                "time" : 1262347200000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1262347200000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-01-01T12:00:00.000 Etc/GMT",
                                "first_start": "2010-01-01T12:00:00.000 Etc/GMT",
                            }
                        },
                        "segments": [
                            {"dst_state":"off","id":"2010-01-01T06:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":6,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T07:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":7,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T08:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":8,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T09:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":9,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T10:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":10,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T11:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":11,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T12:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":12,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T13:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":13,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T14:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":14,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T15:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":15,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T16:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":16,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T17:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":17,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T18:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":18,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T19:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":19,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T20:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":20,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T21:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":21,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T22:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":22,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T23:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":23,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-02T00:00:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":0,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-02T01:00:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":1,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-02T02:00:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":2,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-02T03:00:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":3,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-02T04:00:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":4,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-02T05:00:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":5,"minute":0,"second":0},
                        ],
                    },
                ],
            },

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1262347200000,
                    },
                ],
                "args": [ "Etc/GMT", 86400000*1/4, 86400000, 3600000/2 ],
                "expected": [
                    {
                        "start": 1262347200000 - 86400000*1/4,
                        "end"  : 1262347200000 + 86400000*3/4,
                        "duration": 86400000,
                        "id"   : "2010-01-01T06:00:00.000 Etc/GMT",
                        "year" : 2010,
                        "month": 0,
                        "day"  : 0,
                        "activities": [
                            {
                                "offset_start": 0.25,
                                "offset_time": 0.25,
                                "start": 1262347200000,
                                "time" : 1262347200000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1262347200000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-01-01T12:00:00.000 Etc/GMT",
                                "first_start": "2010-01-01T12:00:00.000 Etc/GMT",
                            }
                        },
                        "segments": [
                            {"dst_state":"off","id":"2010-01-01T06:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":6,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T06:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":6,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-01T07:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":7,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T07:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":7,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-01T08:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":8,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T08:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":8,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-01T09:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":9,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T09:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":9,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-01T10:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":10,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T10:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":10,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-01T11:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":11,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T11:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":11,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-01T12:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":12,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T12:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":12,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-01T13:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":13,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T13:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":13,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-01T14:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":14,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T14:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":14,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-01T15:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":15,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T15:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":15,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-01T16:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":16,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T16:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":16,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-01T17:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":17,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T17:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":17,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-01T18:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":18,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T18:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":18,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-01T19:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":19,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T19:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":19,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-01T20:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":20,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T20:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":20,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-01T21:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":21,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T21:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":21,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-01T22:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":22,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T22:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":22,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-01T23:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":23,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T23:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":23,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-02T00:00:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":0,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-02T00:30:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":0,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-02T01:00:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":1,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-02T01:30:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":1,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-02T02:00:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":2,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-02T02:30:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":2,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-02T03:00:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":3,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-02T03:30:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":3,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-02T04:00:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":4,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-02T04:30:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":4,"minute":30,"second":0},
                            {"dst_state":"off","id":"2010-01-02T05:00:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":5,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-02T05:30:00.000 Etc/GMT","year":2010,"month":0,"day":1,"hour":5,"minute":30,"second":0},
                        ],
                    },
                ],
            },

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1262347200000,
                    },
                ],
                "args": [ "Etc/GMT", 86400000*1/4, 86400000, 3600000*12 ],
                "expected": [
                    {
                        "start": 1262347200000 - 86400000*1/4,
                        "end"  : 1262347200000 + 86400000*3/4,
                        "duration": 86400000,
                        "id"   : "2010-01-01T06:00:00.000 Etc/GMT",
                        "year" : 2010,
                        "month": 0,
                        "day"  : 0,
                        "activities": [
                            {
                                "offset_start": 0.25,
                                "offset_time": 0.25,
                                "start": 1262347200000,
                                "time" : 1262347200000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1262347200000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-01-01T12:00:00.000 Etc/GMT",
                                "first_start": "2010-01-01T12:00:00.000 Etc/GMT",
                            }
                        },
                        "segments": [
                            {"dst_state":"off","id":"2010-01-01T06:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":6,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T18:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":18,"minute":0,"second":0},
                        ],
                    },
                ],
            },

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1262347200000,
                    },
                ],
                "args": [ "Etc/GMT", 86400000*1/4, 86400000, 3600000*12.5 ],
                "expected": [
                    {
                        "start": 1262347200000 - 86400000*1/4,
                        "end"  : 1262347200000 + 86400000*3/4,
                        "duration": 86400000,
                        "id"   : "2010-01-01T06:00:00.000 Etc/GMT",
                        "year" : 2010,
                        "month": 0,
                        "day"  : 0,
                        "activities": [
                            {
                                "offset_start": 0.25,
                                "offset_time": 0.25,
                                "start": 1262347200000,
                                "time" : 1262347200000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1262347200000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-01-01T12:00:00.000 Etc/GMT",
                                "first_start": "2010-01-01T12:00:00.000 Etc/GMT",
                            }
                        },
                        "segments": [
                            {"dst_state":"off","id":"2010-01-01T06:00:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":6,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-01-01T18:30:00.000 Etc/GMT","year":2010,"month":0,"day":0,"hour":18,"minute":30,"second":0},
                        ],
                    },
                ],
            },

            /*
             * As above, but base date generated with: date -d "2010-03-28T00:00:00.000" +%s000
             */

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1269734400000,
                    },
                ],
                "args": [ "Europe/London", 86400000*2/4, 86400000, 3600000 ],
                "expected": [
                    {
                        "start": 1269734400000 - 86400000*2/4,
                        "end"  : 1269734400000 + 86400000*2/4 - 3600000,
                        "duration": 86400000 - 3600000,
                        "id"   : "2010-03-27T12:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 2,
                        "day"  : 26,
                        "activities": [
                            {
                                "offset_start": 0.5217391304347826,
                                "offset_time": 0.5217391304347826,
                                "start": 1269734400000,
                                "time" : 1269734400000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1269734400000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-03-28T00:00:00.000 Europe/London",
                                "first_start": "2010-03-28T00:00:00.000 Europe/London",
                            }
                        },
                        "segments": [
                            {"dst_state":"off","id":"2010-03-27T12:00:00.000 Europe/London","year":2010,"month":2,"day":26,"hour":12,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-03-27T13:00:00.000 Europe/London","year":2010,"month":2,"day":26,"hour":13,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-03-27T14:00:00.000 Europe/London","year":2010,"month":2,"day":26,"hour":14,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-03-27T15:00:00.000 Europe/London","year":2010,"month":2,"day":26,"hour":15,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-03-27T16:00:00.000 Europe/London","year":2010,"month":2,"day":26,"hour":16,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-03-27T17:00:00.000 Europe/London","year":2010,"month":2,"day":26,"hour":17,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-03-27T18:00:00.000 Europe/London","year":2010,"month":2,"day":26,"hour":18,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-03-27T19:00:00.000 Europe/London","year":2010,"month":2,"day":26,"hour":19,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-03-27T20:00:00.000 Europe/London","year":2010,"month":2,"day":26,"hour":20,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-03-27T21:00:00.000 Europe/London","year":2010,"month":2,"day":26,"hour":21,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-03-27T22:00:00.000 Europe/London","year":2010,"month":2,"day":26,"hour":22,"minute":0,"second":0},
                            {"dst_state":"off","id":"2010-03-27T23:00:00.000 Europe/London","year":2010,"month":2,"day":26,"hour":23,"minute":0,"second":0},
                            { "dst_state": 'change-forward', "id": '2010-03-28T00:00:00.000 Europe/London', "year": 2010, "month": 2, "day": 27, "hour": 0, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-03-28T02:00:00.000 Europe/London', "year": 2010, "month": 2, "day": 27, "hour": 2, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-03-28T03:00:00.000 Europe/London', "year": 2010, "month": 2, "day": 27, "hour": 3, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-03-28T04:00:00.000 Europe/London', "year": 2010, "month": 2, "day": 27, "hour": 4, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-03-28T05:00:00.000 Europe/London', "year": 2010, "month": 2, "day": 27, "hour": 5, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-03-28T06:00:00.000 Europe/London', "year": 2010, "month": 2, "day": 27, "hour": 6, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-03-28T07:00:00.000 Europe/London', "year": 2010, "month": 2, "day": 27, "hour": 7, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-03-28T08:00:00.000 Europe/London', "year": 2010, "month": 2, "day": 27, "hour": 8, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-03-28T09:00:00.000 Europe/London', "year": 2010, "month": 2, "day": 27, "hour": 9, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-03-28T10:00:00.000 Europe/London', "year": 2010, "month": 2, "day": 27, "hour": 10, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-03-28T11:00:00.000 Europe/London', "year": 2010, "month": 2, "day": 27, "hour": 11, "minute": 0, "second": 0 },
                        ],
                    },
                ],
            },

            /*
             * As above, but base date generated with: date -d "2010-10-31T00:00:00.000" +%s000
             */

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1288479600000,
                    },
                ],
                "args": [ "Europe/London", 86400000*2/4, 86400000, 3600000 ],
                "expected": [
                    {
                        "start": 1288479600000 - 86400000*2/4,
                        "end"  : 1288479600000 + 86400000*2/4 + 3600000,
                        "duration": 86400000 + 3600000,
                        "id"   : "2010-10-30T12:00:00.000 Europe/London",
                        "year" : 2010,
                        "month": 9,
                        "day"  : 29,
                        "activities": [
                            {
                                "offset_start": 0.48,
                                "offset_time": 0.48,
                                "start": 1288479600000,
                                "time" : 1288479600000,
                                "type" : "start-unknown",
                                "index": 0,
                                "record": {
                                    "start": 1288479600000,
                                    "is_primary_sleep": true,
                                    "start_of_new_day": true,
                                    "status": "asleep",
                                    "day_number": 2,
                                },
                            }
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-10-31T00:00:00.000 Europe/London",
                                "first_start": "2010-10-31T00:00:00.000 Europe/London",
                            }
                        },
                        "segments": [
                            { "dst_state": 'on', "id": '2010-10-30T12:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 29, "hour": 12, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-10-30T13:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 29, "hour": 13, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-10-30T14:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 29, "hour": 14, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-10-30T15:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 29, "hour": 15, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-10-30T16:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 29, "hour": 16, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-10-30T17:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 29, "hour": 17, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-10-30T18:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 29, "hour": 18, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-10-30T19:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 29, "hour": 19, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-10-30T20:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 29, "hour": 20, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-10-30T21:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 29, "hour": 21, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-10-30T22:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 29, "hour": 22, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-10-30T23:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 29, "hour": 23, "minute": 0, "second": 0 },
                            { "dst_state": 'on', "id": '2010-10-31T00:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 30, "hour": 0, "minute": 0, "second": 0 },
                            { "dst_state": 'change-back', "id": '2010-10-31T01:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 30, "hour": 1, "minute": 0, "second": 0 },
                            { "dst_state": 'off', "id": '2010-10-31T01:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 30, "hour": 1, "minute": 0, "second": 0 },
                            { "dst_state": 'off', "id": '2010-10-31T02:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 30, "hour": 2, "minute": 0, "second": 0 },
                            { "dst_state": 'off', "id": '2010-10-31T03:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 30, "hour": 3, "minute": 0, "second": 0 },
                            { "dst_state": 'off', "id": '2010-10-31T04:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 30, "hour": 4, "minute": 0, "second": 0 },
                            { "dst_state": 'off', "id": '2010-10-31T05:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 30, "hour": 5, "minute": 0, "second": 0 },
                            { "dst_state": 'off', "id": '2010-10-31T06:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 30, "hour": 6, "minute": 0, "second": 0 },
                            { "dst_state": 'off', "id": '2010-10-31T07:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 30, "hour": 7, "minute": 0, "second": 0 },
                            { "dst_state": 'off', "id": '2010-10-31T08:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 30, "hour": 8, "minute": 0, "second": 0 },
                            { "dst_state": 'off', "id": '2010-10-31T09:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 30, "hour": 9, "minute": 0, "second": 0 },
                            { "dst_state": 'off', "id": '2010-10-31T10:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 30, "hour": 10, "minute": 0, "second": 0 },
                            { "dst_state": 'off', "id": '2010-10-31T11:00:00.000 Europe/London', "year": 2010, "month": 9, "day": 30, "hour": 11, "minute": 0, "second": 0 },
                        ],
                    },
                ],
            },

            /*
             * Missing days (with day length = 1 hour)
             */

            {
                "records": [
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1262304000000, // date -d "2010-01-01T00:00:00.000" +%s000
                    },
                    {
                        "is_primary_sleep": true,
                        "status": "asleep",
                        "start": 1262390400000, // date -d "2010-01-02T00:00:00.000" +%s000
                    },
                ],
                "args": [ "Europe/London", 0, 3600000 ],
                "expected": [
                    {
                        "start": 1262304000000,
                        "end": 1262307600000,
                        "duration": 3600000,
                        "id": '2010-01-01T00:00:00.000 Europe/London',
                        "year": 2010,
                        "month": 0,
                        "day": 0,
                        "activities": [
                            {
                                "start": 1262304000000,
                                "type": 'start-unknown',
                                "time": 1262304000000,
                                "record": {
                                    "is_primary_sleep": true,
                                    "status": 'asleep',
                                    "start": 1262304000000,
                                    "start_of_new_day": true,
                                    "day_number": 2,
                                    "missing_record_after": true,
                                },
                                "index": 0,
                                "offset_start": 0,
                                "offset_time": 0,
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-01-01T00:00:00.000 Europe/London",
                                "first_start": "2010-01-01T00:00:00.000 Europe/London",
                            },
                        },
                    },
                    ,,,,,,,,,,,,,,,,,,,,,,,
                    {
                        "start": 1262390400000,
                        "end": 1262394000000,
                        "duration": 3600000,
                        "id": '2010-01-02T00:00:00.000 Europe/London',
                        "year": 2010,
                        "month": 0,
                        "day": 1,
                        "activities": [
                            {
                                "start": 1262390400000,
                                "type": 'start-unknown',
                                "time": 1262390400000,
                                "record": {
                                    "is_primary_sleep": true,
                                    "status": 'asleep',
                                    "start": 1262390400000,
                                    "start_of_new_day": true,
                                    "day_number": 3,
                                },
                                "index": 0,
                                "offset_start": 0,
                                "offset_time": 0,
                            },
                        ],
                        "activity_summaries": {
                            "asleep": {
                                "duration": NaN,
                                "last_start": "2010-01-02T00:00:00.000 Europe/London",
                                "first_start": "2010-01-02T00:00:00.000 Europe/London",
                            }
                        },
                    },
                ],
            },

        ];

        tests.forEach(function(test) {
            try {
            let diary = new_sleep_diary(wrap_input({
                "file_format": "Standard",
                "records": test["records"],
            }));
            expect(
                diary["daily_activities"].apply(diary,test["args"])
            )["toEqual"](test["expected"]);
            } catch (e) {
                console.error(e);
                throw e;
            }
        });

    });


});
