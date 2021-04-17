# SleepChart 1.0 Format

SleepChart 1.0 is a Windows program, available from a link near the bottom of [a page on super-memory.com](https://www.supermemo.com/en/archives1990-2015/articles/sleepchart).

The source code for this program is not publicly available, but there is a link near the bottom of the page offering to release it on request.

We have not been able to find any official documentation about the file format.

# In this directory

You may find the following useful:

* [JavaScript example code](format.js)
* [Test cases](test.js)
* [Examples](examples/)

# Using the program

During normal use, users will generally do the following:

* to create a record, click on the start time in the grid area, then click on the end time
* to save the diary, click _File_ then _Save_ or _Save As_

These commands are rarely useful in normal use, but can be very useful during testing:

* to toggle the flags for a record: right-click on the record, then click _Forced awakening_ or _Delayed retirement_
* to view data about a record: click on the second-from-last icon in the toolbar (the grey "i"), then click on the record
* to change the first day: click _Edit_ then _Set first day_

Users can also click _File_ then _Import from Excel_.  We have not investigated that feature.

## Flag terminology

The program describes the two flags using several terms:

To toggle the first flag, the user (un)ticks a menu item labeled _Forced awakening_.  Then a confirmation box appears, which either asks if they want to _mark the selected block as interrupted sleep_ or if they want to _mark the selected block as terminated naturally_, depending on which way the flag is being toggled.

To toggle the second flag, the user (un)ticks a menu item labeled _Delayed retirement_.  Then a confirmation box appears, which either asks if they want to _mark the selected block as forcefully delayed sleep_ or if they want to _mark the selected block as initiated naturally_, depending on which way the flag is being toggled.

# File format

SleepChart 1.0 uses a simple binary format, containing a series of 12-byte records.  Each record contains the following:

1. a 32-bit float representing the start time
2. a 32-bit float representing the end time
3. a one-byte flag representing whether the user's sleep terminated naturally
4. a one-byte flag representing whether the user went to sleep naturally
5. two bytes which seem to be unused

This can be represented in C with a `struct`:

    struct record {
      float start, end;
      char terminated_naturally, retired_naturally;
      char unused[2];
    };

Dates are represented as the number of days since _Fri 31 Dec 00:00:00 GMT 1999_, so for example `1.0` represents _Sat  1 Jan 00:00:00 GMT 2000_.

## Detecting SleepChart 1.0 files

Because SleepChart 1.0 doesn't have a header or other identifying information, a lot of files in other formats can be detected incorrectly as being in SleepChart 1.0 format.  However, some features of the SleepChart 1.0 program make it easier to reduce the rate of false positives.  Here are some techniques to confirm if a file is actually in this format:

* the file must be a multiple of 12 bytes long
* the first start time must be greater than or equal to `1.0`
* start times after the first must be greater than or equal to the previous end time
* end times must be greater than (not equal to) the associated start time
