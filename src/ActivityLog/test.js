describe("ActivityLog format", () => {

    var empty_diary = "ActivityStart,ActivityEnd\n";

    test_parse({
        file_format: "ActivityLog",
        name: "Empty diary",
        input: empty_diary,
        expected: {
            "records": [],
            "activities": [],
            "settings": [],
        }
    });

    test_parse({
        file_format: "ActivityLog",
        name: "Simple diary",
        input: "ActivityStart,ActivityEnd\n12345678,23456789",
        expected: {
            "records": [
                {
                    "status": "awake",
                    "start" : 1234567800000,
                    "end"   : 2345678900000,
                },
            ],
            "activities": [
                {
                    "ActivityStart": 1234567800000,
                    "ActivityEnd"  : 2345678900000,
                },
            ],
            "settings": [],
        },
    });

    test_parse({
        file_format: "ActivityLog",
        name: "Diary with gaps",
        input:
        [
            [ "ActivityStart", "ActivityEnd" ],
            [ 1000000000000, 1100000000000 ],
            [ 1100115200000, 1200000000000 ],
            [ 1200000000100, 1300000000000 ],
            [ 1400000000000, 1400010000000 ],
            [ 1400010060100, 1400020000000 ],
        ].map( line => line.join() ).join("\n"),
        expected: {
            "records": [
                {
                    "status": "awake",
                    "start" : 1000000000000,
                    "end"   : 1100000000000,
                },
                {
                    "status": "awake",
                    "start" : 1100115200000,
                    "end"   : 1300000000000,
                },
                {
                    "status": "awake",
                    "start" : 1400000000000,
                    "end"   : 1400020000000,
                },
            ],
            "activities": [
                {
                    "ActivityStart": 1000000000000,
                    "ActivityEnd"  : 1100000000000,
                },
                {
                    "ActivityStart": 1100115200000,
                    "ActivityEnd"  : 1300000000000,
                },
                {
                    "ActivityStart": 1400000000000,
                    "ActivityEnd"  : 1400010000000,
                },
                {
                    "ActivityStart": 1400010060100,
                    "ActivityEnd"  : 1400020000000,
                },
            ],
            "settings": [],
        }
    });

    test_parse({
        file_format: "ActivityLog",
        name: "Diary with sleeps",
        input:
        [
            [ "ActivityStart", "ActivityEnd" ],
            [ 1000000000100 + 1000*60*60* 0, 1000000000200 + 1000*60*60*18 ],
            [ 1000000000300 + 1000*60*60*24, 1000000000400 + 1000*60*60*42 ],
            [ 1000000000500 + 1000*60*60*48, 1000000000600 + 1000*60*60*66 ],
            [ 1000000000700 + 1000*60*60*72, 1000000000800 + 1000*60*60*90 ],
        ].map( line => line.join() ).join("\n"),
        expected: {
            "records": [
                {
                    "status": "awake",
                    "start" : 1000000000100 + 1000*60*60* 0,
                    "end"   : 1000000000200 + 1000*60*60*18,
                },
                {
                    "status": "asleep",
                    "start" : 1000000000201 + 1000*60*60*18,
                    "end"   : 1000000000299 + 1000*60*60*24,
                },
                {
                    "status": "awake",
                    "start" : 1000000000300 + 1000*60*60*24,
                    "end"   : 1000000000400 + 1000*60*60*42,
                },
                {
                    "status": "asleep",
                    "start" : 1000000000401 + 1000*60*60*42,
                    "end"   : 1000000000499 + 1000*60*60*48,
                },
                {
                    "status": "awake",
                    "start" : 1000000000500 + 1000*60*60*48,
                    "end"   : 1000000000600 + 1000*60*60*66,
                },
                {
                    "status": "asleep",
                    "start" : 1000000000601 + 1000*60*60*66,
                    "end"   : 1000000000699 + 1000*60*60*72,
                },
                {
                    "status": "awake",
                    "start" : 1000000000700 + 1000*60*60*72,
                    "end"   : 1000000000800 + 1000*60*60*90,
                },
            ],
            "activities": [
                {
                    "ActivityStart": 1000000000100 + 1000*60*60* 0,
                    "ActivityEnd"  : 1000000000200 + 1000*60*60*18,
                },
                {
                    "ActivityStart": 1000000000300 + 1000*60*60*24,
                    "ActivityEnd"  : 1000000000400 + 1000*60*60*42,
                },
                {
                    "ActivityStart": 1000000000500 + 1000*60*60*48,
                    "ActivityEnd"  : 1000000000600 + 1000*60*60*66,
                },
                {
                    "ActivityStart": 1000000000700 + 1000*60*60*72,
                    "ActivityEnd"  : 1000000000800 + 1000*60*60*90,
                },
            ],
            "settings": [],
        }
    });

    test_parse({
        file_format: "ActivityLog",
        name: "Diary with sleeps and maximum_day_length_ms",
        input:
        [
            [ "maximum_day_length_ms=172800000" ],
            [ "ActivityStart", "ActivityEnd" ],
            [ 1000000000100 + 1000*60*60* 0, 1000000000200 + 1000*60*60*18 ],
            [ 1000000000300 + 1000*60*60*24, 1000000000400 + 1000*60*60*42 ],
            [ 1000000000500 + 1000*60*60*48, 1000000000600 + 1000*60*60*66 ],
            [ 1000000000700 + 1000*60*60*72, 1000000000800 + 1000*60*60*90 ],
        ].map( line => line.join() ).join("\n"),
        expected: {
            "records": [
                {
                    "status": "awake",
                    "start" : 1000000000100 + 1000*60*60* 0,
                    "end"   : 1000000000200 + 1000*60*60*18,
                },
                {
                    "status": "asleep",
                    "start" : 1000000000201 + 1000*60*60*18,
                    "end"   : 1000000000299 + 1000*60*60*24,
                },
                {
                    "status": "awake",
                    "start" : 1000000000300 + 1000*60*60*24,
                    "end"   : 1000000000400 + 1000*60*60*42,
                },
                {
                    "status": "asleep",
                    "start" : 1000000000401 + 1000*60*60*42,
                    "end"   : 1000000000499 + 1000*60*60*48,
                },
                {
                    "status": "awake",
                    "start" : 1000000000500 + 1000*60*60*48,
                    "end"   : 1000000000800 + 1000*60*60*90,
                },
            ],
            "activities": [
                {
                    "ActivityStart": 1000000000100 + 1000*60*60* 0,
                    "ActivityEnd"  : 1000000000200 + 1000*60*60*18,
                },
                {
                    "ActivityStart": 1000000000300 + 1000*60*60*24,
                    "ActivityEnd"  : 1000000000400 + 1000*60*60*42,
                },
                {
                    "ActivityStart": 1000000000500 + 1000*60*60*48,
                    "ActivityEnd"  : 1000000000600 + 1000*60*60*66,
                },
                {
                    "ActivityStart": 1000000000700 + 1000*60*60*72,
                    "ActivityEnd"  : 1000000000800 + 1000*60*60*90,
                },
            ],
            "settings": [
                {
                    "Setting": "maximum_day_length_ms",
                    "Value"  : 172800000,
                },
            ],
        }
    });

    test_to({
        name: "Output test",
        format: "output",
        input: [
            [ "maximum_day_length_ms=172800000" ],
            [ "ActivityStart", "ActivityEnd" ],
            [ 1000000000100 + 1000*60*60* 0, 1000000000200 + 1000*60*60*18 ],
        ].map( line => line.join() ).join("\n"),
        expected:
        "maximum_day_length_ms=172800000\n" +
            "ActivityStart,ActivityEnd\n" +
            "2001-09-09T01:46:40.100Z,2001-09-09T19:46:40.200Z\n",
    });

    test_to({
        name: "Standard Format test",
        format: "Standard",
        input: [
            [ "maximum_day_length_ms=172800000" ],
            [ "ActivityStart", "ActivityEnd" ],
            [ 1000000000100 + 1000*60*60* 0, 1000000000200 + 1000*60*60*18 ],
        ].map( line => line.join() ).join("\n"),
        expected: [
            {
                "start": 1000000000100,
                "end": 1000064800200,
                "status": 'awake',
                "duration": 64800100,
                "start_of_new_day": false,
                "day_number": 0,
            },
        ],
    });

    test_merge({
        name: "Two empty diaries",
        left: empty_diary,
        right: empty_diary,
        expected: {
            "activities": [],
            "settings": [],
            "records": [],
        },
    });

    test_merge({
        name: "Left empty, right non-empty",
        left: empty_diary,
        right: "ActivityStart,ActivityEnd\n12345678,23456789",
        expected: {
            "records": [
                {
                    "status": "awake",
                    "start" : 1234567800000,
                    "end"   : 2345678900000,
                },
            ],
            "activities": [
                {
                    "ActivityStart": 1234567800000,
                    "ActivityEnd"  : 2345678900000,
                },
            ],
            "settings": [],
        },
    });

    test_merge({
        name: "Left non-empty, right empty",
        left: "ActivityStart,ActivityEnd\n12345678,23456789",
        right: empty_diary,
        expected: {
            "records": [
                {
                    "status": "awake",
                    "start" : 1234567800000,
                    "end"   : 2345678900000,
                },
            ],
            "activities": [
                {
                    "ActivityStart": 1234567800000,
                    "ActivityEnd"  : 2345678900000,
                },
            ],
            "settings": [],
        },
    });

    test_merge({
        name: "Two identical diaries",
        left: "ActivityStart,ActivityEnd\n12345678,23456789",
        right: "ActivityStart,ActivityEnd\n12345678,23456789",
        expected: {
            "records": [
                {
                    "status": "awake",
                    "start" : 1234567800000,
                    "end"   : 2345678900000,
                },
            ],
            "activities": [
                {
                    "ActivityStart": 1234567800000,
                    "ActivityEnd"  : 2345678900000,
                },
            ],
            "settings": [],
        },
    });

    test_merge({
        name: "Two different diaries",
        left : "ActivityStart,ActivityEnd\n12345678,12345876",
        right: "ActivityStart,ActivityEnd\n23456789,23456987",
        expected: {
            "records": [
                {
                    "status": "awake",
                    "start" : 1234567800000,
                    "end"   : 1234587600000,
                },
                {
                    "status": "awake",
                    "start" : 2345678900000,
                    "end"   : 2345698700000,
                },
            ],
            "activities": [
                {
                    "ActivityStart": 1234567800000,
                    "ActivityEnd"  : 1234587600000,
                },
                {
                    "ActivityStart": 2345678900000,
                    "ActivityEnd"  : 2345698700000,
                },
            ],
            "settings": [],
        },
    });

    test_merge({
        name: "Two different diaries",
        left : "ActivityStart,ActivityEnd\n12345678,12345876\n23456789,23456987",
        right: "ActivityStart,ActivityEnd\n12345976,12345999",
        expected: {
            "records": [
                {
                    "status": "awake",
                    "start" : 1234567800000,
                    "end"   : 1234599900000,
                },
                {
                    "status": "awake",
                    "start" : 2345678900000,
                    "end"   : 2345698700000,
                },
            ],
            "activities": [
                {
                    "ActivityStart": 1234567800000,
                    "ActivityEnd"  : 1234587600000,
                },
                {
                    "ActivityStart": 1234597600000,
                    "ActivityEnd"  : 1234599900000,
                },
                {
                    "ActivityStart": 2345678900000,
                    "ActivityEnd"  : 2345698700000,
                },
            ],
            "settings": [],
        },
    });

});
