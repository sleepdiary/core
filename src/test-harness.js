const new_sleep_diary = (
    ( typeof module !== "undefined" && module.exports )
        ? require("./sleep-diary-formats.js")
        : window
).new_sleep_diary;

function test_constructor(test) {
    var diary = null, error = false;
    try {
        if ( typeof(test.input) == "string" || test.input.file_format ) {
            diary = new_sleep_diary(test.input);
        } else {
            diary = new_sleep_diary({ "file_format": () => "archive", "contents": test.input });
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

    var diary = test_constructor(test);

    if ( diary ) {

        it(`reads test "${test.name}" correctly`, function() {
            expect(Object.assign({},diary)).toEqual(test.expected);
        });

        it(`produces a file of the correct format for "${test.name||"format's 'parse' test"}"`, function() {
            expect(diary.file_format()).toEqual(test.file_format);
        });

        it(`URL-ifies "${test.name||"format's 'parse' test"}" correctly`, function() {
            expect(diary).toEqual(new_sleep_diary({
                "file_format": "url",
                "contents": diary.to("url"),
            }));
        });

    }

}

function test_from_standard(test) {

    if ( !test.name ) test.name = "format's 'from standard' test";

    var diary = test_constructor({
        name: test.name,
        input: {
            "file_format": () => "Standard",
            contents: {
                file_format: "Standard",
                records: test.input
            }
        }});
    var expected_diary = test_constructor({ name: test.name, input: test.expected });

    if ( diary && expected_diary ) {

        it(`initialises "${test.name}" from Standard format correctly"`, function() {
            expect( diary.to(test.format) ).toEqual( expected_diary );
        });

    }

}

function test_to(test) {

    if ( !test.name ) test.name = "format's 'to' test";

    var diary = test_constructor(test);

    if ( diary ) {

        if ( test.format == "Standard" ) {
            it(`converts "${test.name}" to "${test.format}" correctly"`, function() {
                expect( diary.to(test.format).records ).toEqual( test.expected );
            });
        } else {
            it(`converts "${test.name}" to "${test.format}" correctly"`, function() {
                expect( diary.to(test.format).contents ).toEqual( test.expected );
            });
        }

    }

}

function test_merge(test) {

    if ( !test.name ) test.name = "format's 'merge' test";

    it(`merges "${test.name}" correctly"`, function() {
        expect(
            Object.assign(
                {},
                new_sleep_diary(test.left)
                    .merge(new_sleep_diary(test.right))
            )
        ).toEqual(test.expected);
    });

}
