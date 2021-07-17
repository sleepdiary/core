# Sleep Diary Formats

Documentation and code for file formats that record circadian rhythms.

## Format documentation

Third-party documentation for a variety of file formats.  These describe issues that implementors may face in practice, but which are not mentioned in the official documentation.

* [Activity Log](src/ActivityLog/)
* [Plees Tracker](src/PleesTracker/)
* [Sleep as Android](src/SleepAsAndroid/)
* [Sleepmeter](src/Sleepmeter/)
* [Spreadsheet Graph](src/SpreadsheetGraph/)
* [Spreadsheet Table](src/SpreadsheetTable/)
* [SleepChart 1.0](src/SleepChart1/)

The example code can translate these formats to and from [Standard format](src/Standard), which provides a standard interface for common functionality.

## JavaScript library

Each format includes example code for loading and saving documents in the relevant format.  They have been packaged into a JavaScript library you can use in your own projects.

To check if the project works in your browser, try the [browser-based unit tests](browser_test.html).  Then [download the library](sleepdiary-library.js) and check out [the library documentation](doc/).

# Reporting issues

Please [create a new GitHub issue](https://github.com/sleepdiary-library/sleepdiary-library.github.io/issues/new/choose) or [mention it on Discord](https://discord.com/channels/725475399156629615/725477106103877772).  GitHub is generally a better place to discuss feature requests, but Discord is more private if you need to include data from your personal sleep diary.  When reporting a bug, make sure to include [unit test results](browser_test.html) for your browser - even if they don't find anything, it helps us to rule out things that _can't_ be the problem.

Please get in touch if you would like to add a new format!
