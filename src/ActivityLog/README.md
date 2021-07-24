# Activity Log Format

A lot of software records the moment or time period where an event happens.  For example, your calendar has start and end times for events; and your browser cache stores the time you visited each page.  Activity Log Format is a standardised way of representing these logs, so we can guess your sleep times by seeing when no events occurred.

Activity Logs requires some technical skill to produce and are often inaccurate.  If you have the choice, it is better to avoid this format.

# In this directory

You may find the following useful:

* [JavaScript preprocessor](preprocessor.js)
* [JavaScript preprocessor example](preprocessor.html)
* [JavaScript example code](engine.js)
* [Test cases](test.js)
* [Examples](examples/)

[The preprocessor](preprocessor.js) is not distributed as part of the JavaScript library.  Implementors are expected to copy or replicate it into their own programs.

# File format

Here is an example activity log:

    maximum_day_length_ms=129600000
    ActivityStart,ActivityEnd
    2016-08-04T02:01:00Z,1234567890
    2013-08-05T03:02:01Z,1073741824

An activity log contains three sections:

* `settings` - optional line to configure the way activities are processed
* `header` - exactly one line matching `Activity started,Activity ended`
* `records` - one or more lines containing pairs of dates

Each setting must be present at most once.  Setting lines must match the regular expression `/^[a-z_]+=[0-9]+$/`.  At present, only one setting is used:

* `maximum_day_length_ms`: when activities are converted to records, ensure no day can be more than this many milliseconds (default: 32 hours)

Each record specifies the time when an activity began and ended.  Records should be in one of the following times:

* [Unix time](https://en.wikipedia.org/wiki/Unix_time) - number of (milli)seconds since 00:00:00 UTC on 1 January 1970
* [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) ISO 8601 dates, such as `2002-10-01T12:34:56Z`

Some other formats may be processed correctly, although this depends on your browser.

Unix times measured in seconds must be after 01:46:40 UTC on 9 September 2001 (1,000,000,000 seconds since the epoch).

# Activity Log algorithm

Here is a rough description of the way activities are converted to statuses:

1. combine activities from all sources and sort them by start date
2. start at the first activity
3. find the longest gap that is less than `maximum_day_length_ms` ahead
4. create a sleep record for that gap, and a wake record from now until then
5. move forward to the first activity after the gap
6. go to 3
