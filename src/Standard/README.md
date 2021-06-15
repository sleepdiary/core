# Standardised Diary Format

Common baseline format for sleep diaries.  This format was created as part of this project, to provide baseline functionality between different formats.  It does not try to represent every feature in every format.  The format also includes data that can be easily calculated, even if it is not present in the source file format.  This may make it easier to produce some graphs and statistics.

This file is the format's official documentation.

## File format

Data is stored in a JavaScript object.  It can be serialised to and from JSON.

## `minimum_day_duration`

This record indicates the minimum expected day duration in milliseconds.  By default, day numbers are calculated by looking for "asleep" events at least this far apart.


## `maximum_day_duration`

This record indicates the maximum expected day duration in milliseconds.  By default, missing records are detected by looking for "asleep" events at most this far apart.

## `records`

An array of records, indicating the user's status during a given period.  Each record is an object with values described below.

### `start`

Unix time in milliseconds when the record started.

### `start_timezone`

User's timezone at the time referred to by the `start` record (or `undefined` if unknown).  Should be a string from the [tz database](https://en.wikipedia.org/wiki/Tz_database) - either a locale-related timezone like `Europe/London`, or a timezone of the form `Etc/GMT[+-]N`.

### `end`

Unix time in milliseconds before which the record ended.

### `end_timezone`

User's timezone at the time referred to by the `end` record (or `undefined` if unknown).  Should be a string from the [tz database](https://en.wikipedia.org/wiki/Tz_database) - either a locale-related timezone like `Europe/London`, or a timezone of the form `Etc/GMT[+-]N`.

### `duration`

Duration of the record in milliseconds.  This is normally equal to `end - start`, and should not be greater than that amount.  But some formats will record an interruption (e.g. a period of wakefulness during sleep) by altering the duration without altering the start or end times.

### `status`

Status associated with the record (usually `awake` or `asleep`).  See `DiaryStandardRecordStatus` in [format.js](format.js) for the complete list.

### `tags`

An array of tags associated with this record.  Each value must be a string.

### `comments`

An array of comments associated with this record.  Each value can either be a string (for a comment with no associated time) or an object with `time` and `text` members (for timestamped comments).

### `day_number`

(Estimated) day number associated with the record.  This may be useful for creating graphs, but should not be relied on for statistics.

Most formats do not store day-related values explicitly, so this value is usually inferred from the data.  In some cases, these inferences may be incorrect - for example, the day number is increased by a maximum of 2 at a time, no matter how large the gap between two records.  In other cases, they may not be meaningful at all - for example, people with polyphasic sleep might not have a meaningful concept of days.  Days typically begin at the start of an "asleep" event, because sleep is the only record type guaranteed to exist in all sleep diary formats.

### `start_of_new_day`

Boolean value indicating whether the current day number is different to the previous record's day number.  This may be useful for creating graphs, but should not be relied on for statistics.

### `is_primary_sleep`

Boolean value indicating whether this appears to be the primary sleep for the current day.  This may be useful for creating graphs, but should not be relied on for statistics.

Most formats do not differentiate between types of sleep, so this value is usually inferred from the data.  The inference is currently done by looking for the longest sleep in each day.

### `missing_record_after`

Boolean value indicating whether the user appears to have missed a record after the current one.  This may be useful for creating graphs, but should not be relied on for statistics.

Most formats do not detect this automatically, so this value is usually inferred from the data.  The inference is currently done by looking for two `asleep` records with no `awake` record between them, or vice versa.

# In this directory

You may find the following useful:

* [JavaScript example code](format.js)
* [Test cases](test.js)
