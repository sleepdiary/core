const sleep_diary_exports = (
    ( typeof module !== "undefined" && module.exports )
        ? require("./sleep-diary-formats.js")
        : window
),
      serialiser = /** @type {Function} */( sleep_diary_exports["DiaryLoader"] || {} )["serialiser"]
;

var roundtrip_modifiers = {};
function register_roundtrip_modifier(format,callback) {
    if ( format == "Example" ) {
        console.error("register_roundtrip_modifier() called with format == 'Example' - please set the format");
    } else {
        roundtrip_modifiers[format] = callback;
    }
}

function compare_diaries(observed,expected,debug) {
    var clone_observed = Object.assign({},observed);
    var clone_expected = Object.assign({},expected);
    delete clone_observed["spreadsheet"];
    delete clone_expected["spreadsheet"];
    Object.keys(clone_observed).forEach( function(key) {
        if ( clone_observed[key] == serialiser ) delete clone_observed[key];
    });
    Object.keys(clone_expected).forEach( function(key) {
        if ( clone_expected[key] == serialiser ) delete clone_expected[key];
    });
    if ( debug ) {
        console.error("Observed and expected objects should be equal:\n",observed,expected);
    }
    return expect(clone_observed)["toEqual"](clone_expected);
}

/**
 * @param {Object} test
 * @param {Function=} serialiser
 */
function test_constructor(test,serialiser) {
    var diary = null, error = false;
    var console_error = console.error;
    system_timezone = "Etc/GMT";
    if ( test.quiet ) console.error = function() {};
    try {
        var input = test.input;
        if ( test.clone_contents ) {
            input.contents = JSON.parse(JSON.stringify(input.contents));
        }
        if ( input && typeof(input) == "function" ) input = input();
        if ( typeof(test.input) == "string" || test.input["file_format"] ) {
            diary = sleep_diary_exports["new_sleep_diary"](test.input,serialiser);
        } else {
            diary = sleep_diary_exports["new_sleep_diary"]({ "file_format": function() { return "archive" }, "contents": test.input },serialiser);
        }
    } catch (e) {
        if ( !test.error ) console_error.call(console,"Unexpected error constructing object:",e);
        error = true;
    }
    if ( test.quiet ) console.error = console_error;

    it(`produces the correct error for "${test.name}"`, function() {
        expect(error)["toEqual"](!!test.error);
    });

    if ( !error ) {
        // if the following error occurs, you need to edit your ["extension"]() function:
        it(`produces an extension other than ".exm" for "${test.name}"`, function() {
            expect(diary["format_info"]().extension)["not"]["toEqual"](".exm");
        });
    }
    return error == !!test.error ? diary : null;
}

// disable all but the test(s) you care about:
function test_is_runnable(test) {
    //return test.name == 'my test';
    //return test.debug;
    return true;
}

