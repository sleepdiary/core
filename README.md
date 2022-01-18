# Sleep Diary Core Library

Documentation and code for file formats that record circadian rhythms.

## Format documentation

Third-party documentation for a variety of file formats.  These describe issues that implementors may face in practice, but which are not mentioned in the official documentation.

- [Activity Log](src/ActivityLog/)
- [Plees Tracker](src/PleesTracker/)
- [Sleep as Android](src/SleepAsAndroid/)
- [Sleepmeter](src/Sleepmeter/)
- [Spreadsheet Graph](src/SpreadsheetGraph/)
- [Spreadsheet Table](src/SpreadsheetTable/)
- [SleepChart 1.0](src/SleepChart1/)

The example code can translate these formats to and from [Standard format](src/Standard), which provides a standard interface for common functionality.

## JavaScript library

Each format includes example code for loading and saving documents in the relevant format.  They have been packaged into a JavaScript library you can use in your own projects.

To check if the project works in your browser, try the [browser-based unit tests](browser_test.html).  Then [download the library](sleepdiary-core.min.js) and check out [the library documentation](doc/).

## Get Involved

### I found a bug, how should I tell you?

[Create a new bug report](https://github.com/sleepdiary/core/issues/new?assignees=&labels=&template=bug_report.md&title=) and we'll get right on it.

### I'd like to request a new feature, what should I say?

Please [create a new feature request](https://github.com/sleepdiary/core/issues/new?assignees=&labels=&template=feature_request.md&title=).  We'll try to sort out your problem.

### I'd like to change the code, how do I get started?

Take a look at our [getting started guide](https://github.com/sleepdiary/docs/blob/main/development/getting-started.md).  Or if you'd like to talk to someone first, [open a discussion](https://github.com/sleepdiary/sleepdiary.github.io/discussions) and describe what you're planning.

## License

Sleep Diary Core Library, Copyright © 2020-2022 [Sleepdiary Developers](mailto:sleepdiary@pileofstuff.org)

Sleep Diary Core Library comes with ABSOLUTELY NO WARRANTY.  This is free software, and you are welcome to redistribute it under certain conditions.  For details, see [the license statement](LICENSE).
