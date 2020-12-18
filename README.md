# Sleep Diary Formats

Documentation and code for file formats that record circadian rhythms.

## Format documentation

Third-party documentation for a variety of file formats.  These describe issues that implementors may face in practice, but which are not mentioned in the official documentation.

* [Sleepmeter](src/Sleepmeter/)
* [Sleep as Android](src/SleepAsAndroid/)

## JavaScript library

Each format includes example code for loading and saving documents in the relevant format.  They have been packaged into a JavaScript library you can use in your own projects.

To see the library in action, specify a sleep diary in the box below.  The result will be processed in your browser - no data will be sent to a server:

<input id="diary-input" type="file">

To check if the project works in your browser, try the [browser-based unit tests](browser_test.html).  Then [download the library](sleep-diary-formats.js) and check out [the library documentation](doc/).

# Reporting issues

You can report issues through GitHub or on <a href="https://discord.com/channels/725475399156629615/725477106103877772">Discord</a>.  GitHub is generally a better place to discuss feature requests, but Discord is more private if you need to include data from your personal sleep diary.

Please get in touch if you would like to add a new format!

<script src="sleep-diary-formats.js"></script>
<script src="index.js"></script>