function test_parse(test) {

    if ( !test.name ) test.name = "format's 'parse' test";

    // disable all but the test you care about:
    if ( !test_is_runnable(test) ) return;

    var debug = (
        test.debug
        // || true // enable debugging for all tests
    );

    var spreadsheetify = (test.spreadsheetify||'') != "disable";
    var output         = (test.output        ||'') != "disable";

    var diary = test_constructor(test,serialiser);

    if ( diary ) {

        it(`reads test "${test.name}" correctly`, function() {
            compare_diaries(diary,test.expected,debug);
        });

        it(`produces a file of the correct format for "${test.name||"format's 'parse' test"}"`, function() {
            expect(diary["file_format"]())["toEqual"](test.file_format);
        });

        it(`URL-ifies "${test.name||"format's 'parse' test"}" correctly`, function() {
            var url = diary["to"]("url");
            var observed = sleep_diary_exports["new_sleep_diary"]({
                "file_format": "url",
                "contents": url,
            },serialiser);
            compare_diaries(observed,diary,debug);
        });

        /*
         * This is a very rough test for roundtripping between formats.
         * It compares two diaries modified like so:
         *
         * 1. current_format                                     -> Standard
         * 2. current_format -> another_format -> current_format -> Standard
         *
         * It's normal to lose data in the conversion to Standard format,
         * but formats shouldn't lose any more data than that.
         */
        var n = 0;
        sleep_diary_exports["sleep_diary_formats"].forEach( function(format) {
            it(`converts "${test.name||"format's 'parse' test"}" to ${format.name} correctly in test_parse()`, function() {
                return new Promise(function(resolve, reject) {
                    try {
                        diary["to_async"](format.name).then(
                            function(formatted) {
                                try {
                                    formatted["to_async"](diary["file_format"]()).then(
                                        function(roundtripped) {
                                            var observed = Object.assign({},roundtripped["to"]("Standard"));
                                            var expected = Object.assign({},diary       ["to"]("Standard"));
                                            if ( debug ) console.log({
                                                "0. test and format": [ test, format ],
                                                "1. original": diary,
                                                "2. original to Standard": diary["to"]("Standard"),
                                                "3. original to formatted": formatted,
                                                "4. original to formatted to Standard": formatted["to"]("Standard"),
                                                "5. original to formatted and back again": roundtripped,
                                                "6. observed": observed,
                                                "7. expected": expected,
                                            });
                                            [observed,expected].forEach(
                                                diary => diary["records"] = diary["records"].map(
                                                    record => Object.assign({},record)
                                                )
                                            );
                                            if ( roundtrip_modifiers[diary["file_format"]()] ) {
                                                roundtrip_modifiers[diary["file_format"]()](expected,observed,format);
                                            }
                                            if ( formatted["format_info"]()["statuses"] ) {
                                                var statuses = {};
                                                formatted["format_info"]()["statuses"].forEach( s => statuses[s] = 1 );
                                                var total_expected = expected["records"].length;
                                                expected["records"] = expected["records"].filter(
                                                    r => statuses[r["status"]]
                                                );
                                                if ( total_expected != expected["records"].length ) {
                                                    [observed,expected].forEach(
                                                        diary => diary["records"] = diary["records"].map( r => {
                                                            var ret = Object.assign( {}, r );
                                                            delete ret["missing_record_after"];
                                                            return ret;
                                                        })
                                                    );
                                                }
                                            }
                                            compare_diaries(observed,expected,debug);
                                            resolve();
                                        },
                                        function(error) {
                                            console.error(`formatted.to_async("${diary["file_format"]()}") failed:`,diary,formatted,error);
                                            reject(error);
                                        }
                                    );
                                } catch (error) {
                                    console.error(`formatted.to_async("${diary["file_format"]()}") failed:`,diary,formatted,error);
                                    reject(error);
                                }
                            },
                            function(error) {
                                console.error(`diary.to_async("${format.name}") failed:`,diary,error);
                                reject(error);
                            }
                        );
                    } catch (error) {
                        console.error(`diary.to_async("${format.name}") failed:`,diary,error);
                        reject(error);
                    }
                });
            });
        });

        if ( typeof module === "undefined" || !module.exports ) {

            if ( output ) {
                it(`outputs "${test.name||"format's 'parse' test"}" correctly`, function() {
                    return new Promise(function(resolve, reject) {
                        try {
                            diary["to_async"]("output").then( function(output) {
                                var diary_loader = new sleep_diary_exports["DiaryLoader"](
                                    function(observed,source) {
                                        if ( debug ) {
                                            console.log({
                                                "0. test": test,
                                                "1. original": diary,
                                                "2. observed": observed,
                                                "3. source": source,
                                            });
                                        }
                                        compare_diaries(observed,diary,debug);
                                        resolve();
                                    },
                                    function(error) {
                                        console.error("DiaryLoader failed:",diary,output,error);
                                        reject(error);
                                    }
                                );
                                diary_loader["load"]( sleep_diary_exports["DiaryLoader"]["to_url"](output) );
                            });
                        } catch (error) {
                            console.error("diary.to_async() failed:",diary,error);
                            reject(error);
                        }
                    });
                });
            }

            if ( spreadsheetify ) {
                it(`spreadsheetifies "${test.name||"format's 'parse' test"}" correctly`, function() {
                    var clone1 = Object.assign({},diary);
                    Object.keys(clone1)
                        .forEach( function(key) {
                            if ( (typeof(clone1[key])).toLocaleLowerCase() == "function" ) { delete clone1[key] }
                        })
                    ;
                    return new Promise(function(resolve, reject) {
                        try {
                            diary["to_async"]("spreadsheet")
                                .then( function(raw) {
                                    return sleep_diary_exports["_Spreadsheet_buffer_to_spreadsheet"](raw).then(
                                        function(spreadsheet) {
                                            var diary_loader = new sleep_diary_exports["DiaryLoader"](
                                                function(diary,source) {
                                                    var clone2 = Object.assign({},diary);
                                                    Object.keys(clone2)
                                                        .forEach( function(key) {
                                                            if ( (typeof(clone2[key])).toLocaleLowerCase() == "function" ) { delete clone2[key] }
                                                        })
                                                    ;
                                                    compare_diaries(clone2,clone1,debug);
                                                    resolve();
                                                },
                                                function(error) {
                                                    console.error("DiaryLoader failed:",diary,spreadsheet,error);
                                                    reject(error);
                                                }
                                            );
                                            diary_loader["load"]( spreadsheet );
                                        })
                                })
                        } catch (error) {
                            console.error("diary.to_async() failed:",diary,error);
                            reject(error);
                        }
                    });
                });
            }

        }

    }

}

