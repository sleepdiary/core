/*
 * Web-based document reader
 *
 * This file contains functionality specific to the current site.
 *
 * For example code, see the reader.js files in this directory and its
 * subdirectories.
 *
 * Copyright 2020 Andrew Sayers <andrew-github.com@pileofstuff.org>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

function to_duration(value) {
    var hours = Math.floor( value / (60*60*1000) ),
        minutes = Math.floor( value / (60*1000) ) % 60
    ;
    return (
        hours +
        ( minutes < 10 ? ':0' : ':' ) +
        minutes
    );
}

var diary_loader = new DiaryLoader(
    (diary,source) => {

        var standardised = diary.to("Standard"),
            cutoff = new Date().getTime() - 1000*60*60*24*30,
            summary_all           = standardised.summarise_days(),
            summary_recent        = standardised.summarise_days( function(record) { return record.start > cutoff; }),
            summary_asleep        = standardised.summarise_records( function(record) { return record.status == "asleep"; }),
            summary_recent_asleep = standardised.summarise_records( function(record) { return record.start > cutoff && record.status == "asleep"; }),

            schedule_all          = standardised.summarise_schedule(),
            schedule_recent       = standardised.summarise_schedule( function(record) { return record.start > cutoff; }),
            diary_output = '<table><tbody>'
        ;

        if ( summary_all ) {

            if ( schedule_all.wake ) {
                diary_output += '<tr><th>Long-term average wake time</th><td>' + to_duration(schedule_all.wake.average) + ' GMT ± ' + to_duration(schedule_all.wake.standard_deviation) + '</td></tr>';
            }
            if ( schedule_recent.wake ) {
                diary_output += '<tr><th>Recent average wake time</th><td>' + to_duration(schedule_recent.wake.average) + ' GMT ± ' + to_duration(schedule_recent.wake.standard_deviation) + '</td></tr>';
            }

            if ( schedule_all.sleep ) {
                diary_output += '<tr><th>Long-term average bedtime</th><td>' + to_duration(schedule_all.sleep.average) + ' GMT ± ' + to_duration(schedule_all.sleep.standard_deviation) + '</td></tr>';
            }
            if ( schedule_recent.sleep ) {
                diary_output += '<tr><th>Recent average bedtime</th><td>' + to_duration(schedule_recent.sleep.average) + ' GMT ± ' + to_duration(schedule_recent.sleep.standard_deviation) + '</td></tr>';
            }

            if ( summary_asleep ) {
                diary_output += '<tr><th>Long-term average sleep duration</th><td>' + to_duration(summary_asleep.average) + '</td></tr>';
            }
            if ( summary_recent_asleep ) {
                diary_output += '<tr><th>Recent average sleep duration</th><td>' + to_duration(summary_recent_asleep.average) + '</td></tr>';
            }

            diary_output += '<tr><th>Long-term average day length</th><td>' + to_duration(summary_all.average) + '</td></tr>';
            if ( summary_recent ) {
                diary_output += '<tr><th>Recent average day length</th><td>' + to_duration(summary_recent.average) + '</td></tr>';
            }

        } else {

            diary_output += '<tr><th colspan="2"this diary seems to be empty - please add some records</th></tr>';

        }

        switch ( diary.file_format() ) {
        case "SleepAsAndroid":
        case "Sleepmeter":
        case "PleesTracker":
        case "SpreadsheetTable":
        case "SpreadsheetGraph":
        case "SleepChart1":
            diary_output += '<tr><th>Overview</th><td><a href="src/' + diary.file_format() + '/demo.html#' + diary.to("url") + '">view</a></td></tr>';
            break;
        default:
            diary_output += '<tr><th>Overview</th><td><a href="src/Standard/demo.html#' + diary.to("Standard").to("url") + '">view</a></td></tr>';
        }

        diary_output += (
            '<tr><th>Spreadsheet</th><td><a id="spreadsheet" href="#spreadsheet">download</a></td></tr>' +
            '<tr>' +
              '<th>Convert</th>' +
              '<td><select id="convert-format">' +
                '<option>Choose a format...</option>' +
                sleep_diary_formats.map(function(format) {
                    return '<option value="' + format.name + '">' + format.title + '</option>';
                }).join('') +
              '</select></td>' +
            '</tr>'
        );

        document.getElementById('diary-output').innerHTML = diary_output + "</tbody></table>";

        document.getElementById('convert-format').addEventListener( 'change', function(event) {
            if ( event.target.value ) {
                diary.to_async(event.target.value).then(function(diary) {
                    diary.to_async("output").then(function(output) {
                        var a = document.createElement('a');
                        a.setAttribute( 'href', DiaryLoader.to_url(output) );
                        a.setAttribute('download', "diary" + diary.format_info().extension);
                        a.click();
                    })
                });
            }
        }, false);

        document.getElementById('spreadsheet').addEventListener( 'click', function(event) {
            diary.to_async("spreadsheet").then(
                spreadsheet => {
                    var a = document.createElement('a');
                    a.setAttribute(
                        'href',
                        URL.createObjectURL(
                            new Blob([spreadsheet])
                        )
                    );
                    a.setAttribute('download', "diary.xlsx");
                    a.click();
                })
        });

    },
    (raw,source) => {
        document.getElementById('diary-output').innerHTML = "<strong>Sorry, we can't read diaries in this format.<br>Please try another file.</strong>";
    }
);

document.getElementById("diary-input")
    .addEventListener( "change", event => diary_loader.load(event) );
