describe("Spreadsheet", () => {

    if ( !test_is_runnable({ name: "Spreadsheet" }) ) return;

    [
        [        null, NaN ],
        [          0 ,   0 ],
        [          1 ,   1000000000000 ],
        [ new Date(0),   0 ],
        [ new Date(1),   1 ],
        [         "0",   0 ],
        [       "1"  , 3600000 ],
        [       "1AM", 3600000 ],
        [       "1am", 3600000 ],
        [       "1Am", 3600000 ],
        [       "1aM", 3600000 ],
        [ "MidNight - 01:00", 0 ],
        [ "01:00 - MidNight", 3600000 ],
        [ "14:30", 52200000 ],
    ].forEach(
        function(test) {
            it(`parses "${test[0]}" correctly`, function() {
                expect(sleep_diary_exports["_Spreadsheet_parse_timestamp"](test[0]))["toEqual"](test[1]);
            });
        }
    );

    it(`converts between sheets and objects correctly`, function() {

        let associated = {};

        var spreadsheet = new sleep_diary_exports["Spreadsheet"](associated,[
            {
                sheet: "records",
                cells: [
                    { "member": "test_time", "type": "time", },
                    { "member": "test_duration", "type": "duration", },
                    { "member": "test_number", "type": "number", },
                    { "member": "test_text", "type": "text", },
                    {
                        "members": [ "test_low_level_1", "test_low_level_2" ],
                        "export": (array_element,row,offset) => {
                            row[offset+0] = { "value": array_element["test_low_level_1"] * 2, "style": "" };
                            row[offset+1] = { "value": 'a' + array_element["test_low_level_2"], "style": "" };
                            return true;
                        },
                        "import": (array_element,row,offset) => {
                            array_element["test_low_level_1"] = row[offset+0]["value"] / 2;
                            array_element["test_low_level_2"] = row[offset+1]["value"].substr(1);
                            return true;
                        },
                    }
                ]
            },

        ]);

        var input = {

            "spreadsheet": spreadsheet,
            "sheets": [
                {
                    "name": "records",
                    "cells": [
                        [
                            { "style": "", "value": "test_time" },
                            { "style": "", "value": "test_duration" },
                            { "style": "", "value": "test_number" },
                            { "style": "", "value": "test_text" },
                            { "style": "", "value": "test_low_level_1" },
                            { "style": "", "value": "test_low_level_2" }
                        ],
                        [
                            { "style": "", "value": new Date( "1970-01-01T03:25:45.678Z" ) },
                            { "style": "", "value": new Date( "1899-12-30T06:30:56.789Z" ) },
                            { "style": "", "value": 987654321 },
                            { "style": "", "value": "abcdefghij" },
                            { "style": "", "value": 6 },
                            { "style": "", "value": "a3" }
                        ]
                    ]
                }
            ]

        };

        var expected = {
            "records": [
                {
                    "test_time": 12345678,
                    "test_duration": 23456789,
                    "test_number": 987654321,
                    "test_text": "abcdefghij",
                    "test_low_level_1": 3,
                    "test_low_level_2": "3",
                }
            ]
        };
        expect( spreadsheet["load"](input) )["toBeTrue"]();
        expect( spreadsheet["synchronise"]() )["toBeTrue"]();
        expect( associated )["toEqual"](expected);

    });

});
