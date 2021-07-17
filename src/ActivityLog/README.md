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

# Creating activity logs

Every program that logs your activity has its own bespoke format, designed around the requirements of that program.  And for privacy and security reasons, access to the data is often limited.

[The preprocessor](preprocessor.js) supports some formats automatically, and it (or an equivalent) should be included in programs that read Activity Log format.  But other formats will need to be processed by hand.  For example, if you create a [CSV](https://en.wikipedia.org/wiki/Comma-separated_values) file, you might need to use Excel to reformat dates and remove extra columns.

A collection of examples are presented below, but your best source of logs depends on your personal behaviour.  For example, [Google Takeout](https://support.google.com/accounts/answer/3024190?hl=en) allows you to download a lot of data about your Google account, which is more useful if you have an Android phone than an iPhone.

## Desktop browsers

Browsers store the date and time every time you go to a new page.  Depending on your settings, this information might be deleted after a month or so.  Most browsers store this in a standard format that can be extracted with a little work.

The first step is to find your history database.  Type `chrome:version` or `about:support` in the address bar - depending on your browser, one or other of them should take you to a page full of technical information.  The line that says `Profile Path` or `Profile Directory` tells you where your profile is saved.

Sleep diary programs that use the preprocessor can extract just the timestamps without sending any data to a server.  If you are comfortable with that solution, you can import the database directly.  Click to add a source, go to your profile folder, then select either `History`, `History.db` or `places.sqlite` depending on your browser.  If you are using MacOS and can't see your profile folder, press <tt>Cmd</tt> + <tt>Shift</tt> + <tt>G</tt> and type the folder name.

Your history database contains your entire browser history, which you might not be comfortable giving to a web page.  The rest of this section describes how to anonymise your activity log before loading it in a browser.  This is more technical, and you can skip it if you are comfortable with the solution above.

To extract your activity log by hand, you will need to use a command-line program called [SQLite](https://www.sqlite.org/download.html).  This is installed by default in MacOS and available for all Linux distributions, but you will have to install it manually if you use Windows.  Once you have installed SQLite, run one of these commands on a command-line (remember to replace `...` with your profile directory):

    # optional command to extract history from Chrome-based browsers:
    sqlite3 -csv C:\...\History '.output activity-log.chrome.csv' 'SELECT "ActivityStart","ActivityEnd"' 'SELECT visit_time/1000-11644473600000,visit_time/1000-11644473600000 FROM visits'
    # optional command to extract history from Firefox:
    sqlite3 -csv C:\...\place.sqlite '.output activity-log.firefox.csv' 'SELECT "ActivityStart","ActivityEnd"' 'SELECT visit_date/1000,visit_date/1000 FROM moz_historyvisits'
    # optional command to extract history from Safari:
    sqlite3 -csv C:\...\History.db '.output activity-log.safari.csv' 'SELECT "ActivityStart","ActivityEnd"' 'SELECT (visit_time+978307200)*1000,(visit_time+978307200)*1000 FROM history_visits'

Depending on your browser, your file will be called `activity-log.chrome.csv`, `activity-log.firefox.csv` or `activity-log.safari.csv`.  Confirm its contents by opening it as a spreadsheet, then click to add the source.

## Desktop operating systems

Your operating system logs a lot of system information, like when it boots up and shuts down.  If you turn your computer on in the morning and off at night, you can use that information as an activity log.

If you use Windows, you can create an activity log with PowerShell.  Click `Start`, type `PowerShell` and press enter.  Copy the following block of text, then right-click on the PowerShell window and click `paste`:

    if ( $out_path = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)+"\activity-log.windows.csv" ) {
      write "Saving to $out_path..."
      write "ActivityStart,ActivityEnd" | Out-File -encoding ASCII -FilePath $out_path
      ForEach ( $log in Get-EventLog System ) {
        if ( $log.EventId -eq 12 ) { # powered on
           $start_time = Get-Date -Format u $log.TimeGenerated
        } elseif ( $log.EventId -eq 13 ) { # powered off
           $end_time = Get-Date -Format u $log.TimeGenerated
           write "$start_time,$end_time" | Out-File -encoding ASCII -append -FilePath $out_path
        }
      }
      write "You can close PowerShell now."
    }
    # Now press enter twice
    
Press enter twice to run the command.  After a few seconds, a file called `activity-log.windows.csv` will appear on your desktop.  You can close PowerShell once that happens.

If you use Linux, run the following command on a command-line:

    echo 'ActivityStart,ActivityEnd' > ~/activity-log.linux.csv
    sudo zcat -f /var/log/syslog* \
      | cut -c 1-15 \
      | uniq \
      | while read REPLY ; do DATE="$( date -Iseconds -d "$REPLY" )"; echo "$DATE,$DATE" ; done \
      >> ~/activity-log.linux.csv

A file called `activity-log.linux.csv` will slowly be populated in your home directory.  The program might take a minute or two to run.

# Activity Log algorithm

Here is a rough description of the way activities are converted to statuses:

1. combine activities from all sources and sort them by start date
2. start at the first activity
3. find the longest gap that is less than `maximum_day_length_ms` ahead
4. create a sleep record for that gap, and a wake record from now until then
5. move forward to the first activity after the gap
6. go to 3
