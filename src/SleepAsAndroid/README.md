# Sleep as Android Format

Sleep as Android is an Android app, available on [Google Play](https://play.google.com/store/apps/details/?id=com.urbandroid.sleep).  Some functionality is locked after the 14 day trial, and can be unlocked by buying the [unlock app](https://play.google.com/store/apps/details?id=com.urbandroid.sleep.full.key&hl=en_GB&gl=US) or with an in-app purchase.  This page was written after testing the free version.

The source code for this program is not publicly available, but some related code is available from [Urbandroid Team on GitHub](https://github.com/urbandroid-team/).

Sleep as Android is fairly well documented:

* [main site](https://sleep.urbandroid.org/)
* [documentation site](https://docs.sleep.urbandroid.org/)
* [Developer documentation](https://docs.sleep.urbandroid.org/devs/0parent.html)
* [PHP CSV-to-JSON parser](https://github.com/urbandroid-team/sleep-csv-to-json)

The documentation below adds details and discusses some undocumented features.  We have tried to make the information accurate as of the time of writing, but the app is being actively developed and may change behaviour in future.

# In this directory

You may find the following useful:

* [JavaScript example code](engine.js)
* [Test cases](test.js)
* [Examples](examples/)

# Export process

While using the app, here is how to export your data:

1. go to the app's dashboard
2. scroll up to the top
3. click on the hamburger button in the top-left
4. click ''Backup''
5. click ''Export data''
4. the app will tell you the location of the zip file where your data is saved

# Export format

The export format is a zip file containing three files:

* `alarms.json` - a list of alarms
* `prefs.xml` - app preferences
* `sleep-export.csv` - the main sleep diary

## `alarms.json`

This is a standard JSON file, and can be parsed with any JSON parser.

This file is not mentioned in the developer documentation, which might suggest the format is likely to change in future.  Please get in contact if you are interested in maintaining the documentation for this file.

## `prefs.xml`

This is a standard XML file, and can be parsed with most XML parsers.  But text strings are encoded as [CDATA sections](https://en.wikipedia.org/wiki/CDATA), which are not supported by all parsers.

This file is not mentioned in the developer documentation, which might suggest the format is likely to change in future.  Please get in contact if you are interested in maintaining the documentation for this file.

## `sleep-export.csv`

This is a UTF-8 encoded CSV file without a byte order mark.  Here is an example:

    Id,Tz,From,To,Sched,Hours,Rating,Comment,Framerate,Snore,Noise,Cycles,DeepSleep,LenAdjust,Geo,"7:00"
    "1606420800000","Europe/London","26. 11. 2020 20:00","27. 11. 2020 7:00","27. 11. 2020 7:00","11.000","0.0","Manually added","10007","-1","-1.0","-1","-1.0","0","","0.0"

The CSV file is largely documented in [the developer documentation](https://docs.sleep.urbandroid.org/devs/csv.html), with some other useful notes in [the Sleepcloud API documentation](https://docs.sleep.urbandroid.org/devs/sleepcloud_api.html#event-labels).  You may want to read that before looking at the additional notes below.

Note that fields are always surrounded by double quotes, and that there are zero or more undocumented `"Event"` values after the _(times)_ values.

### `Id`

Unique record identificator (timestamp of the record beginning).  Integer number of milliseconds since the Unix epoch.

This timestamp seems to refer to the same time as the `From` event, except with higher accuracy.  See [the discussion of date issues](#date-issues).

### `Tz`

String indicating the current timezone.  Appears to use [TZ database names](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).

### `From`, `To` and `Sched`

Date and time of the beginning and end of the recording period, and of the next scheduled sleep tracking terminating alarm.

These values are always of the form `"MM. dd. yyyy h:mm"` (with quotes).  Note that, unlike all the other values, hours are not padded with leading zeros.  For example, 1am on January 1st 2000 would be written as `01. 01. 2000 1:00` instead of `01. 01. 2000 01:00`.

<a name="date-issues"></a>These times have various issues around clocks going back.  For example, consider a record with a `Tz` of `Europe/London` and a `From` time of `25. 10. 2020 1:30`.  There is no way to know whether the user went to sleep 30 minutes before the clocks went back or 30 minutes after they went back.  In theory, a user could have a 50-minute nap and an end timestamp of `25. 10. 2000 1:20`.

Because of these issues, implementations are encouraged to calculate times like so:

* ignore `From`, always calculate the record's start time with `Id`
* ignore `To`, always calculate the record's end time by adding `Id` and `Hours`
* calculate the scheduled alarm time like so:
  1. calculate the amount of time between `To` and `Sched`, ignoring time zones and daylight savings time
  2. if the duration is less than zero, add one hour
  3. add the duration to the record's end time
  4. round the result to the nearest minute

Implementations should store the user's timezone when creating new records, so that users can measure the effects of e.g. jet lag.  But the timezone `Etc/GMT` is available for implementations that do not know the user's timezone.

### `Hours`

Floating point duration of the sleep record, in hours.  See also [the LenAdjust field](#LenAdjust-field), which is also used when calculating the total amount of time slept.

### `Rating`

Floating point user rating (0.0 – 5.0 with 0.25 step)

### `Comment`

Free text user input and hash tags describing how the user slept.  This field escapes characters like so:

* literal double quotes are encoded as a pair of double quotes (`""`)
* newlines are escaped as a space, a backslash, an `n`, and a final space (` \n `)
* literal backslash characters are not escaped

The best way to decode this field is to unescape double quotes, assume the string ` \n ` always represents a newline, and not to escape any other character.  This will produce incorrect results for the literal string ` \n `, which is unlikely to be a problem in the real world.

The `comment` field can contain zero or more hashtags.

The following values are available from the user interface:

* `#alcohol`
* `#baby`
* `#baddream`
* `#cloudy`
* `#cold`
* `#cpap`
* `#dream`
* `#food`
* `#gooddream`
* `#hot`
* `#laugh`
* `#love`
* `#lullaby`
* `#med`
* `#menses`
* `#rain`
* `#sick`
* `#snore`
* `#sport`
* `#storm`
* `#stress`
* `#talk`
* `#work`

Additionally, the app has been observed to automatically add the following tags:

* `#fullmoon` - seems to be added whenever a full moon is scheduled
* `#light` - seems to be added when light levels are high during sleep

Repeated tags are represented by appending `_2x` or `_3x`, e.g. `#snore_2x #lullaby_3x`

### `Framerate`

Unused.  Usually an integer close to `10000`, but this should not be relied upon.

### `Snore`

Snoring value.  This is either `"-1"` (if snoring detection was turned off) or an integer number of seconds when snoring was detected.  So a value of `"0"` indicates snoring detection was enabled, but no snoring was detected.

### `Noise`

Average level of noise during the night.  This is either `"-1.0"` (if noise measurements were not avaialable)  or a floating point number indicating the noise level (higher numbers mean more noise).

### `Cycles`

Number of sleep cycles measured.  This is either `"-1"` (if the record was entered manually) or an integer number of measured cycles.

### `DeepSleep`

Floating point fraction of the night spent in deep sleep.  This is either `"-2.0"` or `"-1.0"` (if [hypnogram](https://en.wikipedia.org/wiki/Hypnogram) recording was disabled), or a number in the range "`0.0`" to `"1.0"`.

### <a name="LenAdjust-field"></a>`LenAdjust`

Integer value by which to adjust the "Hours" record to account for time spent falling asleep, pausing, awake, etc.; or `"-1.0"` if the record was added manually.  If not `"-1.0"`, this is either zero or a negative integer number indicating the number of minutes by which to adjust the "Hours" record.

The amount of time spent asleep can be calculated with the following pseudocode:

    minutes_spent_asleep = Hours * 60
    if ( !strings_equal( LenAdjust, "-1.0" ) ) {
      minutes_spent_asleep += to_integer( LenAdjust );
    }

Note that the above differentiates between `"-1.0"` (record added manually) and `"-1"` (subtract 1 minute).

### `Geo`

Hashed value of the user's location.  This is not a traditional [geohash](https://en.wikipedia.org/wiki/Geohash), as the app has been observed to generate values that would be invalid geohashes.  It is most likely a hexadecimal representation of a 32-bit integer, presumably using data collected from [the Android Location API](https://developer.android.com/reference/android/location/Location).

### `(times)` fields

Each time header is a timestamp of the form `"h:mm"`.  It indicats the period for which this column provides time values.

The value in the second line is a floating point number indicating the accelerometric (actigraphic) data aggregated for the given period.

The value in the third column is a non-negative floating point number indicating the measured noise value for the given period.

Real-world diaries have been observed to have a different number of columns in the first and second lines.  This can cause an `event` field to be placed in a `time` column, or vice versa.  Robust implementations should check for such lines.

### `Event` fields

Each record contains zero or more `Event` fields after the time fields.  These contain two or three dash-separated values.

The first value is the event label.  Most event labels are documented in [the Sleepcloud API](https://docs.sleep.urbandroid.org/devs/sleepcloud_api.html#event-labels), but some undocumented events have been seen in the wild.

The second value is the Unix timestamp in milliseconds when the event occurred.

Some labels have a third field containing an associated value.  [The Sleepcloud API documentation](https://docs.sleep.urbandroid.org/devs/sleepcloud_api.html#event-labels) seems to append `(true)` to event labels that have an associated value.

Real-world diaries have been observed to have a different number of columns in the first and second lines.  This can cause an `event` field to be placed in a `time` column, or vice versa.  Robust implementations should check for such lines.

Here is some information about undocumented fields that have been seen in the wild:

* `DEVICE` - assumed to be a device identifier, contains a large number value that differs between devices but seems not to differ between records on a single device
* `DHA` - meaning unknown, contains a value which appears to be a large number
* `LUX` - assumed to mean the current light level, the value appears to be illuminance in [lux](https://en.wikipedia.org/wiki/Lux)
