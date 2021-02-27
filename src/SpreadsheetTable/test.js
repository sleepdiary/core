describe("SpreadsheetTable format", () => {

    var empty_diary = "start,end\n";
    var empty_member_map = { start: [ "start", 0 ], end: [ "end", 1 ] };

    var non_empty_diary = "SleepStart,SleepEnd,sTaTe,comments,NOTES\n123456789,123456789,slept\n2020-01-01 01:01-0100,2020-02-02 02:02+0200,awoke,comment 1,comment 2\n";
    var non_empty_member_map = {
        start: [ "SleepStart", 0 ],
        end: [ "SleepEnd", 1 ],
        status: [ "sTaTe", 2 ],
        comments: [ "comments", 3, [ "comments", "NOTES" ] ]
    };

    test_parse({
        file_format: "SpreadsheetTable",
        name: "empty diary",
        input: empty_diary,
        expected: {
            records: [],
            member_map: empty_member_map,
        }
    });

    test_parse({
        file_format: "SpreadsheetTable",
        name: "simple SpreadsheetTable with one row",
        input: "start,end\n123456789,123456789\n",
        expected: {
            records: [
                {
                    "start" : 123456789000,
                    "end"   : 123456789000,
                    "status": "asleep",
                },
            ],
            member_map: empty_member_map,
        }
    });

    test_parse({
        file_format: "SpreadsheetTable",
        name: "Simple SpreadsheetTable with two rows",
        input: "Sleep,Wake\n123456789,123456789\n2020-01-01 01:01-0100,2020-02-02 02:02+0200\n",
        expected: {
            records: [
                {
                    "Sleep" : 123456789000,
                    "Wake"  : 123456789000,
                    "status": "asleep",
                },
                {
                    "Sleep" : 1577844060000,
                    "Wake"  : 1580601720000,
                    "status": "asleep",
                },
            ],
            member_map: { start: [ "Sleep", 0 ], end: [ "Wake", 1 ] },
        }
    });

    test_parse({
        file_format: "SpreadsheetTable",
        name: "Complex SpreadsheetTable",
        input: "SleepStart,SleepEnd,sTaTe,comments,NOTES\n123456789,123456789,slept\n2020-01-01 01:01-0100,2020-02-02 02:02+0200,awoke,comment 1,\"this is a single field containing one comma (,) one newline (\n) and one double quote (\"\")\",ignored comment\n",
        expected: {
            records: [
                {
                    "SleepStart" : 123456789000,
                    "SleepEnd"  : 123456789000,
                    "sTaTe": "asleep",
                    "comments": [],
                },
                {
                    "SleepStart" : 1577844060000,
                    "SleepEnd"  : 1580601720000,
                    "sTaTe": "awake",
                    "comments": [ "comment 1", "this is a single field containing one comma (,) one newline (\n) and one double quote (\")" ],
                },
            ],
            member_map: non_empty_member_map,
        }
    });


    test_to({
        name: "output test",
        format: "output",
        input: non_empty_diary,
        expected: "SleepStart,SleepEnd,sTaTe,comments,NOTES\n123456789000,123456789000,asleep\n1577844060000,1580601720000,awake,comment 1,comment 2\n",
    });

    test_to({
        name: "standard format test",
        format: "Standard",
        input: non_empty_diary,
        expected: [
            {
                status: "asleep",
                start: 123456789000,
                end: 123456789000,
                duration: 0,
                start_of_new_day: true,
                day_number: 2,
                missing_record_after: false,
                is_primary_sleep: true,
            },
            {
                status: "awake",
                start: 1577844060000,
                end: 1580601720000,
                comments: [ 'comment 1', 'comment 2' ],
                duration: 2757660000,
                start_of_new_day: false,
                day_number: 2,
            },
        ],
    });

    /*
     * This format can't be meaningfully initialised from Standard format,
     * because the record layout is specific to the headers in each input file.
     */
    /*
    test_from_standard({
        name: "standard format test",
        format: "SpreadsheetTable",
        input: [
            ...
        ],
        expected: ...,
    });
    */

    test_merge({
        name: "two empty diaries",
        left: empty_diary,
        right: empty_diary,
        expected: {
            records: [],
            member_map: empty_member_map,
        },
    });

    test_merge({
        name: "left empty, right non-empty",
        left: empty_diary,
        right: non_empty_diary,
        expected: {
            records: [
                {
                    start: 123456789000,
                    end: 123456789000,
                },
                {
                    start: 1577844060000,
                    end: 1580601720000,
                },
            ],
            member_map: empty_member_map,
        },
    });

    test_merge({
        name: "left non-empty, right empty",
        left: non_empty_diary,
        right: empty_diary,
        expected: {
            records: [
                {
                    SleepStart: 123456789000,
                    SleepEnd: 123456789000,
                    sTaTe: "asleep",
                    comments: [],
                },
                {
                    SleepStart: 1577844060000,
                    SleepEnd: 1580601720000,
                    sTaTe: "awake",
                    comments: [ "comment 1", "comment 2" ],
                },
            ],
            member_map: non_empty_member_map,
        },
    });

    test_merge({
        name: "two identical diaries",
        left: non_empty_diary,
        right: non_empty_diary,
        expected: {
            records: [
                {
                    SleepStart: 123456789000,
                    SleepEnd: 123456789000,
                    sTaTe: "asleep",
                    comments: [],
                },
                {
                    SleepStart: 1577844060000,
                    SleepEnd: 1580601720000,
                    sTaTe: "awake",
                    comments: [ "comment 1", "comment 2" ],
                },
            ],
            member_map: non_empty_member_map,
        },
    });

    test_merge({
        name: "two different diaries",
        left: non_empty_diary,
        right: "SleepStart,SleepEnd,sTaTe,comments,NOTES\n12346,12346,slept\n2020-01-01 01:02-0100,2020-02-02 02:03+0200,awoke,comment 1,comment 2\n",
        expected: {
            records: [
                {
                    SleepStart: 123456789000,
                    SleepEnd: 123456789000,
                    sTaTe: "asleep",
                    comments: [],
                },
                {
                    SleepStart: 1577844060000,
                    SleepEnd: 1580601720000,
                    sTaTe: "awake",
                    comments: [ "comment 1", "comment 2" ],
                },
                {
                    SleepStart: 12346000,
                    SleepEnd: 12346000,
                    sTaTe: "asleep",
                },
                {
                    SleepStart: 1577844120000,
                    SleepEnd: 1580601780000,
                    sTaTe: "awake",
                    comments: [ "comment 1", "comment 2" ],
                },
            ],
            member_map: non_empty_member_map,

        },
    });

});
