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
        expected: {
            records: [],
            ...
        }
    });

    // TODO: test one or both ways to create a simple non-empty object:
    test_parse({
        file_format: "Example",
        name: "Simple example",
        input: "... string containing a valid record ...",
        //spreadsheetify: "disable", // uncomment if this format is not compatible with spreadsheets
        expected: {
            ...
        }
    });
    test_parse({
        file_format: "Example",
        name: "Object example",
        input: { ... object containing a valid record ... },
        //spreadsheetify: "disable", // uncomment if this format is not compatible with spreadsheets
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

    // TODO: test initialisation from Standard format:
    test_from_standard({
        name: "Standard Format test",
        format: "Example",
        input: [
            ...
        ],
        expected: ...,
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
