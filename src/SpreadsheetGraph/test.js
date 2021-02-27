register_roundtrip_modifier("SpreadsheetGraph",function(our_diary,roundtripped_diary,other_format) {
    switch ( other_format.name ) {
    case "Sleepmeter":
        /*
         * This format supports the "in bed" status, but only when followed by "asleep".
         * This is a quick workaround - a better solution would remove more selectively.
         */
        [our_diary,roundtripped_diary].forEach(function(diary) {
            diary.records = diary.records.filter( function(record) {
                delete record.missing_record_after;
                return record.status == 'asleep';
            });
        });
    }
});

describe("SpreadsheetGraph format", () => {

    const explicit_time_header = [
        "",
        "midnight",
        "1am",
        "2am",
        "3am",
        "4am",
        "5am",
        "6am",
        "7am",
        "8am",
        "9am",
        "10am",
        "11am",
        "12 noon",
        "1:00 PM",
        "2pm",
        "3p m",
        "4pm",
        "5pm",
        "6pm",
        "7pm",
        "8pm",
        "9pm",
        "10pm",
        "11-midnight",
    ];

    function create_diary(cells) {
        return {
            file_format: () => "spreadsheet",
            spreadsheet: Spreadsheet.parse_csv("").spreadsheet,
            sheets: [{
                cells: cells || [
                    explicit_time_header.slice(0),
                    [
                        { value: "2000-01-01" },
                        { value: "", style: "#FFFFFFFF,#FFFFFFFF" },
                    ],
                ]
            }],
        };
    }

    const twenty_four_hours = 24 * 60 * 60 * 1000;

    const now = new Date().getTime();
    const today = now - ( now % (twenty_four_hours) );

    test_parse({
        file_format: "SpreadsheetGraph",
        name: "minimal diary",
        input: create_diary([
            explicit_time_header.slice(1),
            [ { value: "", style: "#FFFFFFFF,#FFFFFFFF" } ],
        ]),
        spreadsheetify: "disable",
        expected: {
            records: [
                {
                    start: today,
                    comments: [],
                    end: today + 3599999,
                    status: 'awake',
                },
                {
                    start: today + 3600000,
                    comments: [],
                    status: 'asleep',
                }
            ],
            status_map: {
                awake: '#FFFFFFFF,#FFFFFFFF',
                asleep: '',
            },
        }
    });

    test_parse({
        file_format: "SpreadsheetGraph",
        name: "simple diary",
        input: create_diary(),
        spreadsheetify: "disable",
        expected: {
            records: [
                {
                    start: 946684800000,
                    comments: [],
                    end: 946684800000 + 3599999,
                    status: 'awake',
                },
                {
                    start: 946684800000 + 3600000,
                    comments: [],
                    status: 'asleep',
                }
            ],
            status_map: {
                awake: '#FFFFFFFF,#FFFFFFFF',
                asleep: '',
            },
        }
    });

    test_parse({
        file_format: "SpreadsheetGraph",
        name: "hard-to-parse comment",
        input: create_diary([
            explicit_time_header.slice(0),
            [
                { value: "2000-01-01" },
                { value: "this is a single field containing one comma (,) one newline (\n) and one double quote (\")", style: "#FFFFFFFF,#FFFFFFFF" },
            ],
        ]),
        spreadsheetify: "disable",
        expected: {
            records: [
                {
                    start: 946684800000,
                    comments: ["this is a single field containing one comma (,) one newline (\n) and one double quote (\")"],
                    end: 946684800000 + 3599999,
                    status: 'awake',
                },
                {
                    start: 946684800000 + 3600000,
                    comments: [],
                    status: 'asleep',
                }
            ],
            status_map: {
                awake: '#FFFFFFFF,#FFFFFFFF',
                asleep: '',
            },
        }
    });

    // this is a very rough test, but the best we can do without reading the spreadsheet back in again:
    {
        var test_diary = test_constructor({
            name: "output test",
            input: create_diary(),
        });

        it(`converts "output test" to "output" correctly`, function() {
            return test_diary.to_async("output").then(function(converted) {
                expect( converted.contents.length ).toBeGreaterThan( 0 );
            });
        });
    }

    test_to({
        name: "standard format test 1",
        format: "Standard",
        input: create_diary(),
        expected: [
            {
                start: 946684800000,
                end: 946684800000 + 3599999,
                status: 'awake',
                duration: 3599999,
                start_of_new_day: false,
                day_number: 0,
                missing_record_after: false,

            },
            {
                start: 946684800000 + 3600000,
                status: 'asleep',
                start_of_new_day: true,
                day_number: 2,
            }
        ],
    });

    test_from_standard({
        name: "standard format test 2",
        format: "SpreadsheetGraph",
        input: [
            {
                start: 946684800000,
                comments: [ "Comment\ntext" ],
                end: 946684800000 + 3599999,
                status: 'asleep',
                duration: 3599999,
                start_of_new_day: false,
                day_number: 0,
                missing_record_after: false,

            },
            {
                start: 946684800000 + 3600000,
                status: 'awake',
                start_of_new_day: true,
                day_number: 2,
            },
        ],
        expected: create_diary([
            explicit_time_header.slice(0),
            [
                { value: "2000-01-01" },
                { value: "Comment\ntext", style: "#FFFFFF00,#FF0000FF" },
            ],
            [],
            [{ value: "asleep", style: "#FFFFFF00,#FF0000FF" }],
        ]),
    });

    // left and right have the same records (should be deduplicated):
    test_merge({
        name: "two identical diaries",
        left: create_diary(),
        right: create_diary(),
        expected: {
            records: [
                {
                    start: 946684800000,
                    comments: [],
                    end: 946684800000 + 3599999,
                    status: 'awake',
                },
                {
                    start: 946684800000 + 3600000,
                    comments: [],
                    status: 'asleep',
                }
            ],
            status_map: {
                awake: '#FFFFFFFF,#FFFFFFFF',
                asleep: '',
            },
        },
    });

    // left and right have different records:
    test_merge({
        name: "two different diaries",
        left: create_diary(),
        right: create_diary([
            explicit_time_header.slice(0),
            [
                { value: "2000-01-01" },
                { value: "Comment\ntext", style: "#FFFFFF00,#FF0000FF" },
            ],
            [],
            [{ value: "asleep", style: "#FFFFFF00,#FF0000FF" }],
        ]),
        expected: {
            records: [
                {
                    start: 946684800000,
                    comments: [],
                    end: 946684800000 + 3599999,
                    status: 'awake',
                },
                {
                    start: 946684800000 + 3600000,
                    comments: [],
                    status: 'asleep',
                },
                {
                    start: 946684800000,
                    comments: [ "Comment\ntext" ],
                    end: 946684800000 + 3599999,
                    status: 'asleep',
                },
                {
                    start: 946684800000 + 3600000,
                    comments: [],
                    status: 'awake',
                },
            ],
            status_map: {
                awake: '#FFFFFFFF,#FFFFFFFF',
                asleep: '',
            },
        },
    });

    /*
     * Test every combination of headers
     */

    for ( var row_offset = 0; row_offset < 2; ++row_offset ) {

        var cells = [
            explicit_time_header.slice(0),
            [ { value: "2001-01-01" }, {}, { value: "", style: "#FFFFFFFF,#FFFFFFFF" } ],
            [ { value: "2001-01-02" }, {}, {}, { value: "", style: "#FFFFFFFF,#FFFFFFFF" } ],
            [ { value: "2001-01-03" }, {}, {}, {}, { value: "", style: "#FFFFFFFF,#FFFFFFFF" } ],
            [ { value: "2001-01-04" }, {}, {}, {}, {}, { value: "", style: "#FFFFFFFF,#FFFFFFFF" } ],
        ];

        cells.forEach( r => {
            while ( r.length < explicit_time_header.length ) r.push({});
        });

        if ( row_offset ) cells.shift();

        var cells_rotated = [];
        cells.forEach(
            (r,n) => r.forEach( (c,m) => {
                if ( !cells_rotated[m] ) cells_rotated[m] = [];
                cells_rotated[m][n] = c;
            })
        );

        var header_expected = {
            records: [
                { start: 978307200000, comments: [], end: 978310799999, status: 'awake' },
                { start: 978310800000, comments: [], end: 978314399999, status: 'asleep' },
                { start: 978314400000, comments: [], end: 978400799999, status: 'awake' },
                { start: 978400800000, comments: [], end: 978404399999, status: 'asleep' },
                { start: 978404400000, comments: [], end: 978490799999, status: 'awake' },
                { start: 978490800000, comments: [], end: 978494399999, status: 'asleep' },
                { start: 978494400000, comments: [], end: 978580799999, status: 'awake' },
                { start: 978580800000, comments: [], end: 978584399999, status: 'asleep' },
                { start: 978584400000, comments: []                   , status: 'awake' },
            ],
            status_map: {
                awake: '',
                asleep: '#FFFFFFFF,#FFFFFFFF',
            },
        };

        test_parse({
            file_format: "SpreadsheetGraph",
            name: "sheet with row_offset==" + row_offset,
            input: create_diary(cells),
            spreadsheetify: "disable",
            expected: header_expected,
        });

        test_parse({
            file_format: "SpreadsheetGraph",
            name: "sheet with row_offset==" + row_offset + " (rotated)",
            input: create_diary(cells_rotated),
            spreadsheetify: "disable",
            expected: header_expected,
        });

    }

    /*
     * Test different header durations
     */

    [ 60, 30, 15, 5 ].forEach( duration => {

        var time_headers = [ '' ];
        for ( var time = 0; time !=60*24; time += duration ) {
            var hours   = Math.floor( time / 60 ).toString();
            var minutes =           ( time % 60 ).toString();
            if ( hours  .length == 1 ) hours   = '0' + hours;
            if ( minutes.length == 1 ) minutes = '0' + minutes;
            time_headers.push( hours + ':' + minutes );
        }

        test_parse({
            file_format: "SpreadsheetGraph",
            name: "diary with duration=" + duration,
            input: create_diary([
                time_headers,
                [
                    { value: "2000-01-01" },
                    {},
                    { value: "", style: "#FFFFFFFF,#FFFFFFFF" },
                ],
            ]),
            spreadsheetify: "disable",
            expected: {
                records: [
                    {
                        start: 946684800000 + 0*duration,
                        comments: [],
                        end: 946684800000   + 1*duration*1000*60 - 1,
                        status: 'awake',
                    },
                    {
                        start: 946684800000 + 1*duration*1000*60,
                        comments: [],
                        end: 946684800000   + 2*duration*1000*60 - 1,
                        status: 'asleep',
                    },
                    {
                        start: 946684800000 + 2*duration*1000*60,
                        comments: [],
                        status: 'awake',
                    }
                ],
                status_map: {
                    asleep: '#FFFFFFFF,#FFFFFFFF',
                    awake: '',
                },
            }
        });

    });

    /*
     * Test data outside the header/body
     */

    [
        {
            name: "unused values outside the header/body",
            cells:
            [
                [ {}, { value: "unused value" } ],
                [ {}, { value: "unused value" } ],
                [ {}, { value: "unused value" } ],
                [ {}, { value: "unused value" } ],
            ],
            statuses: [
                "toilet", "sleep aid", "caffeine", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "drink", "exercise", "noise", "alarm", "in bed", "out of bed", "toilet", "sleep aid", "caffeine", "awake", "asleep", "snack", "meal", "alcohol", "chocolate",
                "sleep aid", "caffeine", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "drink", "exercise", "noise", "alarm", "in bed", "out of bed", "toilet", "sleep aid", "caffeine", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "drink",
                "caffeine", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "drink", "exercise", "noise", "alarm", "in bed", "out of bed", "toilet", "sleep aid", "caffeine", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "drink", "exercise",
                "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "drink", "exercise", "noise", "alarm", "in bed", "out of bed", "toilet", "sleep aid", "caffeine", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "drink", "exercise", "noise",
            ],
            status_map: {
                "awake"     :"#FFFFFFFF,#FFFFF0003",
                "asleep"    :"#FFFFFFFF,#FFFFF0004",
                "snack"     :"#FFFFFFFF,#FFFFF0005",
                "meal"      :"#FFFFFFFF,#FFFFF0006",
                "alcohol"   :"#FFFFFFFF,#FFFFF0007",
                "chocolate" :"#FFFFFFFF,#FFFFF0008",
                "caffeine"  :"#FFFFFFFF,#FFFFF0002",
                "drink"     :"#FFFFFFFF,#FFFFF0009",
                "sleep aid" :"#FFFFFFFF,#FFFFF0001",
                "exercise"  :"#FFFFFFFF,#FFFFF0010",
                "toilet"    :"#FFFFFFFF,#FFFFF0000",
                "noise"     :"#FFFFFFFF,#FFFFF0011",
                "alarm"     :"#FFFFFFFF,#FFFFF0012",
                "in bed"    :"#FFFFFFFF,#FFFFF0013",
                "out of bed":"#FFFFFFFF,#FFFFF0014"
            }

        },

        {
            name: "full legend",
            cells:
            [
                [
                    { style: "#FFFFFFFF,#FFFFF0000", value: "awake" },
                    { style: "#FFFFFFFF,#FFFFF0001", value: "asleep" },
                    { style: "#FFFFFFFF,#FFFFF0002", value: "snack" },
                    { style: "#FFFFFFFF,#FFFFF0003", value: "meal" },
                    { style: "#FFFFFFFF,#FFFFF0004", value: "alcohol" },
                    { style: "#FFFFFFFF,#FFFFF0005", value: "chocolate" },
                    { style: "#FFFFFFFF,#FFFFF0006", value: "caffeine" },
                    { style: "#FFFFFFFF,#FFFFF0007", value: "drink" },
                    { style: "#FFFFFFFF,#FFFFF0008", value: "sleep aid" },
                    { style: "#FFFFFFFF,#FFFFF0009", value: "exercise" },
                    { style: "#FFFFFFFF,#FFFFF0010", value: "toilet" },
                    { style: "#FFFFFFFF,#FFFFF0011", value: "noise" },
                    { style: "#FFFFFFFF,#FFFFF0012", value: "alarm" },
                    { style: "#FFFFFFFF,#FFFFF0013", value: "in bed" },
                    { style: "#FFFFFFFF,#FFFFF0014", value: "out of bed" },
                ]
            ],
            statuses: [
                "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid",
                "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise",
                "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet",
                "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise",
            ],
            status_map: {
                "awake"     :"#FFFFFFFF,#FFFFF0000",
                "asleep"    :"#FFFFFFFF,#FFFFF0001",
                "snack"     :"#FFFFFFFF,#FFFFF0002",
                "meal"      :"#FFFFFFFF,#FFFFF0003",
                "alcohol"   :"#FFFFFFFF,#FFFFF0004",
                "chocolate" :"#FFFFFFFF,#FFFFF0005",
                "caffeine"  :"#FFFFFFFF,#FFFFF0006",
                "drink"     :"#FFFFFFFF,#FFFFF0007",
                "sleep aid" :"#FFFFFFFF,#FFFFF0008",
                "exercise"  :"#FFFFFFFF,#FFFFF0009",
                "toilet"    :"#FFFFFFFF,#FFFFF0010",
                "noise"     :"#FFFFFFFF,#FFFFF0011",
                "alarm"     :"#FFFFFFFF,#FFFFF0012",
                "in bed"    :"#FFFFFFFF,#FFFFF0013",
                "out of bed":"#FFFFFFFF,#FFFFF0014"
            }

        },

        {
            name: "legend with text below styles",
            cells:
            [
                [
                    { style: "#FFFFFFFF,#FFFFF0000" },
                    { style: "#FFFFFFFF,#FFFFF0001" },
                    { style: "#FFFFFFFF,#FFFFF0002" },
                    { style: "#FFFFFFFF,#FFFFF0003" },
                    { style: "#FFFFFFFF,#FFFFF0004" },
                    { style: "#FFFFFFFF,#FFFFF0005" },
                    { style: "#FFFFFFFF,#FFFFF0006" },
                    { style: "#FFFFFFFF,#FFFFF0007" },
                    { style: "#FFFFFFFF,#FFFFF0008" },
                    { style: "#FFFFFFFF,#FFFFF0009" },
                    { style: "#FFFFFFFF,#FFFFF0010" },
                    { style: "#FFFFFFFF,#FFFFF0011" },
                    { style: "#FFFFFFFF,#FFFFF0012" },
                    { style: "#FFFFFFFF,#FFFFF0013" },
                    { style: "#FFFFFFFF,#FFFFF0014" },
                ],
                [
                    { value: "awake" },
                    { value: "asleep" },
                    { value: "snack" },
                    { value: "meal" },
                    { value: "alcohol" },
                    { value: "chocolate" },
                    { value: "caffeine" },
                    { value: "drink" },
                    { value: "sleep aid" },
                    { value: "exercise" },
                    { value: "toilet" },
                    { value: "noise" },
                    { value: "alarm" },
                    { value: "in bed" },
                    { value: "out of bed" },
                ]
            ],
            statuses: [
                "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid",
                "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise",
                "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet",
                "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise",
            ],
            status_map: {
                "awake"     :"#FFFFFFFF,#FFFFF0000",
                "asleep"    :"#FFFFFFFF,#FFFFF0001",
                "snack"     :"#FFFFFFFF,#FFFFF0002",
                "meal"      :"#FFFFFFFF,#FFFFF0003",
                "alcohol"   :"#FFFFFFFF,#FFFFF0004",
                "chocolate" :"#FFFFFFFF,#FFFFF0005",
                "caffeine"  :"#FFFFFFFF,#FFFFF0006",
                "drink"     :"#FFFFFFFF,#FFFFF0007",
                "sleep aid" :"#FFFFFFFF,#FFFFF0008",
                "exercise"  :"#FFFFFFFF,#FFFFF0009",
                "toilet"    :"#FFFFFFFF,#FFFFF0010",
                "noise"     :"#FFFFFFFF,#FFFFF0011",
                "alarm"     :"#FFFFFFFF,#FFFFF0012",
                "in bed"    :"#FFFFFFFF,#FFFFF0013",
                "out of bed":"#FFFFFFFF,#FFFFF0014"
            }

        },

        {
            name: "one legend item missing",
            cells:
            [
                [
                    { style: "#FFFFFFFF,#FFFFF0000", value: "awake" },
                    { style: "#FFFFFFFF,#FFFFF0001", value: "asleep" },
                    { style: "#FFFFFFFF,#FFFFF0002", value: "snack" },
                    { style: "#FFFFFFFF,#FFFFF0003", value: "meal" },
                    { style: "#FFFFFFFF,#FFFFF0004", value: "alcohol" },
                    { style: "#FFFFFFFF,#FFFFF0005", value: "chocolate" },
                    { style: "#FFFFFFFF,#FFFFF0006", value: "caffeine" },
                    //{ style: "#FFFFFFFF,#FFFFF0007", value: "drink" },
                    { style: "#FFFFFFFF,#FFFFF0008", value: "sleep aid" },
                    { style: "#FFFFFFFF,#FFFFF0009", value: "exercise" },
                    { style: "#FFFFFFFF,#FFFFF0010", value: "toilet" },
                    { style: "#FFFFFFFF,#FFFFF0011", value: "noise" },
                    { style: "#FFFFFFFF,#FFFFF0012", value: "alarm" },
                    { style: "#FFFFFFFF,#FFFFF0013", value: "in bed" },
                    { style: "#FFFFFFFF,#FFFFF0014", value: "out of bed" },
                ]
            ],
            statuses: [
                "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid",
                "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise",
                "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet",
                "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "asleep", "snack", "meal", "alcohol", "chocolate", "caffeine", "drink", "sleep aid", "exercise", "toilet", "noise",
            ],
            status_map: {
                "awake"     :"#FFFFFFFF,#FFFFF0000",
                "asleep"    :"#FFFFFFFF,#FFFFF0001",
                "snack"     :"#FFFFFFFF,#FFFFF0002",
                "meal"      :"#FFFFFFFF,#FFFFF0003",
                "alcohol"   :"#FFFFFFFF,#FFFFF0004",
                "chocolate" :"#FFFFFFFF,#FFFFF0005",
                "caffeine"  :"#FFFFFFFF,#FFFFF0006",
                "drink"     :"#FFFFFFFF,#FFFFF0007",
                "sleep aid" :"#FFFFFFFF,#FFFFF0008",
                "exercise"  :"#FFFFFFFF,#FFFFF0009",
                "toilet"    :"#FFFFFFFF,#FFFFF0010",
                "noise"     :"#FFFFFFFF,#FFFFF0011",
                "alarm"     :"#FFFFFFFF,#FFFFF0012",
                "in bed"    :"#FFFFFFFF,#FFFFF0013",
                "out of bed":"#FFFFFFFF,#FFFFF0014"
            }

        },

        {
            name: "several legend items missing",
            cells:
            [
                [
                    { style: "#FFFFFFFF,#FFFFF0000", value: "awake" },
                    //{ style: "#FFFFFFFF,#FFFFF0001", value: "asleep" },
                    { style: "#FFFFFFFF,#FFFFF0002", value: "snack" },
                    //{ style: "#FFFFFFFF,#FFFFF0003", value: "meal" },
                    { style: "#FFFFFFFF,#FFFFF0004", value: "alcohol" },
                    //{ style: "#FFFFFFFF,#FFFFF0005", value: "chocolate" },
                    { style: "#FFFFFFFF,#FFFFF0006", value: "caffeine" },
                    //{ style: "#FFFFFFFF,#FFFFF0007", value: "drink" },
                    { style: "#FFFFFFFF,#FFFFF0008", value: "sleep aid" },
                    //{ style: "#FFFFFFFF,#FFFFF0009", value: "exercise" },
                    { style: "#FFFFFFFF,#FFFFF0010", value: "toilet" },
                    //{ style: "#FFFFFFFF,#FFFFF0011", value: "noise" },
                    { style: "#FFFFFFFF,#FFFFF0012", value: "alarm" },
                    //{ style: "#FFFFFFFF,#FFFFF0013", value: "in bed" },
                    { style: "#FFFFFFFF,#FFFFF0014", value: "out of bed" },
                ]
            ],
            statuses: [
                "awake", "exercise", "snack", "asleep", "alcohol", "meal", "caffeine", "chocolate", "sleep aid", "drink", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "exercise", "snack", "asleep", "alcohol", "meal", "caffeine", "chocolate", "sleep aid",
                "exercise", "snack", "asleep", "alcohol", "meal", "caffeine", "chocolate", "sleep aid", "drink", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "exercise", "snack", "asleep", "alcohol", "meal", "caffeine", "chocolate", "sleep aid", "drink",
                "snack", "asleep", "alcohol", "meal", "caffeine", "chocolate", "sleep aid", "drink", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "exercise", "snack", "asleep", "alcohol", "meal", "caffeine", "chocolate", "sleep aid", "drink", "toilet",
                "asleep", "alcohol", "meal", "caffeine", "chocolate", "sleep aid", "drink", "toilet", "noise", "alarm", "in bed", "out of bed", "awake", "exercise", "snack", "asleep", "alcohol", "meal", "caffeine", "chocolate", "sleep aid", "drink", "toilet", "noise",
            ],
            status_map: {
                "awake"     :"#FFFFFFFF,#FFFFF0000",
                "asleep"    :"#FFFFFFFF,#FFFFF0003",
                "snack"     :"#FFFFFFFF,#FFFFF0002",
                "meal"      :"#FFFFFFFF,#FFFFF0005",
                "alcohol"   :"#FFFFFFFF,#FFFFF0004",
                "chocolate" :"#FFFFFFFF,#FFFFF0007",
                "caffeine"  :"#FFFFFFFF,#FFFFF0006",
                "drink"     :"#FFFFFFFF,#FFFFF0009",
                "sleep aid" :"#FFFFFFFF,#FFFFF0008",
                "exercise"  :"#FFFFFFFF,#FFFFF0001",
                "toilet"    :"#FFFFFFFF,#FFFFF0010",
                "noise"     :"#FFFFFFFF,#FFFFF0011",
                "alarm"     :"#FFFFFFFF,#FFFFF0012",
                "in bed"    :"#FFFFFFFF,#FFFFF0013",
                "out of bed":"#FFFFFFFF,#FFFFF0014"
            }

        },

    ].forEach( test => {

        let cells = [
            [ { value: "2000-01-01" } ],
            [ { value: "2000-01-02" } ],
            [ { value: "2000-01-03" } ],
            [ { value: "2000-01-04" } ],
        ];

        for ( var n=0; n!=24; ++n ) {
            cells.forEach( (row,m) => {
                var value = ( ( n + m ) % 15 /* current value of DiaryBase.status_matches().length */ ).toString();
                while ( value.length < 4 ) value = '0' + value;
                row[n+1] = { value: "", style: "#FFFFFFFF,#FFFFF" + value };
            });
        }

        test.cells.forEach( (e,n) => cells[n] = cells[n].concat(e) );

        let records = test.statuses.map(
            (status,n) => ({
                start: 946684800000 + n*3600000,
                comments:[],
                end: 946684800000 + (n+1)*3600000 - 1,
                status: status
            })
        );

        delete records[records.length-1].end;

        test_parse({
            file_format: "SpreadsheetGraph",
            name: test.name,
            input: create_diary(cells),
            spreadsheetify: "disable",
            expected: {
                records: records,
                status_map: test.status_map,
            }
        });

    });

});
