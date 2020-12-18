const new_sleep_diary = (
    ( typeof module !== "undefined" && module.exports )
        ? require("./sleep-diary-formats.js")
        : window
).new_sleep_diary;

function test_constructor(test) {
    var diary = null, error = false;
    try {
        if ( typeof(test.input) == "string" || test.input.file_format ) {
            diary = new_sleep_diary(test.input);
        } else {
            diary = new_sleep_diary({ "file_format": () => "archive", "contents": test.input });
        }
    } catch (e) {
        if ( !test.error ) console.warn(e);
        error = true;
    }

    it(`produces the correct error for "${test.name}"`, function() {
        expect(error).toEqual(!!test.error);
    });

    return error == !!test.error ? diary : null;
}


function test_parse(test) {

    if ( !test.name ) test.name = "format's 'parse' test";

    var diary = test_constructor(test);

    if ( diary ) {

        it(`reads test "${test.name}" correctly`, function() {
            expect(Object.assign({},diary)).toEqual(test.expected);
        });

        it(`produces a file of the correct format for "${test.name||"format's 'parse' test"}"`, function() {
            expect(diary.file_format()).toEqual(test.file_format);
        });

        it(`URL-ifies "${test.name||"format's 'parse' test"}" correctly`, function() {
            expect(diary).toEqual(new_sleep_diary({
                "file_format": "url",
                "contents": diary.to("url"),
            }));
        });

    }

}

function test_from_standard(test) {

    if ( !test.name ) test.name = "format's 'from standard' test";

    var diary = test_constructor({
        name: test.name,
        input: {
            "file_format": () => "Standard",
            contents: {
                file_format: "Standard",
                records: test.input
            }
        }});
    var expected_diary = test_constructor({ name: test.name, input: test.expected });

    if ( diary && expected_diary ) {

        it(`initialises "${test.name}" from Standard format correctly"`, function() {
            expect( diary.to(test.format) ).toEqual( expected_diary );
        });

    }

}

function test_to(test) {

    if ( !test.name ) test.name = "format's 'to' test";

    var diary = test_constructor(test);

    if ( diary ) {

        if ( test.format == "Standard" ) {
            it(`converts "${test.name}" to "${test.format}" correctly"`, function() {
                expect( diary.to(test.format).records ).toEqual( test.expected );
            });
        } else {
            it(`converts "${test.name}" to "${test.format}" correctly"`, function() {
                expect( diary.to(test.format).contents ).toEqual( test.expected );
            });
        }

    }

}

