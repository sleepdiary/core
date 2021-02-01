const sleep_diary_exports = (
    ( typeof module !== "undefined" && module.exports )
        ? require("./sleep-diary-formats.js")
        : window
);
const new_sleep_diary = sleep_diary_exports.new_sleep_diary;
const Spreadsheet     = sleep_diary_exports.Spreadsheet;

function test_constructor(test) {
    var diary = null, error = false;
    try {
        if ( typeof(test.input) == "string" || test.input.file_format ) {
            diary = new_sleep_diary(test.input);
        } else {
            diary = new_sleep_diary({ "file_format": function() { return "archive" }, "contents": test.input });
        }
    } catch (e) {
        if ( !test.error ) console.warn(e);
        error = true;
    }

    it(`produces the correct error for "${test.name}"`, function() {
        expect(error).toEqual(!!test.error);
    });

    return error == !!test.error ? diary : null;
}


function test_parse(test) {

    if ( !test.name ) test.name = "format's 'parse' test";

    var spreadsheetify = (test.spreadsheetify||'') != "disable";

    var diary = test_constructor(test);

    if ( diary ) {

        it(`reads test "${test.name}" correctly`, function() {
            let clone = Object.assign({},diary);
            delete clone.spreadsheet;
            expect(clone).toEqual(test.expected);
        });

        it(`produces a file of the correct format for "${test.name||"format's 'parse' test"}"`, function() {
            expect(diary.file_format()).toEqual(test.file_format);
        });

        it(`URL-ifies "${test.name||"format's 'parse' test"}" correctly`, function() {
            let clone1 = Object.assign({},diary);
            let clone2 = Object.assign({},new_sleep_diary({
                "file_format": "url",
                "contents": diary.to("url"),
            }));
            delete clone1.spreadsheet;
            delete clone2.spreadsheet;
            expect(clone1).toEqual(clone2);
        });

        if ( spreadsheetify && ( typeof module === "undefined" || !module.exports ) ) {
            it(`converts "${test.name||"format's 'parse' test"}" to spreadsheet correctly`, function() {
                let clone1 = Object.assign({},diary);
                Object.keys(clone1)
                    .forEach( function(key) {
                        if ( (typeof(clone1[key])).toLocaleLowerCase() == "function" ) { delete clone1[key] }
                    })
                ;
                return new Promise(function(resolve, reject) {
                    diary.to_async("spreadsheet")
                        .then( function(raw) {
                            return Spreadsheet.buffer_to_spreadsheet(raw).then(
                                function(spreadsheet) {
                                    var diary_loader = new DiaryLoader(
                                        function(diary,source) {
                                            let clone2 = Object.assign({},diary);
                                            Object.keys(clone2)
                                                .forEach( function(key) {
                                                    if ( (typeof(clone2[key])).toLocaleLowerCase() == "function" ) { delete clone2[key] }
                                                })
                                            ;
                                            delete clone1.spreadsheet;
                                            delete clone2.spreadsheet;
                                            expect(clone2).toEqual(clone1);
                                            resolve();
                                        },
                                        reject
                                    );
                                    diary_loader.load( spreadsheet );
                                })
                        })
                });
            });
        }

    }

}

function test_from_standard(test) {

    if ( !test.name ) test.name = "format's 'from standard' test";

    var diary = test_constructor({
        name: test.name,
        input: {
            "file_format": function() { return "Standard" },
            contents: {
                file_format: "Standard",
                records: test.input
            }
        }});
    var expected_diary = test_constructor({ name: test.name, input: test.expected });

    it(`initialises "${test.name}" from Standard format correctly"`, function() {

        expect( !!diary ).toEqual( true );
        expect( !!expected_diary ).toEqual( true );

        if ( diary && expected_diary ) {
            let clone1 = Object.assign({},diary.to(test.format));
            let clone2 = Object.assign({},expected_diary);
            delete clone1.spreadsheet;
            delete clone2.spreadsheet;
            expect( clone1 ).toEqual( clone2 );
        }

    });

}

function test_to(test) {

    if ( !test.name ) test.name = "format's 'to' test";

    var diary = test_constructor(test);

    if ( diary ) {

        if ( test.format == "Standard" ) {
            it(`converts "${test.name}" to "${test.format}" correctly"`, function() {
                return diary.to_async(test.format).then(function(converted) {
                    expect( converted.records ).toEqual( test.expected );
                });
            });
        } else {
            it(`converts "${test.name}" to "${test.format}" correctly"`, function() {
                return diary.to_async(test.format).then(function(converted) {
                    expect( converted.contents ).toEqual( test.expected );
                });
            });
        }

    }

}

function test_merge(test) {

    if ( !test.name ) test.name = "format's 'merge' test";

    it(`merges "${test.name}" correctly"`, function() {
        let clone = Object.assign(
            {},
            new_sleep_diary(test.left)
                .merge(new_sleep_diary(test.right))
        );
        delete clone.spreadsheet;
        expect(clone).toEqual(test.expected);
    });

}
