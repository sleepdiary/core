(function(){/*
 Copyright 2020 Andrew Sayers <andrew-github.com@pileofstuff.org>

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use, copy,
 modify, merge, publish, distribute, sublicense, and/or sell copies
 of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
*/
function k(a){var c=0;return function(){return c<a.length?{done:!1,value:a[c++]}:{done:!0}}}var l="function"==typeof Object.defineProperties?Object.defineProperty:function(a,c,d){if(a==Array.prototype||a==Object.prototype)return a;a[c]=d.value;return a};
function n(a){a=["object"==typeof globalThis&&globalThis,a,"object"==typeof window&&window,"object"==typeof self&&self,"object"==typeof global&&global];for(var c=0;c<a.length;++c){var d=a[c];if(d&&d.Math==Math)return d}throw Error("Cannot find global object");}var p=n(this);function q(a,c){if(c)a:{for(var d=p,e=a.split("."),b=0;b<e.length-1;b++){var f=e[b];if(!(f in d))break a;d=d[f]}e=e[e.length-1];b=d[e];f=c(b);f!=b&&null!=f&&l(d,e,{configurable:!0,writable:!0,value:f})}}
q("Symbol",function(a){function c(b){if(this instanceof c)throw new TypeError("Symbol is not a constructor");return new d("jscomp_symbol_"+(b||"")+"_"+e++,b)}function d(b,f){this.g=b;l(this,"description",{configurable:!0,writable:!0,value:f})}if(a)return a;d.prototype.toString=function(){return this.g};var e=0;return c});
q("Symbol.iterator",function(a){if(a)return a;a=Symbol("Symbol.iterator");for(var c="Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array".split(" "),d=0;d<c.length;d++){var e=p[c[d]];"function"===typeof e&&"function"!=typeof e.prototype[a]&&l(e.prototype,a,{configurable:!0,writable:!0,value:function(){return r(k(this))}})}return a});function r(a){a={next:a};a[Symbol.iterator]=function(){return this};return a}
function v(a,c){a instanceof String&&(a+="");var d=0,e=!1,b={next:function(){if(!e&&d<a.length){var f=d++;return{value:c(f,a[f]),done:!1}}e=!0;return{done:!0,value:void 0}}};b[Symbol.iterator]=function(){return b};return b}q("Array.prototype.keys",function(a){return a?a:function(){return v(this,function(c){return c})}});
var w="function"==typeof Object.assign?Object.assign:function(a,c){for(var d=1;d<arguments.length;d++){var e=arguments[d];if(e)for(var b in e)Object.prototype.hasOwnProperty.call(e,b)&&(a[b]=e[b])}return a};q("Object.assign",function(a){return a||w});
q("Array.from",function(a){return a?a:function(c,d,e){d=null!=d?d:function(h){return h};var b=[],f="undefined"!=typeof Symbol&&Symbol.iterator&&c[Symbol.iterator];if("function"==typeof f){c=f.call(c);for(var g=0;!(f=c.next()).done;)b.push(d.call(e,f.value,g++))}else for(f=c.length,g=0;g<f;g++)b.push(d.call(e,c[g],g));return b}});var x=[];function y(a,c){var d=Error("This does not appear to be a sleep diary"),e=a.file_format;"string"==typeof a?a={file_format:function(){return"string"},contents:a}:e&&(a=Object.assign({},a),e&&"string"==typeof e?a.file_format=function(){return e}:e=e(),"url"==e&&(a.contents=JSON.parse(decodeURIComponent(a.contents.substr(12)))));for(var b=0;b!=x.length;++b)try{return new x[b].constructor(a,c)}catch(f){f&&(d=f)}throw d;}
function z(a,c){this.success_callback=a||function(){};this.error_callback=c||function(){};var d=this;var e=setInterval(function(){window.tc&&(window.addEventListener("hashchange",function(){return location.hash.replace(/(^|[?&])(sleep-diary=[^&]*)/g,function(b,f){return d.load({file_format:"url",contents:f},"hashchange")})},!1),location.hash.replace(/(^#|[?&])(sleep-diary=[^&]*)/g,function(b,f,g){return d.load({file_format:"url",contents:g},"hash")}),clearInterval(e))},100);try{[[window.JSZip,"https://cdn.jsdelivr.net/npm/jszip-sync@3.2.1-sync/dist/jszip.min.js"],
[window.tc,"https://cdn.jsdelivr.net/npm/tzdata@1.0.22/tzdata.js","https://cdn.jsdelivr.net/npm/timezonecomplete@5.11.2/dist/timezonecomplete.min.js"]].forEach(function(b){b[0]||b.slice(1).forEach(function(f){var g=document.createElement("script");g.src=f;document.head.appendChild(g)})})}catch(b){}}
z.prototype.load=function(a,c){var d=this;c||(c=a);a.target&&a.target.files&&(a=a.target.files);if(a.length)Array.from(a).forEach(function(b){var f=new FileReader,g=new window.JSZip;f.onload=function(){g.loadAsync(f.result).then(function(h){function t(){m.length?h.file(m[0]).async("string").then(function(A){u[m[0]]=A;m.shift();t()}):d.load({file_format:"archive",contents:u},c)}var u={},m=Object.keys(h.files);t()},function(){f.onload=function(){return d.load({file_format:"string",contents:f.result},
c)};f.readAsText(b)})};f.readAsBinaryString(b)});else{try{var e=window.new_sleep_diary(a,function(b){switch(b.file_format()){case "string":return btoa(b.contents);case "archive":var f=new window.JSZip;return f.sync(function(){Object.keys(b.contents).forEach(function(h){return f.file(h,b.contents[h])});var g;f.generateAsync({type:"base64",compression:"DEFLATE"}).then(function(h){return g=h});return g});default:throw Error("Unsupported output format: "+b.file_format());}})}catch(b){throw this.error_callback(a,
c),b;}e?this.success_callback(e,c):this.error_callback(a,c)}};"undefined"!==typeof module&&module.exports?module.exports={new_sleep_diary:y,sleep_diary_formats:x,DiaryLoader:z}:(window.new_sleep_diary=y,window.sleep_diary_formats=x,window.DiaryLoader=z);}).call(this);
//# sourceMappingURL=sleep-diary-formats.js.map
