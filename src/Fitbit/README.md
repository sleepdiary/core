# Fitbit format

[Fitbit](https://www.fitbit.com/global/fi/home) is a company that produces smart watches to track various body statistics, including sleep and wake times.  The devices can be bought from their website, among other places.  This engine was written with the help of Discord user *welli*.

## In this directory

You may find the following useful:

- [JavaScript example code](engine.js)
- [Test cases](test.js)

## Export format

The sleep diary export feature produces an ASCII CSV file without a byte order mark.  Here is an example:

```csv
Sleep
Start Time,End Time,Minutes Asleep,Minutes Awake,Number of Awakenings,Time in Bed,Minutes REM Sleep,Minutes Light Sleep,Minutes Deep Sleep
"2010-10-13 11:12PM","2010-10-11 10:11AM","500","50","30","500","100","300","100"
"2010-10-12 10:11PM","2010-10-11 9:10AM","500","50","30","500","100","300","100"
"2010-10-11 9:10PM","2010-10-11 8:09AM","500","50","30","500","100","300","100"
"2010-10-10 8:09PM","2010-10-11 7:08AM","500","50","30","500","100","300","100"

```

The file is split into the following sections:

### Format indicator

The CSV file always begins with the string `Sleep` followed by a newline character (`0x0a`).  This functions as a [magic number](https://en.wikipedia.org/wiki/Magic_number_(programming)), telling the reader that they are looking at a sleep diary.

### Header

The second line of the CSV file is always `Start Time,End Time,Minutes Asleep,Minutes Awake,Number of Awakenings,Time in Bed,Minutes REM Sleep,Minutes Light Sleep,Minutes Deep Sleep`, followed by a newline character (`0x0a`).  This line indicates column headers.

### Body

Further lines indicate sleeps.  Lines are separated by newline characters (`0x0a`), columns are separated by `,` characters, and columns always begin and end with quotation marks.  Columns have the following meaning:

- `Start Time` and `End Time` - time in the user's local timezone when sleep started and ended
- `Minutes Asleep`, `Minutes Awake` - integer number of minutes spent in each state during the sleep
  - not necessarily accurate, but the sum is guaranteed to be equal to the difference between `Start Time` and `End Time`
- `Time in Bed`, `Minutes REM Sleep`, `Minutes Light Sleep` and `Minutes Deep Sleep` - integer number of minutes spent in each state during the sleep
  - tend not to be reliable in practice
- `Number of Awakenings` - number of times the user awoke during the sleep
  - tends not to be reliable in practice

Fitbit devices seem to automatically accomodate daylight savings time, but we have not yet been able to determine how `Start Time` and `End Time` are affected.  The example code ignores the `Start Time` field altogether, and instead uses the equation `start = End Time - Minutes Awake - Minutes Asleep`.  This ensures all times are calculated with the most recent timezone, whatever that timezone may be.

### Footer

The file always ends with an extra newline character (`0x0a`) after the newline that ends the final line of the body.
