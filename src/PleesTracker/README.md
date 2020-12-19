# Plees Tracker Format

Plees Tracker is an Android app, available on [F-Droid](https://f-droid.org/en/packages/hu.vmiklos.plees_tracker/).

The following resources may be useful:

* [the app's source code](https://github.com/vmiklos/plees-tracker)
* [the file that imports and exports data](https://github.com/vmiklos/plees-tracker/blob/master/app/src/main/java/hu/vmiklos/plees_tracker/DataModel.kt)

The export format is very simple.  The documentation below explains it in some detail.

# In this directory

You may find the following useful:

* [JavaScript example code](format.js)
* [Test cases](test.js)
* [Examples](examples/)

# Export process

From the app's main page, do:

1. press the three vertical dots in the top-right
2. press `Export to File`
3. select a location and filename
4. press `SAVE` in the bottom-right

# Export format

This is an ASCII CSV file.  Here is an example:

    sid,start,stop,rating
    1,1234567890987,2345678909876,0
    2,3456789098765,4567890987654,5

## `sid`

Unique ID of this record.  Incrementing integer starting at 1.

## `start` and `stop`

Indicate the time the user started and stopped tracking, in integer milliseconds since the Unix epoch.

## `rating`

Integer between 0 and 5 indicating the user's rating.
