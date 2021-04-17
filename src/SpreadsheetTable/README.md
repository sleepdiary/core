# Spreadsheet Table format

There is no formal definition for a spreadsheet table, but people often independently create sleep diaries containing a table of values.  This format attempts to parse those tables based on common features.

# In this directory

You may find the following useful:

* [JavaScript example code](format.js)
* [Test cases](test.js)
* [Examples](examples/)

# Creation process

Spreadsheet table are usually created in [Microsoft Excel](https://www.microsoft.com/en-gb/microsoft-365/excel) or [LibreOffice Calc](https://www.libreoffice.org/discover/calc/).  The user puts headings in the first row, then adds a new row each day.

# Export format

The most common raw format for spreadsheets is [Office Open XML](https://en.wikipedia.org/wiki/Office_Open_XML), followed by [OpenDocument](https://en.wikipedia.org/wiki/OpenDocument).  These formats have been published as international standards, and will not be described here.

Spreadsheet tables generally have the following properties:

* the first row contains a set of column names
* one column indicates the time when each record starts
* one column indicates the time when each record ends
* there may be a column that indicates the status associated with each record
* if there is no status column, all records indicate times the user was asleep
* there may be a column that contains comments

## Detecting columns

Here is a process to detect which column contains the start time:

1. if any header cell matches the regular expression `/sleep|start|begin/i`, the first matching column indicates the start time
2. otherwise, the leftmost column that does not match `/wake|stop|end/i` indicates the start time

Here is a process to detect which column contains the end time:

1. if any header cell matches the regular expression `/wake|stop|end/i`, the first matching column indicates the end time
2. otherwise, the leftmost column that does not match `/sleep|start|begin/i` indicates the end time

Here is a process to detect which column contains the status:

1. if any header cell matches the regular expression `/event|activity|stat(e|us)/i`, the first matching column indicates the status
2. otherwise, the status is always `asleep`

Here is a process to detect which columns contains comments:

1. if any header cell matches the regular expression `/comment|note/i`, the all matching columns indicate the comment
2. any columns with blank headers indicate comments

## Parsing statuses

Here is a process to convert status strings to values:

1. values that match `/sleep/i` indicate the user is asleep
2. values that match `/wake/i` indicate the user is awake
3. values that match `/snack/i` indicate the user is eating a snack
4. values that match `/meal|eat/i` but not `/snack/i` indicate the user is eating a meal
5. values that match `/alco/i` indicate the user is drinking an alcoholic drink
6. values that match `/caffeine|coffee|tea|cola/i` indicate the user is drinking a caffeinated drink
7. values that match both `/choc/i` and `/drink/i` indicate the user is drinking a chocolate drink
8. values that match `/drink/i` but none of the above drinks indicate the user is drinking something that is neither alcoholic, caffeniated nor chocolate
9. values that match `/pill|tranq/i` indicate the user is taking a sleeping pill or tranquiliser
10. values that match `/exercise/i` indicate the user is exercising
11. values that match `/toilet|bathroom|loo/i` indicate the user is using the toilet
12. values that match `/noise/i` indicate the user's sleep has been disturbed by noise
13. values that match `/alarm/i` indicate an alarm is occurring
14. values that match `/down|(in|to).*bed/i` indicate the user is going to bed
15. values that match `/up|out.*bed/` indicate the user is getting out of bed