function test_merge(test) {

    if ( !test.name ) test.name = "format's 'merge' test";

    it(`merges "${test.name}" correctly"`, function() {
        expect(
            Object.assign(
                {},
                new_sleep_diary(test.left)
                    .merge(new_sleep_diary(test.right))
            )
        ).toEqual(test.expected);
    });

}
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
            minimum_day_duration: 72000000,
            maximum_day_duration: 144000000,
            records: [],
        }
    });

    test_parse({
        name: "invaid JSON",
        parseable: true,
        file_format:"Standard",
        input: '{',
        error: true,
    });

    test_parse({
        name: "missing records",
        file_format:"Standard",
        input:  { "file_format": "Standard" },
        error: true,
    });

    test_parse({
        name: "input object",
        file_format:"Standard",
        input:  wrap_input({
            "records": [],
        }),
        expected: {
            minimum_day_duration: 72000000,
            maximum_day_duration: 144000000,
            records: [],
        }
    });

    test_parse({
        name: "min/max durations",
        file_format:"Standard",
        input: wrap_input({
            "records": [],
            "minimum_day_duration": 1,
            "maximum_day_duration": 2,
        }),
        expected: wrap_expected({
            minimum_day_duration: 1,
            maximum_day_duration: 2,
            records: [],
        }),
    });

    test_parse({
        name: "records with various members defined",
        file_format:"Standard",
        input: wrap_input({ "file_format": "Standard", "records": [
            {
                start               : 1,
                end                 : 2,
                duration            : 3,
                status              : "awake",
                comments            : [
                    "comment 1",
                    { time: 4, text:"comment 2" },
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
                    "comment 1",
                    { time: 4, text:"comment 2" },
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
                    "comment 1",
                    { time: 4, text:"comment 2" },
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
                    "comment 1",
                    { time: 4, text:"comment 2" },
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
                    "comment 1",
                    { time: 4, text:"comment 2" },
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
                    "comment 1",
                    { time: 4, text:"comment 2" },
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
                    "comment 1",
                    { time: 4, text:"comment 2" },
                ],
                //day_number          : 1,
                //start_of_new_day    : true,
                //is_primary_sleep    : true,
                //missing_record_after: true,
            },
        ] }),
        expected: wrap_expected({
            minimum_day_duration: 72000000,
            maximum_day_duration: 144000000,
            records: [
                {
                    start               : 1,
                    end                 : 2,
                    duration            : 3,
                    status              : "awake",
                    comments            : [
                        "comment 1",
                        { time: 4, text:"comment 2" },
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
                        "comment 1",
                        { time: 4, text:"comment 2" },
                    ],
                    day_number          : 1,
                    start_of_new_day    : true,
                    is_primary_sleep    : true,
                    missing_record_after: true,
                },
                {
                    start               : 1,
                    duration            : null,
                    status              : "awake",
                    comments            : [
                        "comment 1",
                        { time: 4, text:"comment 2" },
                    ],
                    day_number          : 1,
                    start_of_new_day    : true,
                    is_primary_sleep    : true,
                    missing_record_after: true,
                },
                {
                    start               : 1,
                    duration            : null,
                    status              : "awake",
                    comments            : [
                        "comment 1",
                        { time: 4, text:"comment 2" },
                    ],
                    day_number          : 2,
                    start_of_new_day    : true,
                    is_primary_sleep    : true,
                    missing_record_after: true,
                },
                {
                    start               : 1,
                    duration            : null,
                    status              : "awake",
                    comments            : [
                        "comment 1",
                        { time: 4, text:"comment 2" },
                    ],
                    day_number          : 2,
                    start_of_new_day    : false,
                    is_primary_sleep    : true,
                    missing_record_after: true,
                },
                {
                    start               : 1,
                    duration            : null,
                    status              : "awake",
                    comments            : [
                        "comment 1",
                        { time: 4, text:"comment 2" },
                    ],
                    day_number          : 2,
                    start_of_new_day    : false,
                    missing_record_after: true,
                },
                {
                    start               : 1,
                    duration            : null,
                    status              : "awake",
                    comments            : [
                        "comment 1",
                        { time: 4, text:"comment 2" },
                    ],
                    day_number          : 2,
                    start_of_new_day    : false,
                },
            ],
        }),
    });

    test_parse({
        name: "Day-length calculations",
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
            minimum_day_duration: 72000000,
            maximum_day_duration: 144000000,
            records: [
                {
                    start               : 72000000*0,
                    duration            : null,
                    status              : "asleep",
                    day_number          : 0,
                    start_of_new_day    : false,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*1,
                    duration            : null,
                    status              : "asleep",
                    day_number          : 0,
                    start_of_new_day    : false,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*1 + 1,
                    duration            : null,
                    status              : "asleep",
                    day_number          : 1,
                    start_of_new_day    : true,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*3 + 1,
                    duration            : null,
                    status              : "asleep",
                    day_number          : 2,
                    start_of_new_day    : true,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*5 + 2,
                    duration            : null,
                    status              : "asleep",
                    day_number          : 4,
                    start_of_new_day    : true,
                },
            ],
        }),
    });

    test_parse({
        name: "Day-length calculations with specified min/max duration",
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
            "maximum_day_duration": Math.pow(2,63),
        }),
        expected: wrap_expected({
            minimum_day_duration: 1,
            maximum_day_duration: Math.pow(2,63),
            records: [
                {
                    start               : 72000000*0,
                    duration            : null,
                    status              : "asleep",
                    day_number          : 0,
                    start_of_new_day    : false,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*1,
                    duration            : null,
                    status              : "asleep",
                    day_number          : 1,
                    start_of_new_day    : true,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*1 + 1,
                    duration            : null,
                    status              : "asleep",
                    day_number          : 1,
                    start_of_new_day    : false,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*3 + 1,
                    duration            : null,
                    status              : "asleep",
                    day_number          : 2,
                    start_of_new_day    : true,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*5 + 2,
                    duration            : null,
                    status              : "asleep",
                    day_number          : 3,
                    start_of_new_day    : true,
                },
            ],
        }),
    });

    test_parse({
        name: "Out-of-order records",
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
            minimum_day_duration: 72000000,
            maximum_day_duration: 144000000,
            records: [
                {
                    start               : 72000000*0,
                    duration            : null,
                    status              : "asleep",
                    day_number          : 0,
                    start_of_new_day    : false,
                    missing_record_after: true,
                },
                {
                    start               : 72000000*1,
                    duration            : null,
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
                    duration: 1,
                    status  : "asleep",
                },
                {
                    duration: 2,
                    status  : "asleep",
                },
            ],
        }),
        expected: wrap_expected({
            minimum_day_duration: 72000000,
            maximum_day_duration: 144000000,
            records: [
                {
                    duration            : 1,
                    status              : "asleep",
                    day_number          : 0,
                    start_of_new_day    : false,
                    missing_record_after: true,
                },
                {
                    duration            : 2,
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
        ).toEqual('{"file_format":"Standard","records":[{"duration":1,"status":"asleep","start_of_new_day":false,"day_number":0,"missing_record_after":true},{"duration":2,"status":"asleep","start_of_new_day":false,"day_number":0,"is_primary_sleep":true}],"minimum_day_duration":72000000,"maximum_day_duration":144000000}');
    });

    it(`merges data correctly`, function() {

        var tests = [
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
        ];

        tests.forEach(function(test) {
            expect(Object.assign(
                {},
                new_sleep_diary(wrap_input({
                    "file_format": "Standard",
                    "records": test.left,
                })).merge(new_sleep_diary(wrap_input({
                    "file_format": "Standard",
                    "records": test.right,
                })))
            )).toEqual({
                    "minimum_day_duration":  72000000,
                    "maximum_day_duration": 144000000,
                    "records": test.expected,
                });
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
                    durations: [ 1, null ],
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
        input: "custom_aid_id,class,name\nCUSTOM_0002,RELAXATION,\"custom aid 2\"\nCUSTOM_0003,EXERTION,\"custom aid 3\"\nCUSTOM_0001,HERBAL,\"custom aid 1\"\n\ncustom_hindrance_id,class,name\nCUSTOM_0003,OBLIGATION,\"custom hindrance 3\"\nCUSTOM_0002,MENTAL,\"custom hindrance 2\"\nCUSTOM_0001,NOISE,\"custom hindrance 1\"\n\ncustom_tag_id,name\nCUSTOM_0001,\"custom tag 1\"\nCUSTOM_0002,\"custom tag 2\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2099-12-31 23:57+1000\",\"2099-12-31 23:58+1000\",\"2099-12-31 23:59+1000\",,NIGHT_SLEEP,NONE,CUSTOM_0001,CUSTOM_0001,CUSTOM_0001,5,\"\"\n\"1900-01-02 00:00+0000\",\"1900-01-01 00:02+0000\",\"1900-01-01 00:01+0000\",1-57|1436-1437,NAP,NONE,NONE,NONE,NONE,5,\"comment\"\n",
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
        format: "Standard",
        input: empty_diary,
        expected: [],
    });

    test_to({
        format: "Standard",
        input: "custom_aid_id,class,name\nCUSTOM_0001,RELAXATION,\"value 1\"\n\ncustom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\"value 2\"\n\ncustom_tag_id,name\nCUSTOM_0001,\"value 3\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,CUSTOM_0001,CUSTOM_0001,CUSTOM_0001,5,\"\"\n",
        expected: [
            {
                status: 'asleep',
                start: 1289574960000,
                end  : 1289567700000,
                start_timezone: 'Etc/GMT',
                  end_timezone: 'Etc/GMT',
                tags: [ 'value 1', 'value 2', 'value 3' ],
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
                start_timezone: 'Etc/GMT',
                  end_timezone: 'Etc/GMT',
                duration: -7320000,
                start_of_new_day: false,
                day_number: 2
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
            '"123456789","Europe/London","01. 02. 2003 04:05","01. 02. 2003 4:05","01. 02. 2003 05:06","1.000","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        expected: {
            alarms: [],
            prefs: {},
            records: [
                {

                    start: 123456789,
                    end: 127056789,
                    alarm: 130740000,
                    duration: 3600000,

                    Id: '123456789',
                    Tz: 'Europe/London',
                    From: {
                        string: '"01. 02. 2003 04:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    To: {
                        string: '"01. 02. 2003 4:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    Sched: {
                        string: '"01. 02. 2003 05:06"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 5,
                        minute: 6
                    },

                    Hours: 1,
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
            '"123456789","Europe/London","01. 02. 2003 04:05","01. 02. 2003 4:05","01. 02. 2003 05:06","1.000","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
            ,
        }),
        expected: {
            alarms: alarms_json_expected,
            prefs: prefs_xml_expected,
            records: [
                {

                    start: 123456789,
                    end: 127056789,
                    alarm: 130740000,
                    duration: 3600000,

                    Id: '123456789',
                    Tz: 'Europe/London',
                    From: {
                        string: '"01. 02. 2003 04:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    To: {
                        string: '"01. 02. 2003 4:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    Sched: {
                        string: '"01. 02. 2003 05:06"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 5,
                        minute: 6
                    },

                    Hours: 1,
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
            '"123456789","Europe/London","01. 02. 2003 04:05","01. 02. 2003 4:05","01. 02. 2003 05:06","1.000","0.0","""Comment \\n ""text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        expected: {
            alarms: [],
            prefs: {},
            records: [
                {

                    start: 123456789,
                    end: 127056789,
                    alarm: 130740000,
                    duration: 3600000,

                    Id: '123456789',
                    Tz: 'Europe/London',
                    From: {
                        string: '"01. 02. 2003 04:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    To: {
                        string: '"01. 02. 2003 4:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    Sched: {
                        string: '"01. 02. 2003 05:06"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 5,
                        minute: 6
                    },

                    Hours: 1,
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
            '"123456789","Etc/GMT","01. 02. 2003 04:05","01. 02. 2003 4:05","01. 02. 2003 05:06","1.000","0.0","""Comment \\n ""text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        expected: {
            "prefs.xml": "<?xml version='1.0' encoding='utf-8' standalone='yes' ?>\n<map>\n</map>\n",
            "alarms.json": "[]",
            "sleep-export.csv": "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
            '"123456789","Etc/GMT","02. 01. 1970 10:17","02. 01. 1970 11:17","02. 01. 1970 12:19","1","0","""Comment \\n ""text","10000","-1","-1.0","-1","-1.0","0",""\n'
        },
    });

    test_to({
        name: "standard format test",
        format: "Standard",
        input:
        "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
       '"123456789","Europe/London","01. 02. 2003 04:05","01. 02. 2003 4:05","01. 02. 2003 05:06","1.000","0.0","""Comment \\n ""text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        expected: [
            {
                status: 'asleep',
                start: 123456789,
                  end: 127056789,
                start_timezone: "Europe/London",
                  end_timezone: "Europe/London",
                tags: [],
                comments: [ '"Comment\n"text' ],
                duration: 3600000,
                start_of_new_day: true,
                day_number: 1,
                is_primary_sleep: true
            }
        ],
    });

    test_from_standard({
        name: "standard format test",
        format: "SleepAsAndroid",
        input: [
            {
                status: 'asleep',
                start: 123456789,
                end: 127056789,
                tags: [],
                comments: [ '"Comment\n"text' ],
                duration: 3600000,
                start_of_new_day: true,
                day_number: 1,
                is_primary_sleep: true
            }
        ],
        expected:
        "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
       '"123456789","Etc/GMT","02. 01. 1970 10:17","02. 01. 1970 11:17","02. 01. 1970 11:17","1.000","2.5","""Comment \\n ""text","10000","-1","-1.0","-1","-1.0","-1.0",""\n'
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
        '"123456789","Europe/London","01. 02. 2003 04:05","01. 02. 2003 4:05","01. 02. 2003 05:06","1.000","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        expected: {
            prefs: {},
            alarms: [],
            records: [
                {
                    Id: '123456789',
                    Tz: 'Europe/London',
                    From: {
                        string: '"01. 02. 2003 04:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    To: {
                        string: '"01. 02. 2003 4:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    Sched: {
                        string: '"01. 02. 2003 05:06"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 5,
                        minute: 6
                    },
                    Hours: 1,
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
                    start: 123456789,
                    end: 127056789,
                    duration: 3600000,
                    alarm: 130740000
                }
            ],
        },
    });

    test_merge({
        left:
        "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
        '"123456789","Europe/London","01. 02. 2003 04:05","01. 02. 2003 4:05","01. 02. 2003 05:06","1.000","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        right: empty_diary,
        expected: {
            prefs: {},
            alarms: [],
            records: [
                {
                    Id: '123456789',
                    Tz: 'Europe/London',
                    From: {
                        string: '"01. 02. 2003 04:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    To: {
                        string: '"01. 02. 2003 4:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    Sched: {
                        string: '"01. 02. 2003 05:06"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 5,
                        minute: 6
                    },
                    Hours: 1,
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
                    start: 123456789,
                    end: 127056789,
                    duration: 3600000,
                    alarm: 130740000
                }
            ],
        },
    });

    test_merge({
        left:
        "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
        '"123456789","Europe/London","01. 02. 2003 04:05","01. 02. 2003 4:05","01. 02. 2003 05:06","1.000","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        right:
        "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
        '"123456789","Europe/London","01. 02. 2003 04:05","01. 02. 2003 4:05","01. 02. 2003 05:06","1.000","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        expected: {
            prefs: {},
            alarms: [],
            records: [
                {
                    Id: '123456789',
                    Tz: 'Europe/London',
                    From: {
                        string: '"01. 02. 2003 04:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    To: {
                        string: '"01. 02. 2003 4:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    Sched: {
                        string: '"01. 02. 2003 05:06"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 5,
                        minute: 6
                    },
                    Hours: 1,
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
                    start: 123456789,
                    end: 127056789,
                    duration: 3600000,
                    alarm: 130740000
                }
            ],
        },
    });

    test_merge({
        left:
        "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
        '"123456788","Europe/London","01. 02. 2003 04:05","01. 02. 2003 4:05","01. 02. 2003 05:06","1.000","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        right:
        "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
        '"123456789","Europe/London","01. 02. 2003 04:05","01. 02. 2003 4:05","01. 02. 2003 05:06","1.000","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        expected: {
            prefs: {},
            alarms: [],
            records: [
                {
                    Id: '123456788',
                    Tz: 'Europe/London',
                    From: {
                        string: '"01. 02. 2003 04:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    To: {
                        string: '"01. 02. 2003 4:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    Sched: {
                        string: '"01. 02. 2003 05:06"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 5,
                        minute: 6
                    },
                    Hours: 1,
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
                    end: 127056788,
                    duration: 3600000,
                    alarm: 130740000
                },
                {
                    Id: '123456789',
                    Tz: 'Europe/London',
                    From: {
                        string: '"01. 02. 2003 04:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    To: {
                        string: '"01. 02. 2003 4:05"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 4,
                        minute: 5
                    },
                    Sched: {
                        string: '"01. 02. 2003 05:06"',
                        year: 2003,
                        month: 2,
                        day: 1,
                        hour: 5,
                        minute: 6
                    },
                    Hours: 1,
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
                    start: 123456789,
                    end: 127056789,
                    duration: 3600000,
                    alarm: 130740000
                }
            ],
        },
    });

});
