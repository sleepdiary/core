register_roundtrip_modifier("Sleepmeter",function(our_diary,roundtripped_diary,other_format) {
    switch ( other_format.name ) {
    case "ActivityLog":
    case "SleepChart1":
    case "PleesTracker":
    case "SpreadsheetGraph":
    case "SpreadsheetTable":
        [our_diary,roundtripped_diary].forEach(function(diary) {
            diary["records"].forEach( function(record) {
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
    case "ActivityLog":
    case "SleepChart1":
    case "PleesTracker":
        [our_diary,roundtripped_diary].forEach(function(diary) {
            diary["records"].forEach( function(record) {
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
        name: "simple diary from README.md",
        input: "wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
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
        name: "complex diary from README.md",
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
        name: "multi-line strings",
        input: "custom_aid_id,class,name\nCUSTOM_0001,HERBAL,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\ncustom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\ncustom_tag_id,name\nCUSTOM_0001,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2099-12-31 23:57+1000\",\"2099-12-31 23:58+1000\",\"2099-12-31 23:59+1000\",,NIGHT_SLEEP,NONE,CUSTOM_0001,CUSTOM_0001,CUSTOM_0001,5,\",\", <-- those the commas and quotation mark do not mark a field boundary.\nHere are some more things that are hard to parse:\n1. a quote at the end of a line (does not end the comment because the next line still looks like a comment): \"\n2. a pair of blank lines (does not end the comment because the next line still looks like a comment):\n\n3. another quote at the end of a line (ends the comment because the next line looks like a header): \"\n",
        expected: {
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
        name: "two empty diaries",
        left: empty_diary,
        right: empty_diary,
        expected: {
            "custom_aids": [],
            "custom_hindrances": [],
            "custom_tags": [],
            "records": [],
        },
    });
    test_merge({
        name: "right empty, left non-empty",
        left: "wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: empty_diary,
        expected: {
            "custom_aids": [],
            "custom_hindrances": [],
            "custom_tags": [],
            "records": [{
                "end": 1289567640000,
                "wake": {
                    "string": '"2010-11-12 13:14+0000"',
                    "year": 2010,
                    "month": 11,
                    "day": 12,
                    "hour": 13,
                    "minute": 14,
                    "offset": 0
                },
                //"sleep timestamp": 1289574960000,
                "sleep": {
                    "string": '"2010-11-12 15:16+0000"',
                    "year": 2010,
                    "month": 11,
                    "day": 12,
                    "hour": 15,
                    "minute": 16,
                    "offset": 0
                },
                "start": 1289582280000,
                "bedtime": {
                    "string": '"2010-11-12 17:18+0000"',
                    "year": 2010,
                    "month": 11,
                    "day": 12,
                    "hour": 17,
                    "minute": 18,
                    "offset": 0
                },
                "holes": [],
                "duration": -7320000,
                "type": 'NIGHT_SLEEP',
                "dreams": [],
                "aids": [],
                "hindrances": [],
                "tags": [],
                "quality":
                5, "notes": ''
            }],
        },
    });
    test_merge({
        name: "left empty, right non-empty",
        left: empty_diary,
        right: "wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            "custom_aids": [],
            "custom_hindrances": [],
            "custom_tags": [],
            "records": [{
                "end": 1289567640000,
                "wake": {
                    "string": '"2010-11-12 13:14+0000"',
                    "year": 2010,
                    "month": 11,
                    "day": 12,
                    "hour": 13,
                    "minute": 14,
                    "offset": 0
                },
                //"sleep timestamp": 1289574960000,
                "sleep": {
                    "string": '"2010-11-12 15:16+0000"',
                    "year": 2010,
                    "month": 11,
                    "day": 12,
                    "hour": 15,
                    "minute": 16,
                    "offset": 0
                },
                "start": 1289582280000,
                "bedtime": {
                    "string": '"2010-11-12 17:18+0000"',
                    "year": 2010,
                    "month": 11,
                    "day": 12,
                    "hour": 17,
                    "minute": 18,
                    "offset": 0
                },
                "duration": -7320000,
                "holes": [],
                "type": 'NIGHT_SLEEP',
                "dreams": [],
                "aids": [],
                "hindrances": [],
                "tags": [],
                "quality":
                5, "notes": ''
            }],
        },
    });
    test_merge({
        name: "both non-empty",
        left: "wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: "wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            "custom_aids": [],
            "custom_hindrances": [],
            "custom_tags": [],
            "records": [{
                "end": 1289567640000,
                "wake": {
                    "string": '"2010-11-12 13:14+0000"',
                    "year": 2010,
                    "month": 11,
                    "day": 12,
                    "hour": 13,
                    "minute": 14,
                    "offset": 0
                },
                //"sleep timestamp": 1289574960000,
                "sleep": {
                    "string": '"2010-11-12 15:16+0000"',
                    "year": 2010,
                    "month": 11,
                    "day": 12,
                    "hour": 15,
                    "minute": 16,
                    "offset": 0
                },
                "start": 1289582280000,
                "bedtime": {
                    "string": '"2010-11-12 17:18+0000"',
                    "year": 2010,
                    "month": 11,
                    "day": 12,
                    "hour": 17,
                    "minute": 18,
                    "offset": 0
                },
                "duration": -7320000,
                "holes": [],
                "type": 'NIGHT_SLEEP',
                "dreams": [],
                "aids": [],
                "hindrances": [],
                "tags": [],
                "quality":
                5, "notes": ''
            }],
        },
    });
    test_merge({
        name: "both non-empty (2)",
        left: "wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: "wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            "custom_aids": [],
            "custom_hindrances": [],
            "custom_tags": [],
            "records": [
                {
                    "end": 1289567700000,
                    "wake": {
                        "string": '"2010-11-12 13:15+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 13,
                        "minute": 15,
                        "offset": 0
                    },
                    //"sleep timestamp": 1289574960000,
                    "sleep": {
                        "string": '"2010-11-12 15:16+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 15,
                        "minute": 16,
                        "offset": 0
                    },
                    "start": 1289582280000,
                    "bedtime": {
                        "string": '"2010-11-12 17:18+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 17,
                        "minute": 18,
                        "offset": 0
                    },
                    "duration": -7260000,
                    "holes": [],
                    "type": 'NIGHT_SLEEP',
                    "dreams": [],
                    "aids": [],
                    "hindrances": [],
                    "tags": [],
                    "quality": 5,
                    "notes": ''
                },
                {
                    "end": 1289567640000,
                    "wake": {
                        "string": '"2010-11-12 13:14+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 13,
                        "minute": 14,
                        "offset": 0
                    },
                    //"sleep timestamp": 1289574960000,
                    "sleep": {
                        "string": '"2010-11-12 15:16+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 15,
                        "minute": 16,
                        "offset": 0
                    },
                    "start": 1289582280000,
                    "bedtime": {
                        "string": '"2010-11-12 17:18+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 17,
                        "minute": 18,
                        "offset": 0
                    },
                    "duration": -7320000,
                    "holes": [],
                    "type": 'NIGHT_SLEEP',
                    "dreams": [],
                    "aids": [],
                    "hindrances": [],
                    "tags": [],
                    "quality": 5,
                    "notes": ''
                }
            ],
        },
    });

    test_merge({
        name: "both non-empty (3)",
        left: "custom_aid_id,class,name\nCUSTOM_0001,RELAXATION,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: "custom_aid_id,class,name\nCUSTOM_0001,RELAXATION,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            "custom_aids": [
                { "custom_aid_id": 'CUSTOM_0001', "class": 'RELAXATION', "name": 'value 1' },
            ],
            "custom_hindrances": [],
            "custom_tags": [],
            "records": [
                {
                    "end": 1289567700000,
                    "wake": {
                        "string": '"2010-11-12 13:15+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 13,
                        "minute": 15,
                        "offset": 0
                    },
                    //"sleep timestamp": 1289574960000,
                    "sleep": {
                        "string": '"2010-11-12 15:16+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 15,
                        "minute": 16,
                        "offset": 0
                    },
                    "start": 1289582280000,
                    "bedtime": {
                        "string": '"2010-11-12 17:18+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 17,
                        "minute": 18,
                        "offset": 0
                    },
                    "duration": -7260000,
                    "holes": [],
                    "type": 'NIGHT_SLEEP',
                    "dreams": [],
                    "aids": [],
                    "hindrances": [],
                    "tags": [],
                    "quality": 5,
                    "notes": ''
                },
                {
                    "end": 1289567640000,
                    "wake": {
                        "string": '"2010-11-12 13:14+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 13,
                        "minute": 14,
                        "offset": 0
                    },
                    //"sleep timestamp": 1289574960000,
                    "sleep": {
                        "string": '"2010-11-12 15:16+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 15,
                        "minute": 16,
                        "offset": 0
                    },
                    "start": 1289582280000,
                    "bedtime": {
                        "string": '"2010-11-12 17:18+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 17,
                        "minute": 18,
                        "offset": 0
                    },
                    "duration": -7320000,
                    "holes": [],
                    "type": 'NIGHT_SLEEP',
                    "dreams": [],
                    "aids": [],
                    "hindrances": [],
                    "tags": [],
                    "quality": 5,
                    "notes": ''
                }
            ],
        },
    });
    test_merge({
        name: "both non-empty (4)",
        left: "custom_aid_id,class,name\nCUSTOM_0001,RELAXATION,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: "custom_aid_id,class,name\nCUSTOM_0001,RELAXATION,\"value 2\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            "custom_aids": [
                { "custom_aid_id": 'CUSTOM_0001', "class": 'RELAXATION', "name": 'value 1' },
                { "custom_aid_id": 'CUSTOM_0002', "class": 'RELAXATION', "name": 'value 2' },
            ],
            "custom_hindrances": [],
            "custom_tags": [],
            "records": [
                {
                    "end": 1289567700000,
                    "wake": {
                        "string": '"2010-11-12 13:15+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 13,
                        "minute": 15,
                        "offset": 0
                    },
                    //"sleep timestamp": 1289574960000,
                    "sleep": {
                        "string": '"2010-11-12 15:16+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 15,
                        "minute": 16,
                        "offset": 0
                    },
                    "start": 1289582280000,
                    "bedtime": {
                        "string": '"2010-11-12 17:18+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 17,
                        "minute": 18,
                        "offset": 0
                    },
                    "duration": -7260000,
                    "holes": [],
                    "type": 'NIGHT_SLEEP',
                    "dreams": [],
                    "aids": [],
                    "hindrances": [],
                    "tags": [],
                    "quality": 5,
                    "notes": ''
                },
                {
                    "end": 1289567640000,
                    "wake": {
                        "string": '"2010-11-12 13:14+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 13,
                        "minute": 14,
                        "offset": 0
                    },
                    //"sleep timestamp": 1289574960000,
                    "sleep": {
                        "string": '"2010-11-12 15:16+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 15,
                        "minute": 16,
                        "offset": 0
                    },
                    "start": 1289582280000,
                    "bedtime": {
                        "string": '"2010-11-12 17:18+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 17,
                        "minute": 18,
                        "offset": 0
                    },
                    "duration": -7320000,
                    "holes": [],
                    "type": 'NIGHT_SLEEP',
                    "dreams": [],
                    "aids": [],
                    "hindrances": [],
                    "tags": [],
                    "quality": 5,
                    "notes": ''
                }
            ],
        },
    });

    test_merge({
        name: "both non-empty (5)",
        left: "custom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: "custom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            "custom_aids": [],
            "custom_hindrances": [
                { "custom_hindrance_id": 'CUSTOM_0001', "class": 'NOISE', "name": 'value 1' },
            ],
            "custom_tags": [],
            "records": [
                {
                    "end": 1289567700000,
                    "wake": {
                        "string": '"2010-11-12 13:15+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 13,
                        "minute": 15,
                        "offset": 0
                    },
                    //"sleep timestamp": 1289574960000,
                    "sleep": {
                        "string": '"2010-11-12 15:16+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 15,
                        "minute": 16,
                        "offset": 0
                    },
                    "start": 1289582280000,
                    "bedtime": {
                        "string": '"2010-11-12 17:18+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 17,
                        "minute": 18,
                        "offset": 0
                    },
                    "duration": -7260000,
                    "holes": [],
                    "type": 'NIGHT_SLEEP',
                    "dreams": [],
                    "aids": [],
                    "hindrances": [],
                    "tags": [],
                    "quality": 5,
                    "notes": ''
                },
                {
                    "end": 1289567640000,
                    "wake": {
                        "string": '"2010-11-12 13:14+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 13,
                        "minute": 14,
                        "offset": 0
                    },
                    //"sleep timestamp": 1289574960000,
                    "sleep": {
                        "string": '"2010-11-12 15:16+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 15,
                        "minute": 16,
                        "offset": 0
                    },
                    "start": 1289582280000,
                    "bedtime": {
                        "string": '"2010-11-12 17:18+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 17,
                        "minute": 18,
                        "offset": 0
                    },
                    "duration": -7320000,
                    "holes": [],
                    "type": 'NIGHT_SLEEP',
                    "dreams": [],
                    "aids": [],
                    "hindrances": [],
                    "tags": [],
                    "quality": 5,
                    "notes": ''
                }
            ],
        },
    });
    test_merge({
        name: "both non-empty (6)",
        left: "custom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: "custom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\"value 2\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            "custom_aids": [],
            "custom_hindrances": [
                { "custom_hindrance_id": 'CUSTOM_0001', "class": 'NOISE', "name": 'value 1' },
                { "custom_hindrance_id": 'CUSTOM_0002', "class": 'NOISE', "name": 'value 2' },
            ],
            "custom_tags": [],
            "records": [
                {
                    "end": 1289567700000,
                    "wake": {
                        "string": '"2010-11-12 13:15+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 13,
                        "minute": 15,
                        "offset": 0
                    },
                    //"sleep timestamp": 1289574960000,
                    "sleep": {
                        "string": '"2010-11-12 15:16+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 15,
                        "minute": 16,
                        "offset": 0
                    },
                    "start": 1289582280000,
                    "bedtime": {
                        "string": '"2010-11-12 17:18+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 17,
                        "minute": 18,
                        "offset": 0
                    },
                    "duration": -7260000,
                    "holes": [],
                    "type": 'NIGHT_SLEEP',
                    "dreams": [],
                    "aids": [],
                    "hindrances": [],
                    "tags": [],
                    "quality": 5,
                    "notes": ''
                },
                {
                    "end": 1289567640000,
                    "wake": {
                        "string": '"2010-11-12 13:14+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 13,
                        "minute": 14,
                        "offset": 0
                    },
                    //"sleep timestamp": 1289574960000,
                    "sleep": {
                        "string": '"2010-11-12 15:16+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 15,
                        "minute": 16,
                        "offset": 0
                    },
                    "start": 1289582280000,
                    "bedtime": {
                        "string": '"2010-11-12 17:18+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 17,
                        "minute": 18,
                        "offset": 0
                    },
                    "duration": -7320000,
                    "holes": [],
                    "type": 'NIGHT_SLEEP',
                    "dreams": [],
                    "aids": [],
                    "hindrances": [],
                    "tags": [],
                    "quality": 5,
                    "notes": ''
                }
            ],
        },
    });

    test_merge({
        name: "both non-empty (7)",
        left: "custom_tag_id,name\nCUSTOM_0001,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: "custom_tag_id,name\nCUSTOM_0001,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            "custom_aids": [],
            "custom_hindrances": [],
            "custom_tags": [
                { "custom_tag_id": 'CUSTOM_0001', "name": 'value 1' },
            ],
            "records": [
                {
                    "end": 1289567700000,
                    "wake": {
                        "string": '"2010-11-12 13:15+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 13,
                        "minute": 15,
                        "offset": 0
                    },
                    //"sleep timestamp": 1289574960000,
                    "sleep": {
                        "string": '"2010-11-12 15:16+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 15,
                        "minute": 16,
                        "offset": 0
                    },
                    "start": 1289582280000,
                    "bedtime": {
                        "string": '"2010-11-12 17:18+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 17,
                        "minute": 18,
                        "offset": 0
                    },
                    "duration": -7260000,
                    "holes": [],
                    "type": 'NIGHT_SLEEP',
                    "dreams": [],
                    "aids": [],
                    "hindrances": [],
                    "tags": [],
                    "quality": 5,
                    "notes": ''
                },
                {
                    "end": 1289567640000,
                    "wake": {
                        "string": '"2010-11-12 13:14+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 13,
                        "minute": 14,
                        "offset": 0
                    },
                    //"sleep timestamp": 1289574960000,
                    "sleep": {
                        "string": '"2010-11-12 15:16+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 15,
                        "minute": 16,
                        "offset": 0
                    },
                    "start": 1289582280000,
                    "bedtime": {
                        "string": '"2010-11-12 17:18+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 17,
                        "minute": 18,
                        "offset": 0
                    },
                    "duration": -7320000,
                    "holes": [],
                    "type": 'NIGHT_SLEEP',
                    "dreams": [],
                    "aids": [],
                    "hindrances": [],
                    "tags": [],
                    "quality": 5,
                    "notes": ''
                }
            ],
        },
    });
    test_merge({
        name: "both non-empty (8)",
        left: "custom_tag_id,name\nCUSTOM_0001,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        right: "custom_tag_id,name\nCUSTOM_0001,\"value 2\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,\"\"\n",
        expected: {
            "custom_aids": [],
            "custom_hindrances": [],
            "custom_tags": [
                { "custom_tag_id": 'CUSTOM_0001', "name": 'value 1' },
                { "custom_tag_id": 'CUSTOM_0002', "name": 'value 2' },
            ],
            "records": [
                {
                    "end": 1289567700000,
                    "wake": {
                        "string": '"2010-11-12 13:15+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 13,
                        "minute": 15,
                        "offset": 0
                    },
                    //"sleep timestamp": 1289574960000,
                    "sleep": {
                        "string": '"2010-11-12 15:16+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 15,
                        "minute": 16,
                        "offset": 0
                    },
                    "start": 1289582280000,
                    "bedtime": {
                        "string": '"2010-11-12 17:18+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 17,
                        "minute": 18,
                        "offset": 0
                    },
                    "duration": -7260000,
                    "holes": [],
                    "type": 'NIGHT_SLEEP',
                    "dreams": [],
                    "aids": [],
                    "hindrances": [],
                    "tags": [],
                    "quality": 5,
                    "notes": ''
                },
                {
                    "end": 1289567640000,
                    "wake": {
                        "string": '"2010-11-12 13:14+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 13,
                        "minute": 14,
                        "offset": 0
                    },
                    //"sleep timestamp": 1289574960000,
                    "sleep": {
                        "string": '"2010-11-12 15:16+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 15,
                        "minute": 16,
                        "offset": 0
                    },
                    "start": 1289582280000,
                    "bedtime": {
                        "string": '"2010-11-12 17:18+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 17,
                        "minute": 18,
                        "offset": 0
                    },
                    "duration": -7320000,
                    "holes": [],
                    "type": 'NIGHT_SLEEP',
                    "dreams": [],
                    "aids": [],
                    "hindrances": [],
                    "tags": [],
                    "quality": 5,
                    "notes": ''
                }
            ],
        },
    });

    test_merge({
        name: "both non-empty (9)",
        left: "custom_aid_id,class,name\nCUSTOM_0001,RELAXATION,\"value 1\"\n\ncustom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\"value 1\"\n\ncustom_tag_id,name\nCUSTOM_0001,\"value 1\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,CUSTOM_0001,CUSTOM_0001,CUSTOM_0001,5,\"\"\n",
        right: "custom_aid_id,class,name\nCUSTOM_0001,RELAXATION,\"value 2\"\n\ncustom_hindrance_id,class,name\nCUSTOM_0001,NOISE,\"value 2\"\n\ncustom_tag_id,name\nCUSTOM_0001,\"value 2\"\n\nwake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n\"2010-11-12 13:14+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 17:18+0000\",,NIGHT_SLEEP,NONE,CUSTOM_0001,CUSTOM_0001,CUSTOM_0001,5,\"\"\n",
        expected: {
            "custom_aids": [
                { "custom_aid_id": 'CUSTOM_0001', "class": 'RELAXATION', "name": 'value 1' },
                { "custom_aid_id": 'CUSTOM_0002', "class": 'RELAXATION', "name": 'value 2' },
            ],
            "custom_hindrances": [
                { "custom_hindrance_id": 'CUSTOM_0001', "class": 'NOISE', "name": 'value 1' },
                { "custom_hindrance_id": 'CUSTOM_0002', "class": 'NOISE', "name": 'value 2' },
            ],
            "custom_tags": [
                { "custom_tag_id": 'CUSTOM_0001', "name": 'value 1' },
                { "custom_tag_id": 'CUSTOM_0002', "name": 'value 2' },
            ],
            "records": [
                {
                    "end": 1289567700000,
                    "wake": {
                        "string": '"2010-11-12 13:15+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 13,
                        "minute": 15,
                        "offset": 0
                    },
                    //"sleep timestamp": 1289574960000,
                    "sleep": {
                        "string": '"2010-11-12 15:16+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 15,
                        "minute": 16,
                        "offset": 0
                    },
                    "start": 1289582280000,
                    "bedtime": {
                        "string": '"2010-11-12 17:18+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 17,
                        "minute": 18,
                        "offset": 0
                    },
                    "duration": -7260000,
                    "holes": [],
                    "type": 'NIGHT_SLEEP',
                    "dreams": [],
                    "aids": [ "CUSTOM_0001" ],
                    "hindrances": [ "CUSTOM_0001" ],
                    "tags": [ "CUSTOM_0001" ],
                    "quality": 5,
                    "notes": ''
                },
                {
                    "end": 1289567640000,
                    "wake": {
                        "string": '"2010-11-12 13:14+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 13,
                        "minute": 14,
                        "offset": 0
                    },
                    //"sleep timestamp": 1289574960000,
                    "sleep": {
                        "string": '"2010-11-12 15:16+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 15,
                        "minute": 16,
                        "offset": 0
                    },
                    "start": 1289582280000,
                    "bedtime": {
                        "string": '"2010-11-12 17:18+0000"',
                        "year": 2010,
                        "month": 11,
                        "day": 12,
                        "hour": 17,
                        "minute": 18,
                        "offset": 0
                    },
                    "duration": -7320000,
                    "holes": [],
                    "type": 'NIGHT_SLEEP',
                    "dreams": [],
                    "aids": [ "CUSTOM_0002" ],
                    "hindrances": [ "CUSTOM_0002" ],
                    "tags": [ "CUSTOM_0002" ],
                    "quality": 5,
                    "notes": ''
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
                "status": 'in bed',
                "start": 1289567640000,
                "end": 1289574960000,
                "start_timezone": 'Etc/GMT',
                  "end_timezone": 'Etc/GMT',
                "duration": 7320000,
                "start_of_new_day": false,
                "day_number": 0,
            },
            {
                "status": 'asleep',
                "start": 1289574960000,
                "end"  : 1289582280000,
                "start_timezone": 'Etc/GMT',
                  "end_timezone": 'Etc/GMT',
                "tags": [ 'value 1', 'value 2', 'value 3' ],
                "is_primary_sleep": true,
                "duration": 7320000,
                "start_of_new_day": true,
                "day_number": 2,
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
                "status": 'asleep',
                "start": 1289574960000,
                "end"  : 1289567700000,
                "tags": [ 'SOUND_MACHINE', 'BUNKMATE_SNORING', 'OUT_OF_TOWN' ],
                "comments": [],
                "is_primary_sleep": true,
                "duration": -7260000,
                "start_of_new_day": true,
                "day_number": 2,
            },
            {
                "status": 'in bed',
                "start": 1289582280000,
                "end": 1289574960000,
                "duration": -7320000,
                "start_of_new_day": false,
                "day_number": 2
            },
        ],
        expected:
        "wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes\n" +
        "\"2010-11-12 13:15+0000\",\"2010-11-12 15:16+0000\",\"2010-11-12 15:16+0000\",,NIGHT_SLEEP,NONE,SOUND_MACHINE,BUNKMATE_SNORING,OUT_OF_TOWN,5,\"\"\n"
    });

});
