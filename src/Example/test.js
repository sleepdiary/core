describe("Example format", () => {

    // TODO: replace "Example" with "YourFormat"

    // TODO: create an empty diary object for use in various tests:
    var empty_diary = ...;

    // TODO: test an empty diary:
    test_parse({
        file_format: "Example",
        name: "empty diary",
        input: empty_diary,
        expected: {
            ...
        }
    });

    // TODO: test one or both ways to create a simple non-empty object:
    test_parse({
        file_format: "Example",
        name: "simple example",
        input: "... string containing a valid record ...",
        expected: {
            ...
        }
    });
    test_parse({
        file_format: "Example",
        name: "object example",
        input: { ... object containing a valid record ... },
        expected: {
            ...
        }
    });

    // TODO: test conversion to "output" format:
    test_to({
        name: "output test",
        format: "output",
        input: ...
        expected: ...
    });

    // TODO: test conversion to Standard format:
    test_to({
        name: "standard format test",
        format: "Standard",
        input: ...
        expected: [
            ...
        ],
    });

    // TODO: test initialisation from Standard format:
    test_from_standard({
        name: "standard format test",
        format: "Example",
        input: [
            ...
        ],
        expected: ...,
    });

    // TODO: two empty diaries:
    test_merge({
        name: "two empty diaries",
        left: empty_diary,
        right: empty_diary,
        expected: ...
    });

    // TODO: left is empty, right is non-empty:
    test_merge({
        name: "left empty, right non-empty",
        left: empty_diary,
        right: ...
        expected: ...
    });

    // TODO: left is non-empty, right is empty:
    test_merge({
        name: "left non-empty, right empty",
        left: ...
        right: empty_diary,
        expected: ...
    });

    // TODO: left and right have the same records (should be deduplicated):
    test_merge({
        name: "two identical diaries",
        left: ...
        right: ...
        expected: ...
    });

    // TODO: left and right have different records:
    test_merge({
        name: "two different diaries",
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
