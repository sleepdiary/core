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
    case "SleepChart1":
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
