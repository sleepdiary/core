register_roundtrip_modifier("SleepAsAndroid",function(our_diary,roundtripped_diary,other_format) {
    switch ( other_format.name ) {
    case "ActivityLog":
    case "SleepChart1":
    case "PleesTracker":
    case "Fitbit":
        [our_diary,roundtripped_diary].forEach(function(diary) {
            diary["records"].forEach( function(record) {
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
        // FALL THROUGH
    case "SpreadsheetGraph":
    case "SpreadsheetTable":
    case "Sleepmeter":
        [our_diary,roundtripped_diary].forEach(function(diary) {
            diary["records"].forEach( function(record) {
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
        "bool_value": false,
        "string_value": "my_string",
        "long_value": Math.pow(2,31),
        "int_value": 0,
    };


    test_parse({
        file_format: "SleepAsAndroid",
        name: "empty diary",
        input: empty_diary,
        spreadsheetify: 'disable',
        expected: {
            "prefs": {},
            "alarms": [],
            "records": [],
        }
    });

    test_parse({
        file_format: "SleepAsAndroid",
        name: "string diary",
        input:
            "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
            '"1044072300000","Europe/London","01. 02. 2003 4:05","01. 02. 2003 5:06","01. 02. 2003 6:07","1.017","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        expected: {
            "alarms": [],
            "prefs": {},
            "records": [
                {

                    "start": 1044072300000,
                    "end": 1044075961200,
                    "alarm": 1044079620000,
                    "duration": 3661200,

                    "Id": '1044072300000',
                    "Tz": 'Europe/London',
                    "From": {
                        "string": '"01. 02. 2003 4:05"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 4,
                        "minute": 5
                    },
                    "To": {
                        "string": '"01. 02. 2003 5:06"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 5,
                        "minute": 6
                    },
                    "Sched": {
                        "string": '"01. 02. 2003 6:07"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 6,
                        "minute": 7
                    },

                    "Hours": 1.017,
                    "Rating": 0,
                    "Comment": { "string": 'Comment text', "tags": [], "notags": 'Comment text' },
                    "Framerate": '10000',
                    "Snore": null,
                    "Noise": null,
                    "Cycles": null,
                    "DeepSleep": null,
                    "LenAdjust": 0,
                    "Geo": '',
                    "times": [],
                    "events": []

                }
            ],
        }
    });

    test_parse({
        file_format: "SleepAsAndroid",
        name: "object diary",
        input: wrap_input({
            "alarms.json": alarms_json_input,
            "prefs.xml": prefs_xml_input,
            "sleep-export.csv":
            "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
            '"1044072300000","Europe/London","01. 02. 2003 4:05","01. 02. 2003 5:06","01. 02. 2003 6:07","1.017","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
            ,
        }),
        expected: {
            "alarms": alarms_json_expected,
            "prefs": prefs_xml_expected,
            "records": [
                {

                    "start": 1044072300000,
                    "end": 1044075961200,
                    "alarm": 1044079620000,
                    "duration": 3661200,

                    "Id": '1044072300000',
                    "Tz": 'Europe/London',
                    "From": {
                        "string": '"01. 02. 2003 4:05"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 4,
                        "minute": 5
                    },
                    "To": {
                        "string": '"01. 02. 2003 5:06"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 5,
                        "minute": 6
                    },
                    "Sched": {
                        "string": '"01. 02. 2003 6:07"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 6,
                        "minute": 7
                    },

                    "Hours": 1.017,
                    "Rating": 0,
                    "Comment": { "string": 'Comment text', "tags": [], "notags": 'Comment text' },
                    "Framerate": '10000',
                    "Snore": null,
                    "Noise": null,
                    "Cycles": null,
                    "DeepSleep": null,
                    "LenAdjust": 0,
                    "Geo": '',
                    "times": [],
                    "events": []

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
            "alarms": [],
            "prefs": {},
            "records": [
                {

                    "start": 1044072300000,
                    "end": 1044075961200,
                    "alarm": 1044079620000,
                    "duration": 3661200,

                    "Id": '1044072300000',
                    "Tz": 'Europe/London',
                    "From": {
                        "string": '"01. 02. 2003 4:05"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 4,
                        "minute": 5
                    },
                    "To": {
                        "string": '"01. 02. 2003 5:06"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 5,
                        "minute": 6
                    },
                    "Sched": {
                        "string": '"01. 02. 2003 6:07"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 6,
                        "minute": 7
                    },

                    "Hours": 1.017,
                    "Rating": 0,
                    "Comment": { "string": "\"Comment\n\"text", "tags": [], "notags": "\"Comment\n\"text" },
                    "Framerate": '10000',
                    "Snore": null,
                    "Noise": null,
                    "Cycles": null,
                    "DeepSleep": null,
                    "LenAdjust": 0,
                    "Geo": '',
                    "times": [],
                    "events": []

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
                "status": 'asleep',
                "start": 1044072300000,
                  "end": 1044075961200,
                "start_timezone": "Europe/London",
                  "end_timezone": "Europe/London",
                "comments": [ '"Comment\n"text' ],
                "duration": 3661200,
                "start_of_new_day": true,
                "day_number": 2,
                "is_primary_sleep": true
            }
        ],
    });

    test_from_standard({
        name: "standard format test 2",
        format: "SleepAsAndroid",
        input: [
            {
                "status": 'asleep',
                "start": 1044072300000,
                "end": 1044075961200,
                "comments": [ '"Comment\n"text' ],
                "duration": 3661200,
                "start_of_new_day": true,
                "day_number": 1,
                "is_primary_sleep": true
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
            "prefs": {},
            "alarms": [],
            "records": [],
        },
    });

    test_merge({
        left: empty_diary,
        right:
        "Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo\n" +
        '"1044072300000","Europe/London","01. 02. 2003 4:05","01. 02. 2003 5:06","01. 02. 2003 6:07","1.017","0.0","Comment text","10000","-1","-1.0","-1","-1.0","0",""\n'
        ,
        expected: {
            "prefs": {},
            "alarms": [],
            "records": [
                {
                    "Id": '1044072300000',
                    "Tz": 'Europe/London',
                    "From": {
                        "string": '"01. 02. 2003 4:05"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 4,
                        "minute": 5
                    },
                    "To": {
                        "string": '"01. 02. 2003 5:06"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 5,
                        "minute": 6
                    },
                    "Sched": {
                        "string": '"01. 02. 2003 6:07"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 6,
                        "minute": 7
                    },
                    "Hours": 1.017,
                    "Rating": 0,
                    "Comment": {
                        "string": 'Comment text',
                        "tags": [],
                        "notags": 'Comment text'
                    },
                    "Framerate": '10000',
                    "Snore": null,
                    "Noise": null,
                    "Cycles": null,
                    "DeepSleep": null,
                    "LenAdjust": 0,
                    "Geo": '',
                    "times": [],
                    "events": [],
                    "start": 1044072300000,
                    "end": 1044075961200,
                    "duration": 3661200,
                    "alarm": 1044079620000
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
            "prefs": {},
            "alarms": [],
            "records": [
                {
                    "Id": '1044072300000',
                    "Tz": 'Europe/London',
                    "From": {
                        "string": '"01. 02. 2003 4:05"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 4,
                        "minute": 5
                    },
                    "To": {
                        "string": '"01. 02. 2003 5:06"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 5,
                        "minute": 6
                    },
                    "Sched": {
                        "string": '"01. 02. 2003 6:07"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 6,
                        "minute": 7
                    },
                    "Hours": 1.017,
                    "Rating": 0,
                    "Comment": {
                        "string": 'Comment text',
                        "tags": [],
                        "notags": 'Comment text'
                    },
                    "Framerate": '10000',
                    "Snore": null,
                    "Noise": null,
                    "Cycles": null,
                    "DeepSleep": null,
                    "LenAdjust": 0,
                    "Geo": '',
                    "times": [],
                    "events": [],
                    "start": 1044072300000,
                    "end": 1044075961200,
                    "duration": 3661200,
                    "alarm": 1044079620000
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
            "prefs": {},
            "alarms": [],
            "records": [
                {
                    "Id": '1044072300000',
                    "Tz": 'Europe/London',
                    "From": {
                        "string": '"01. 02. 2003 4:05"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 4,
                        "minute": 5
                    },
                    "To": {
                        "string": '"01. 02. 2003 5:06"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 5,
                        "minute": 6
                    },
                    "Sched": {
                        "string": '"01. 02. 2003 6:07"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 6,
                        "minute": 7
                    },
                    "Hours": 1.017,
                    "Rating": 0,
                    "Comment": {
                        "string": 'Comment text',
                        "tags": [],
                        "notags": 'Comment text'
                    },
                    "Framerate": '10000',
                    "Snore": null,
                    "Noise": null,
                    "Cycles": null,
                    "DeepSleep": null,
                    "LenAdjust": 0,
                    "Geo": '',
                    "times": [],
                    "events": [],
                    "start": 1044072300000,
                    "end": 1044075961200,
                    "duration": 3661200,
                    "alarm": 1044079620000
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
            "prefs": {},
            "alarms": [],
            "records": [
                {
                    "Id": '123456788',
                    "Tz": 'Europe/London',
                    "From": {
                        "string": '"01. 02. 2003 4:05"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 4,
                        "minute": 5
                    },
                    "To": {
                        "string": '"01. 02. 2003 5:06"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 5,
                        "minute": 6
                    },
                    "Sched": {
                        "string": '"01. 02. 2003 6:07"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 6,
                        "minute": 7
                    },
                    "Hours": 1.017,
                    "Rating": 0,
                    "Comment": {
                        "string": 'Comment text',
                        "tags": [],
                        "notags": 'Comment text'
                    },
                    "Framerate": '10000',
                    "Snore": null,
                    "Noise": null,
                    "Cycles": null,
                    "DeepSleep": null,
                    "LenAdjust": 0,
                    "Geo": '',
                    "times": [],
                    "events": [],
                    "start": 123456788,
                    "end": 127117988,
                    "duration": 3661200,
                    "alarm": 130800000
                },
                {
                    "Id": '1044072300000',
                    "Tz": 'Europe/London',
                    "From": {
                        "string": '"01. 02. 2003 4:05"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 4,
                        "minute": 5
                    },
                    "To": {
                        "string": '"01. 02. 2003 5:06"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 5,
                        "minute": 6
                    },
                    "Sched": {
                        "string": '"01. 02. 2003 6:07"',
                        "year": 2003,
                        "month": 2,
                        "day": 1,
                        "hour": 6,
                        "minute": 7
                    },
                    "Hours": 1.017,
                    "Rating": 0,
                    "Comment": {
                        "string": 'Comment text',
                        "tags": [],
                        "notags": 'Comment text'
                    },
                    "Framerate": '10000',
                    "Snore": null,
                    "Noise": null,
                    "Cycles": null,
                    "DeepSleep": null,
                    "LenAdjust": 0,
                    "Geo": '',
                    "times": [],
                    "events": [],
                    "start": 1044072300000,
                    "end": 1044075961200,
                    "duration": 3661200,
                    "alarm": 1044079620000
                }
            ],
        },
    });

});
