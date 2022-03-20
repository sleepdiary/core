register_roundtrip_modifier("Example",function(our_diary,roundtripped_diary,other_format) {
    /*
     * TODO: add workarounds for expected information loss when tests in this file
     * roundtrip to other formats and back again.
     *
     * TODO: add similar workarounds in the "test.js" files for every other format,
     * to fix those files' tests that roundtrip to this format and back again.
     *
     * test_parse() checks that roundtrips work between your format and others by comparing:
     *
     * 1. your format                                  -> Standard
     * 2. your format -> another format -> your format -> Standard
     *
     * Information loss during the roundtrip often leads to a bug in your format,
     * the standard format, or the target format.  But it can also be normal
     * limitation of the conversion process.  For example, formats that support
     * tags will lose information when converting to a format that doesn't
     * support tags.
     *
     * Whenever possible, you should treat these errors as bugs.
     * But if data loss is inevitable, this function lets you
     * modify the values before they are compared.
     *
     */
    switch ( other_format.name ) {
    case "SomeFormat":
        [our_diary,roundtripped_diary].forEach(function(diary) {
            diary["records"].forEach( function(record) {
                /*
                 * TODO: explain why key1 and key2 cannot be usefully compared
                 */
                ["key1","key2"].forEach(function(key) {
                    delete record[key];
                });
            });
        });
    }
});


describe("Example format", () => {

    // TODO: replace "Example" with "YourFormat"

    // TODO: create an empty diary object for use in various tests:
    var empty_diary = ...;

    // TODO: test an empty diary:
    test_parse({
        file_format: "Example",
        name: "Empty diary",
        input: empty_diary,
        //spreadsheetify: "disable", // uncomment if this format is not compatible with spreadsheets
        //output: 'disable', // uncomment if this format contains information that can't be output
        //debug: true, // uncomment to get console.log() messages about this test
        expected: {
            "records": [],
            ...
        }
    });

    // TODO: test one or both ways to create a simple non-empty object:
    test_parse({
        file_format: "Example",
        name: "Simple diary",
        input: "... string containing a valid record ...",
        //spreadsheetify: "disable", // uncomment if this format is not compatible with spreadsheets
        //output: 'disable', // uncomment if this format contains information that can't be output
        //debug: true, // uncomment to get console.log() messages about this test
        expected: {
            ...
        }
    });
    test_parse({
        file_format: "Example",
        name: "Object diary",
        input: { ... object containing a valid record ... },
        //spreadsheetify: "disable", // uncomment if this format is not compatible with spreadsheets
        //output: 'disable', // uncomment if this format contains information that can't be output
        //debug: true, // uncomment to get console.log() messages about this test
        expected: {
            ...
        }
    });

    // TODO: test a hard-to-parse comment:
    test_parse({
        file_format: "Example",
        name: "Hard-to-parse diary",
        input: "... string containing hard-to-parse records ...",
        //spreadsheetify: "disable", // uncomment if this format is not compatible with spreadsheets
        //output: 'disable', // uncomment if this format contains information that can't be output
        //debug: true, // uncomment to get console.log() messages about this test
        expected: {
            ...
        }
    });

    // TODO: test conversion to "output" format:
    test_to({
        name: "Output test",
        format: "output",
        input: ...
        expected: ...
    });

    // TODO: test conversion to Standard format:
    test_to({
        name: "Standard Format test",
        format: "Standard",
        input: ...
        expected: [
            ...
        ],
    });

    // TODO: two empty diaries:
    test_merge({
        name: "Two empty diaries",
        left: empty_diary,
        right: empty_diary,
        expected: ...
    });

    // TODO: left is empty, right is non-empty:
    test_merge({
        name: "Left empty, right non-empty",
        left: empty_diary,
        right: ...
        expected: ...
    });

    // TODO: left is non-empty, right is empty:
    test_merge({
        name: "Left non-empty, right empty",
        left: ...
        right: empty_diary,
        expected: ...
    });

    // TODO: left and right have the same records (should be deduplicated):
    test_merge({
        name: "Two identical diaries",
        left: ...
        right: ...
        expected: ...
    });

    // TODO: left and right have different records:
    test_merge({
        name: "Two different diaries",
        left: ...
        right: ...
        expected: ...
    });

    // TODO: other format-specific merges
    test_merge({
        name: ...
        left: ...
        right: ...
        expected: ...
    });

    // TODO: add format-specific tests

});
