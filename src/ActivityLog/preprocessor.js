// load the JavaScript part of sqlite.js:
if ( !self["initSqlJs"] ) {
    let script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/sql-wasm.min.js";
    document.head.appendChild(script);
}

/**
 * @param {Blob|File} file - file to load
 * Add the contents of the file to the list of imported records
 */
function preprocess_activity_log(file) {
    return preprocess_activity_log.load_sql.then(
        SQL => new Promise( (resolve,reject) => {
            let file_reader = new FileReader(),
                activities = [],
                add_activity = time => activities.push({
                    "ActivityStart": time,
                    "ActivityEnd"  : time,
                })
            ;

            file_reader.onload = () => {

                let db = new SQL.Database(new Uint8Array(file_reader.result));


                /*
                 * Browser history
                 * Browsers generally manage their history with SQLite
                 * Run queries to extract visit times...
                 */

                if (
                    [
                        "SELECT visit_time/1000-11644473600000 FROM visits", // Chrome
                        "SELECT visit_date/1000 FROM moz_historyvisits", // Firefox
                        "SELECT (visit_time+978307200)*1000 FROM history_visits", // Safari
                    ].some( query => {
                        try {
                            let st = db.prepare(query);
                            while ( st.step() ) add_activity(st.get()[0]);
                            return true;
                        } catch (e) {
                            return false;
                        }
                    })
                ) {
                    return resolve(activities);
                }


                /*
                 * iCalendar
                 * iCalendar is a simple text format
                 */

                // check if this looks like an iCalendar file, without stringifying:
                const ical_header = "BEGIN:VCALENDAR\n";
                if (
                    new Uint8Array(file_reader.result,0,ical_header.length)
                        .some( (c,n) => ical_header.charCodeAt(n) != c )
                ) {
                    return reject("File not recognised");
                }

                file_reader.onload = () => {
                    file_reader.result
                        .replace(
                            /\nDT(START|END):([^\r\n]*)/g,
                            (_,se,date) => {
                                if ( se == "end" && activities.length ) {
                                    activities[activities.length-1]["ActivityEnd"] = date;
                                } else {
                                    add_activity(date);
                                }
                            })
                    ;
                    return resolve(activities);
                }
                file_reader.readAsText(file);

            }

            file_reader.readAsArrayBuffer(file);

        }));

}

// load the WebAssembly part of sqlite.js:
preprocess_activity_log.load_sql = new Promise( (resolve,reject) => {
    let interval = setInterval(() => {
        if ( self.hasOwnProperty("initSqlJs") ) {
            clearInterval(interval);
            initSqlJs(
                { locateFile: filename => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/'+filename }
            ).then(resolve,reject);
        }
    }, 500 );
})
