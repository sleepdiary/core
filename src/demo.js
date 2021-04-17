/*
 * Diary viewer demo
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

var diary_loader = new DiaryLoader(
    (diary,source) => {

        var DEBUG = 0;

        console.log(
            "Loaded diary from " + source + ":",
            diary
        );

        document.getElementById("diary-standard-link").setAttribute(
            "href",
            "../Standard/demo.html#" + diary.to("Standard").to("url")
        );

        function set_element( elem, value, member_map ) {

            var child_member_map = (value||{})["member_map"] || member_map;

            if ( !elem ) {
                if ( DEBUG>1 ) console.warn( "Not setting element - no associated element", value );
                return;
            }

            if ( elem.className.search(/\bdiary-json\b/) != -1 ) {

                if ( DEBUG>2 ) console.log( "Setting JSON element", elem, value );
                elem.textContent = JSON.stringify(value,null,' ');

            } else if ( Array.isArray(value) ) {

                if ( DEBUG>2 ) console.log( "Setting array element", elem, value );
                if ( elem.className.search(/\bdiary-is-list\b/) != -1 ) {
                    elem.textContent = value.join(', ');
                } else {
                    value.forEach( v => {
                        var item_elem = elem.content.cloneNode(true).firstElementChild;
                        set_element( item_elem, v, child_member_map );
                        elem.parentNode.insertBefore( item_elem, elem );
                    });
                }

            } else if ( value === null ) {

                if ( DEBUG>2 ) console.log( "Setting null element", elem, value );
                elem.textContent = "(null)";

            } else if ( typeof(value) == "object" ) {

                if ( elem.className.search(/\bdiary-is-list\b/) != -1 ) {

                    if ( DEBUG>2 ) console.log( "Setting object list", elem, value );

                    var item_template = elem.querySelector("template.diary-list");
                    if ( item_template ) {
                        Object.keys(value).forEach( key => {
                            var item_elem = item_template.content.cloneNode(true).firstElementChild;
                            item_elem.querySelector(".diary-key").textContent = key;
                            set_element( item_elem.querySelector(".diary-value"), value[key], child_member_map );
                            item_template.parentNode.insertBefore( item_elem, item_template );
                        });
                    }

                } else {

                    if ( DEBUG>2 ) console.log( "Setting object element", elem, value );

                    var inverse_member_map = {};
                    Object.keys(member_map||{}).forEach( key => inverse_member_map[member_map[key][0]] = key );

                    Object.keys(value).forEach(
                        key => {
                            var element = elem.querySelector(
                                ".diary-element[name='" + ( inverse_member_map.hasOwnProperty(key) ? inverse_member_map[key] : key ) + "']"
                            );
                            if ( element ) {
                                if ( DEBUG>2 ) console.log( "Setting key", element, key, value[key] );
                                set_element( element, value[key], child_member_map );
                            } else {
                                if ( DEBUG>2 ) console.log( "Not setting key - no element", key, value[key] );
                            }
                        }
                    );

                }

            } else if ( elem.className.search(/\bdiary-date\b/) != -1 ) {

                if ( DEBUG>2 ) console.log( "Setting date element", elem, value );
                elem.textContent = new Date(value);

            } else if ( elem.className.search(/\bdiary-duration\b/) != -1 ) {

                if ( DEBUG>2 ) console.log( "Setting duration element", elem, value );
                let seconds = (value/1000)%60;
                elem.textContent = (
                    Math.floor(value/60000)
                        + ':'
                        + ( ( seconds < 10 ) ? '0' : '' )
                        + seconds
                        + ' minutes'
                );

            } else {

                if ( DEBUG>2 ) console.log( "Setting text element", elem, value );
                elem.textContent = value;

            }

        }

        set_element( document.body, diary );

    }
);
