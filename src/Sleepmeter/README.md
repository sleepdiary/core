Sleepmeter is an Android app, available as either [Sleepmeter Free](https://play.google.com/store/apps/details?id=com.squalllinesoftware.android.applications.sleepmeter.free&hl=en_GB&gl=US) (free download with adverts) or [Sleepmeter](https://play.google.com/store/apps/details?id=com.squalllinesoftware.android.applications.sleepmeter.paid&hl=en_GB&gl=US) (paid download without adverts).  This page was written after testing the free version.

The source code for this program is not publicly available.

We have not been able to find any official documentation about the file format, but here is some documentation for users:

* [home page](http://www.squalllinesoftware.com/?q=node/2)
* [graph help](http://www.squalllinesoftware.com/?q=node/10)

This documentation was written by testing the app's behaviour in practice.  Although not guaranteed, the app has not been modified in many years so this behaviour is unlikely to change in future.

# In this directory

This directory contains some examples you might want to use in your own code:

* [JavaScript example code](format.js)
* [Test cases](test.js)
* [Examples](examples/)

# Export process

While using the app, here is how to export your data:

1. click the three vertical dots in the top-right
2. click ''Manage Database''
3. click ''EXPORT TO CSV ON SD CARD''
4. your file will now be available in the `sleepmeter\history` folder

# Export format

The export format is a UTF-8 encoded CSV file without a byte order mark.  Here is an example:

    wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes
    "2010-11-12 13:14+0000","2010-11-12 15:16+0000","2010-11-12 17:18+0000",,NIGHT_SLEEP,NONE,NONE,NONE,NONE,5,""

And here is a more complex example:

    custom_aid_id,class,name
    CUSTOM_0002,RELAXATION,"custom aid 2"
    CUSTOM_0003,EXERTION,"custom aid 3"
    CUSTOM_0001,HERBAL,"custom aid 1"

    custom_hindrance_id,class,name
    CUSTOM_0003,OBLIGATION,"custom hindrance 3"
    CUSTOM_0002,MENTAL,"custom hindrance 2"
    CUSTOM_0001,NOISE,"custom hindrance 1"

    custom_tag_id,name
    CUSTOM_0001,"custom tag 1"
    CUSTOM_0002,"custom tag 2"

    wake,sleep,bedtime,holes,type,dreams,aid,hindrances,tags,quality,notes
    "2099-12-31 23:57+1000","2099-12-31 23:58+1000","2099-12-31 23:59+1000",,NIGHT_SLEEP,NONE,CUSTOM_0001,CUSTOM_0001,CUSTOM_0001,5,""
    "1900-01-02 00:00+0000","1900-01-01 00:02+0000","1900-01-01 00:01+0000",1-57|1436-1437,NAP,NONE,NONE,NONE,NONE,5,"comment"
    
## Custom values

While using the app, here is how to add a custom value:

1. click the three vertical dots in the top-right
2. click ''Settings''
3. click ''Record Settings''
4. click ''Manage Aids'', ''Manage Hindrances'' or ''Manage Tags''

If the user has defined any custom values of the specified type, the CSV file will contain a section that begins with the header for this type and ends with a blank line.

The individual fields are discussed below.

### `custom_aid_id`, `custom_hindrance_id` and `custom_tag_id`

This is a unique string of the form `CUSTOM_nnnn`.  These fields are guaranteed to be unique within the same custom value type, but are reused between value types.  For example, there `CUSTOM_0001` could be both a `custom_aid_id` and a `custom_tag_id` in the same CSV file.

### `class`

This indicates the general class of issue.

For sleep aids, the class must be one of the following:

* `AIRWAY`
* `BEVERAGE`
* `DRUG`
* `EXERTION`
* `HERBAL`
* `READING`
* `RELAXATION`
* `SENSORY_DEPRIVATION`
* `SOUND`

For sleep hinderances, the class must be one of the following:

* `ENVIRONMENTAL`
* `MENTAL`
* `NOISE`
* `OBLIGATION`
* `PHYSICAL`
* `STIMULANT`

This field is not present for tags.

### `name`

This field contains a UTF-8 string that is always between double quotes, but does not not escape special characters.  See [the discussion of CSV formats](../CSV.md) for information about escaping special characters.  Here are some example values:

    ""
    "name"
    "long name"
    "this is a single field containing one comma (,) one newline (
    ) and one double quote (")"

## Main diary section

If the user has created any sleep diary entries, the CSV file will contain a section that begins with the main diary section header and continues to the end of the document.

The individual fields are discussed below.

### `wake`, `sleep` and `bedtime`

These fields indicate the time the user woke up, the time they went to sleep, and their bedtime.  Each field is stored as quoted strings in the format "yyyy-MM-dd hh:mm+ZZZ".  Here are some example dates:

    "1900-01-01 00:00-1000"
    "2020-11-22 23:00+0000"
    "2099-12-25 23:59+1000"

If the "sleep" and "wake" times are the same, that indicates the user did not get to sleep at all.

### `holes`

This field indicates times and durations when the user woke up mid-sleep.  This field is a series of pipe-separated pairs of dash-separated integers.  Here are some examples:

    1-2
    1-59|1436-1437

Each pair of numbers (e.g. `1-2`) indicates when the user woke up and went back to sleep, in minutes after the initial sleep time.  So for example, if the user fell asleep at `"2001-01-01 01:00+0000"` and had a `holes` field of `60-120|180-240`, that would mean they woke up at 2am, fell back to sleep at 3am, woke up again at 4am, then fell asleep again at 5am.

### `type`

This field indicates the type of sleep.  There are only two possible values:

    NIGHT_SLEEP
    NAP
    
### `dreams`

This field indicates a list of dreams the user had.  This is a structured field with primary and secondary sub-fields.  Here are some examples:

    NONE
    UNKNOWN:0:CHASE
    NIGHTMARE:-5
    GOOD:5:FLYING:LUCID
    UNKNOWN:0:CHASE|NIGHTMARE:-5|GOOD:5:FLYING:LUCID

If no dreams were recorded, the field is marked `NONE`.  Otherwise, the field contains a list of pipe-separated primary sub-fields, one sub-field per dream.

Each primary sub-field is a colon-separated list of secondary sub-fields.

The first secondary sub-field indicates the type of dream, chosen from the following list:

* `UNKNOWN`
* `GOOD`
* `EROTIC`
* `NEUTRAL`
* `STRANGE`
* `CREEPY`
* `TROUBLING`
* `NIGHTMARE`

The second secondary sub-field indicates the mood of the dream.  It is an integer in the range `-5` to `5` (inclusive).

The remaining secondary sub-fields indicate the theme(s) of the dream, chosen from the following list:

* `CHASE`
* `COMPENSATORY`
* `DAILY_LIFE`
* `DEATH`
* `EPIC`
* `FALLING`
* `FALSE_AWAKENING`
* `FLYING`
* `LUCID`
* `MURDER`
* `MUTUAL`
* `NAKED_IN_PUBLIC`
* `ORGASMIC`
* `PHYSIOLOGICAL`
* `PRECOGNITIVE`
* `PROGRESSIVE`
* `RECURRING`
* `RELIGIOUS`
* `SIGNAL`
* `TEETH`
* `TEST`
* `MONEY`

The SleepMeter app always lists these in the order specified above, which is mostly but not entirely alphabetical.  Your program should always generate values in this order, but should not assume other programs will do the same.

### `aid`

This is a list of things that aided the user's sleep.  This is either the string `NONE` or a list of pipe-separated values.  Here are some examples:

    NONE
    ALCOHOL
    ST_JOHNS_WORT|TV
    MILK|CUSTOM_0002|CUSTOM_0003|CUSTOM_0001

The values are either a `CUSTOM_nnnn` value from the list of custom aids, or chosen from this list:

* `ALCOHOL`
* `AMBIEN`
* `AMBIEN_CR`
* `AROMATHERAPY`
* `BENADRYL`
* `CHAMOMILE`
* `CIRCADIN`
* `CPAP`
* `DOZILE`
* `EAR_PLUGS`
* `EXERCISE`
* `GABA`
* `IMOVANE`
* `LUNESTA`
* `MAGNESIUM`
* `MARIJUANA`
* `MEDITATION`
* `MELATONIN`
* `MILK`
* `MUSIC`
* `NYQUIL`
* `READING`
* `RESTAVIT`
* `ROZEREM`
* `SEX`
* `SOUND_MACHINE`
* `ST_JOHNS_WORT`
* `TV`
* `TYLENOL`
* `TYLENOL_PM`
* `UNISOM`
* `UNISOM2`
* `VALERIAN`
* `ZIMOVANE`

The SleepMeter app always lists built-in values in the (alphabetical) order specified above.  Custom values are inserted in case-insensitive alphabetical order by the value's name.  For example, if `CUSTOM_0001` was named `cloverleaf`, it would be inserted between `CIRCADIAN` and `CPAP`.  Your program should always generate values in this order, but should not assume other programs will do the same.


### `hindrance`

This is a list of things that hindered the user's sleep.  This is either the string `NONE` or a list of pipe-separated values.  Here are some examples:

    NONE
    ALARM_CLOCK
    LOUD_NEIGHBOR|MIND_RACING
    SQUIRRELS_ON_ROOF|CUSTOM_0002|CUSTOM_0003|CUSTOM_0001

The values are either a `CUSTOM_nnnn` value from the list of custom hindrances, or chosen from this list:

* `ALARM_CLOCK`
* `ANGER`
* `ANXIETY`
* `ARGUMENT`
* `BABY_CRYING`
* `BATHROOM_BREAK`
* `TOO_BRIGHT`
* `BUNKMATE_SNORING`
* `CAFFEINE`
* `TOO_COLD`
* `DOG_BARKING`
* `FIRE_ANTS`
* `HEARTBURN`
* `TOO_HOT`
* `HUNGER`
* `LOUD_NEIGHBOR`
* `MIND_RACING`
* `PAIN`
* `PHONE_RANG`
* `RESTLESS_LEGS`
* `SCARY_MOVIE`
* `SICK`
* `SQUIRRELS_ON_ROOF`
* `STORM`
* `STRESS`
* `SUGAR`
* `VIDEO_GAME`
* `WIND`

The SleepMeter app always lists built-in values in the (non-alphabetical) order specified above.  Custom values do not appear to be inserted in any particular order.  Your program should always generate values in this order, but should not assume other programs will do the same.

### `tags`

This is a list of tags describing the user's sleep.  This is either the string `NONE` or a list of pipe-separated values.  Here are some examples:

    NONE
    ALONE
    SCHOOL_NIGHT|SLEEP_TALKING
    GOING_FISHING|CUSTOM_0002|CUSTOM_0003|CUSTOM_0001

The values are either a `CUSTOM_nnnn` value from the list of custom tags, or chosen from this list:

* `ALONE`
* `BUNKMATE`
* `CAMPING`
* `COUCH`
* `GOING_FISHING`
* `HOTEL`
* `OUT_OF_TOWN`
* `PASSED_OUT_DRUNK`
* `SCHOOL_NIGHT`
* `SLEEP_TALKING`
* `SLEEP_WALKING`
* `SLEPT_AT_FRIENDS_PLACE`
* `SLEPT_IN_CAR`
* `WORK_NIGHT`

The SleepMeter app always lists built-in values in the (alphabetical) order specified above.  Custom values are inserted in case-insensitive alphabetical order by the value's name.  For example, if `CUSTOM_0001` was named `cloverleaf`, it would be inserted between `CAMPING` and `COUCH`.  Your program should always generate values in this order, but should not assume other programs will do the same.

### `quality`

This indicates the quality of sleep.  It is an integer in the range `0` to `10` (inclusive).

### `notes`

This is the user's free-text description of the sleep.  This field contains a UTF-8 string that is always between double quotes, but does not not escape special characters.  See [the discussion of CSV formats](../CSV.md) for information about escaping special characters.  Here are some example values:


    ""
    "note"
    "long note"
    "this is a single field containing one comma (,) one newline (
    ) and one double quote (")"
