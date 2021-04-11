# Sleep Diary Formats

Documentation and code for file formats that record circadian rhythms.

## Format documentation

Third-party documentation for a variety of file formats.  These describe issues that implementors may face in practice, but which are not mentioned in the official documentation.

* [Plees Tracker](src/PleesTracker/)
* [Sleep as Android](src/SleepAsAndroid/)
* [Sleepmeter](src/Sleepmeter/)
* [SpreadsheetGraph](src/SpreadsheetGraph/)
* [SpreadsheetTable](src/SpreadsheetTable/)

The example code can translate these formats to and from [Standard format](src/Standard), which provides a standard interface for common functionality.

## JavaScript library

Each format includes example code for loading and saving documents in the relevant format.  They have been packaged into a JavaScript library you can use in your own projects.

To check if the project works in your browser, try the [browser-based unit tests](browser_test.html).  Then [download the library](sleep-diary-formats.js) and check out [the library documentation](doc/).

### Demo

Select a sleep diary to analyse.  It will be processed in your browser - no data will be sent to a server:

<input id="diary-input" type="file">

<div id="diary-output"></div>

# Reporting issues

Please [create a new GitHub issue](https://github.com/sleep-diary-formats/sleep-diary-formats.github.io/issues/new/choose) or <a href="https://discord.com/channels/725475399156629615/725477106103877772">mention it on Discord</a>.  GitHub is generally a better place to discuss feature requests, but Discord is more private if you need to include data from your personal sleep diary.

Please get in touch if you would like to add a new format!

<script src="sleep-diary-formats.js"></script>
<script src="index.js"></script>
