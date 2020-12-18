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
