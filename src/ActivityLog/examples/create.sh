#!/bin/sh

# Recreate files in this directory

# Firefox:
sqlite3 places.sqlite "
CREATE TABLE moz_historyvisits ( visit_date INTEGER );
INSERT INTO moz_historyvisits ( visit_date ) VALUES ( 12345678 ), ( 23456789 );
"

# Chrome:
sqlite3 History "
CREATE TABLE visits ( visit_time INTEGER );
INSERT INTO visits ( visit_time ) VALUES ( 12345678 ), ( 23456789 );
"

# Safari:
sqlite3 History.db "
CREATE TABLE history_visits ( visit_time INTEGER );
INSERT INTO history_visits ( visit_time ) VALUES ( 12345678 ), ( 23456789 );
"

# from https://icalendar.org/iCalendar-RFC-5545/4-icalendar-object-examples.html
cat > calendar.ical <<EOF
BEGIN:VCALENDAR
PRODID:-//xyz Corp//NONSGML PDA Calendar Version 1.0//EN
VERSION:2.0
BEGIN:VEVENT
DTSTAMP:19960704T120000Z
UID:uid1@example.com
ORGANIZER:mailto:jsmith@example.com
DTSTART:19960918T143000Z
DTEND:19960920T220000Z
STATUS:CONFIRMED
CATEGORIES:CONFERENCE
SUMMARY:Networld+Interop Conference
DESCRIPTION:Networld+Interop Conference
  and Exhibit\nAtlanta World Congress Center\n
 Atlanta\, Georgia
END:VEVENT
END:VCALENDAR
EOF
