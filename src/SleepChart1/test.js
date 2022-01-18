register_roundtrip_modifier("SleepChart1",function(our_diary,roundtripped_diary,other_format) {
    switch ( other_format.name ) {
    case "ActivityLog":
    case "PleesTracker":
    case "SpreadsheetGraph":
    case "SpreadsheetTable":
    case "Fitbit":
        [our_diary,roundtripped_diary].forEach(function(diary) {
            diary["records"].forEach( function(record) {
                ["tags"].forEach(function(key) {
                    delete record[key];
                });
            });
        });
    }
});


describe("SleepChart1 format", () => {

    function wrap_input(contents) {
        return {
            "file_format": () => "array",
            "contents": contents,
        }
    }

    function create_diary(records) {
        let float_data = new Float32Array(records.length*3);
        let uint8_data = new Uint8Array(float_data.buffer);
        for ( var n=0; n!=records.length; ++n ) {
            var record = records[n];
            float_data[n* 3+0] = record[0];
            float_data[n* 3+1] = record[1];
            uint8_data[n*12+8] = record[2]?255:0;
            uint8_data[n*12+9] = record[3]?255:0;
        }
        return float_data.buffer;
    }

    var empty_diary = wrap_input(create_diary([]));

    test_parse({
        file_format: "SleepChart1",
        name: "Empty diary",
        input: empty_diary,
        expected: {
            "records": [],
        }
    });

    test_parse({
        file_format: "SleepChart1",
        name: "Simple diary 1",
        input: wrap_input(create_diary([[1,2,true,true]])),
        expected: {
            "records": [
                {
                    "start": 946684800000,
                    "end"  : 946771200000,
                    "delayed retirement": false,
                    "forced awakening": false,
                },
            ],
        }
    });

    test_parse({
        file_format: "SleepChart1",
        name: "Simple diary 2",
        input: wrap_input(create_diary([[2,3,true,false]])),
        expected: {
            "records": [
                {
                    "start": 946771200000,
                    "end"  : 946857600000,
                    "delayed retirement": true,
                    "forced awakening": false,
                },
            ],
        }
    });

    test_parse({
        file_format: "SleepChart1",
        name: "Simple diary 3",
        input: wrap_input(create_diary([[100,200,false,true]])),
        expected: {
            "records": [
                {
                    "start": 955238400000,
                    "end"  : 963878400000,
                    "delayed retirement": false,
                    "forced awakening": true,
                },
            ],
        }
    });

    test_parse({
        file_format: "SleepChart1",
        name: "Multiple records",
        input: wrap_input(create_diary([
            [1,2,true,true],
            [2,3,true,false],
            [100,200,false,true],
        ])),
        expected: {
            "records": [
                {
                    "start": 946684800000,
                    "end"  : 946771200000,
                    "delayed retirement": false,
                    "forced awakening": false,
                },
                {
                    "start": 946771200000,
                    "end"  : 946857600000,
                    "delayed retirement": true,
                    "forced awakening": false,
                },
                {
                    "start": 955238400000,
                    "end"  : 963878400000,
                    "delayed retirement": false,
                    "forced awakening": true,
                },
            ],
        }
    });

    test_to({
        name: "Output test",
        format: "output",
        input: wrap_input(create_diary([
            [1,2,true,true],
            [2,3,true,false],
            [100,200,false,true],
        ])),
        expected: create_diary([
            [1,2,true,true],
            [2,3,true,false],
            [100,200,false,true],
        ]),
    });

    test_to({
        name: "Standard Format test",
        format: "Standard",
        input: wrap_input(create_diary([
            [1,2,true,true],
            [2,3,true,false],
            [100,200,false,true],
        ])),
        expected: [
            {
                "status": 'asleep',
                "start": 946684800000,
                "end": 946771200000,
                "duration": 86400000,
                "start_of_new_day": true,
                "day_number": 2,
                "missing_record_after": true,
                "is_primary_sleep": true
            },
            {
                "status": 'asleep',
                "start": 946771200000,
                "end": 946857600000,
                "tags": [ 'delayed retirement' ],
                "duration": 86400000,
                "start_of_new_day": true,
                "day_number": 3,
                "missing_record_after": true,
                "is_primary_sleep": true
            },
            {
                "status": 'asleep',
                "start": 955238400000,
                "end": 963878400000,
                "tags": [ 'forced awakening' ],
                "duration": 8640000000,
                "start_of_new_day": true,
                "day_number": 5,
                "is_primary_sleep": true
            }
        ],
    });

    test_from_standard({
        name: "Standard Format test",
        format: "SleepChart1",
        input: [
            {
                "status": 'asleep',
                "start": 946684800000,
                "end": 946771200000,
                "duration": 86400000,
                "start_of_new_day": true,
                "day_number": 2,
                "missing_record_after": true,
                "is_primary_sleep": true
            },
            {
                "status": 'asleep',
                "start": 946771200000,
                "end": 946857600000,
                "tags": [ 'delayed retirement' ],
                "duration": 86400000,
                "start_of_new_day": true,
                "day_number": 3,
                "missing_record_after": true,
                "is_primary_sleep": true
            },
            {
                "status": 'asleep',
                "start": 955238400000,
                "end": 963878400000,
                "tags": [ 'forced awakening' ],
                "duration": 8640000000,
                "start_of_new_day": true,
                "day_number": 5,
                "is_primary_sleep": true
            }
        ],
        expected: wrap_input(create_diary([
            [1,2,true,true],
            [2,3,true,false],
            [100,200,false,true],
        ])),
    });

    test_merge({
        name    : "Two identical diaries",
        left    : wrap_input(create_diary([[1,2,true,true]])),
        right   : wrap_input(create_diary([[1,2,true,true]])),
        expected: {
            "records": [
                {
                    "start": 946684800000,
                    "end"  : 946771200000,
                    "delayed retirement": false,
                    "forced awakening": false,
                },
            ],
        }
    });

    test_merge({
        name : "Two different diaries",
        left : wrap_input(create_diary([[1,2,true,true]])),
        right: wrap_input(create_diary([[100,200,false,true]])),
        expected: {
            "records": [
                {
                    "start": 946684800000,
                    "end"  : 946771200000,
                    "delayed retirement": false,
                    "forced awakening": false,
                },
                {
                    "start": 955238400000,
                    "end"  : 963878400000,
                    "delayed retirement": false,
                    "forced awakening": true,
                },
            ],
        }
    });

    test_merge({
        name : "Two different diaries (reverse order)",
        left : wrap_input(create_diary([[100,200,false,true]])),
        right: wrap_input(create_diary([[1,2,true,true]])),
        expected: {
            "records": [
                {
                    "start": 946684800000,
                    "end"  : 946771200000,
                    "delayed retirement": false,
                    "forced awakening": false,
                },
                {
                    "start": 955238400000,
                    "end"  : 963878400000,
                    "delayed retirement": false,
                    "forced awakening": true,
                },
            ],
        }
    });

    test_merge({
        name : "Two different diaries (overlapping)",
        left : wrap_input(create_diary([[1,3,true,true]])),
        right: wrap_input(create_diary([[2,4,true,true]])),
        expected: {
            "records": [
                {
                    "start": 946684800000,
                    "end"  : 946857600000,
                    "delayed retirement": false,
                    "forced awakening": false,
                },
            ],
        }
    });

});
