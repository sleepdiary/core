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
            "end"     : 1608323057541,
            "duration": 28161,
            "rating"  : 0,
        },
        {
            "sid"     : 2,
            "start"   : 1608323062156,
            "end"     : 1608323063678,
            "duration": 1522,
            "rating"  : 5,
        },
        {
            "sid"     : 3,
            "start"   : 1608323066387,
            "end"     : 1608323067794,
            "duration": 1407,
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
                    end: 608323057541,
                    duration: 28161,
                    sid: 1,
                    rating: 0
                },
                {
                    start: 608323062156,
                    end: 608323063678,
                    duration: 1522,
                    sid: 2,
                    rating: 5
                },
                {
                    start: 608323066387,
                    end: 608323067794,
                    duration: 1407,
                    sid: 3,
                    rating: 3
                },
            ]),
        },
    });

});
