register_roundtrip_modifier("Fitbit",function(our_diary,roundtripped_diary,other_format) {
    switch ( other_format.name ) {
    case "Sleepmeter":
    case "SleepAsAndroid":
    case "SleepChart1":
        [our_diary,roundtripped_diary].forEach(function(diary) {
            diary["records"].forEach( function(record) {
                /*
                 * This format does not support comments or tags.
                 */
                ["comments","tags"].forEach(function(key) {
                    delete record[key];
                });
            });
        });
    }
});


describe("Fitbit format", () => {

    var empty_diary
        = "Sleep\n"
        + "Start Time,End Time,Minutes Asleep,Minutes Awake,Number of Awakenings,Time in Bed,Minutes REM Sleep,Minutes Light Sleep,Minutes Deep Sleep\n" +
        "\n"
    ;

    var simple_diary = (
        "Sleep\n" +
        "Start Time,End Time,Minutes Asleep,Minutes Awake,Number of Awakenings,Time in Bed,Minutes REM Sleep,Minutes Light Sleep,Minutes Deep Sleep\n" +
        '"2010-11-12 1:23AM","2010-11-12 2:34PM","700","91","1","12","123","1234","12345"\n' +
        "\n"
    );

    var simple_end_time = new Date(2010, 10, 12, 14, 34, 0, 0).getTime();
    var  other_end_time = new Date(2012, 10, 10, 16, 32, 0, 0).getTime();
    var duration = ( 700 + 91 ) * 60*1000;

    var simple_records = [
        {
            "Minutes Asleep": 700,
            "Minutes Awake": 91,
            "Number of Awakenings": 1,
            "Time in Bed": 12,
            "Minutes REM Sleep": 123,
            "Minutes Light Sleep": 1234,
            "Minutes Deep Sleep": 12345,
            "End Time": simple_end_time,
            "end"     : simple_end_time,
            "Start Time": simple_end_time - duration,
            "start"     : simple_end_time - duration,
        }
    ];

    test_parse({
        file_format: "Fitbit",
        name: "Empty diary",
        input: empty_diary,
        expected: {
            "records": [],
        }
    });

    test_parse({
        file_format: "Fitbit",
        name: "Simple diary",
        input: simple_diary,
        expected: {
            "records": simple_records,
        }
    });

    test_to({
        name: "Output test",
        format: "output",
        input   : simple_diary,
        expected: simple_diary,
    });

    test_to({
        name: "Standard Format test",
        format: "Standard",
        input: simple_diary,
        expected: [
            {
                "status"  : 'asleep',
                "start"   : simple_end_time - duration,
                "end"     : simple_end_time,
                "duration": duration,
                "start_of_new_day": true,
                "day_number"      : 2,
                "is_primary_sleep": true,
            }
        ],
    });

    test_merge({
        name: "Two empty diaries",
        left: empty_diary,
        right: empty_diary,
        expected: {
            "records": []
        },
    });

    test_merge({
        name: "Left empty, right non-empty",
        left: empty_diary,
        right: simple_diary,
        expected: {
            "records": simple_records,
        },
    });

    test_merge({
        name: "Left non-empty, right empty",
        left: simple_diary,
        right: empty_diary,
        expected: {
            "records": simple_records,
        },
    });

    test_merge({
        name: "Two identical diaries",
        left: simple_diary,
        right: simple_diary,
        expected: {
            "records": simple_records,
        },
    });

    test_merge({
        name: "Two different diaries",
        left: simple_diary,
        right: "Sleep\n" +
        "Start Time,End Time,Minutes Asleep,Minutes Awake,Number of Awakenings,Time in Bed,Minutes REM Sleep,Minutes Light Sleep,Minutes Deep Sleep\n" +
        '"2012-11-10 3:21AM","2012-11-10 4:32PM","91","700","12345","1234","123","12","1"\n' +
        "\n",
        expected: {
            "records": [
                {
                    "Start Time": other_end_time - duration,
                    "End Time"  : other_end_time,
                    "start"     : other_end_time - duration,
                    "end"       : other_end_time,
                    "Minutes Asleep": 91,
                    "Minutes Awake" : 700,
                    "Number of Awakenings": 12345,
                    "Time in Bed"         : 1234,
                    "Minutes REM Sleep"   : 123,
                    "Minutes Light Sleep" : 12,
                    "Minutes Deep Sleep"  : 1,
                }
            ].concat(simple_records),
        },
    });

});