function test_from_standard(test) {

    var debug = (
        test.debug
        // || true // enable debugging for all tests
    );

    if ( !test.name ) test.name = "format's 'from standard' test";

    if ( !test_is_runnable(test) ) return;

    var diary = test_constructor({
        name: test.name,
        input: {
            "file_format": function() { return "Standard" },
            "contents": {
                "file_format": "Standard",
                "records": test.input
            }
        }},serialiser);
    var expected_diary = test_constructor({ name: test.name, input: test.expected },serialiser);

    it(`initialises "${test.name}" from Standard format correctly`, function() {

        expect( !!diary )["toEqual"]( true );
        expect( !!expected_diary )["toEqual"]( true );

        if ( diary && expected_diary ) {
            compare_diaries(diary["to"](test.format),expected_diary,debug);
        }

    });

}

function test_to(test) {

    var debug = (
        test.debug
        // || true // enable debugging for all tests
    );

    if ( !test.name ) test.name = "format's 'to' test";

    if ( !test_is_runnable(test) ) return;

    var diary = test_constructor(test);

    if ( diary ) {
        it(`converts "${test.name}" to "${test.format}" correctly in test_to`, function() {
            try {
                return diary["to_async"](test.format).then(
                    function(converted) {
                        var observed = (
                            ( test.format == "Standard" )
                            ? converted["records"]
                            : converted["contents"]
                        );
                        if ( debug ) {
                            console.error("Observed and expected objects should be equal:\n",observed,test.expected);
                        }
                        return expect(observed)["toEqual"]( test.expected )
                    });
            } catch (error) {
                console.error("diary.to_async() failed:",diary,error);
                throw error;
            }
        });
    }

}

function test_merge(test) {

    if ( !test.name ) test.name = "format's 'merge' test";

    if ( !test_is_runnable(test) ) return;

    it(`merges "${test.name}" correctly`, function() {
        var clone = Object.assign(
            {},
            sleep_diary_exports["new_sleep_diary"](test.left)
                ["merge"](sleep_diary_exports["new_sleep_diary"](test.right))
        );
        delete clone["spreadsheet"];
        expect(clone)["toEqual"](test.expected);
    });

}
