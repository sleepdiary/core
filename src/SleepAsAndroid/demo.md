# Sleep as Android viewer demo

This page should show the contents of a document.  If you do not see a document, please load one from [the main page](../../).

You can also see <a id="diary-standard-link">this document in standard format</a>.

## Records

<template class="diary-element" name="records"><div>

<h3>Timing</h3>
<dl>
<dt>ID</dt>
<dd class="diary-element" name="Id"></dd>
<dt>Timezone</dt>
<dd class="diary-element" name="Tz"></dd>
<dt>Sleep time</dt>
<dd>
<span class="diary-element" name="From"><span class="diary-element" name="string"></span></span>
-
<span class="diary-element diary-date" name="start"></span>
</dd>
<dt>Wake time</dt>
<dd>
<span class="diary-element" name="To"><span class="diary-element" name="string"></span></span>
-
<span class="diary-element diary-date" name="end"></span>
</dd>
<dt>Next scheduled sleep tracking terminating alarm</dt>
<dd>
<span class="diary-element" name="Sched"><span class="diary-element" name="string"></span></span>
-
<span class="diary-element diary-date" name="alarm"></span>
</dd>
<dt>Hours between sleep and wake times</dt>
<dd class="diary-element" name="Hours"></dd>
</dl>

<h3>Description</h3>
<dl>
<dt>Rating</dt>
<dd class="diary-element" name="Rating"></dd>
<dt>Comments</dt>
<dd class="diary-element" name="Comment-without"></dd>
<dt>Tags</dt>
<dd class="diary-element" name="Comment-tags"></dd>
<dt>Number of seconds where snoring was detected</dt>
<dd class="diary-element" name="Snore"></dd>
<dt>Average noise level during the night</dt>
<dd class="diary-element" name="Noise"></dd>
<dt>Total sleep cycles</dt>
<dd class="diary-element" name="Cycles"></dd>
<dt>Percentage of time spent in deep sleep</dt>
<dd class="diary-element" name="DeepSleep"></dd>
</dl>

<h3>Other</h3>
<dl>
<dt>Amount of time spent awake</dt>
<dd class="diary-element" name="LenAdjust"></dd>
<dt>Geolocation</dt>
<dd class="diary-element" name="Geo"></dd>
</dl>

<div style="float:left;margin-right:1em">
<h4 style="text-align:center">Measurements</h4>
<table>
<thead>
<tr>
<th>Time</th>
<th>Activity</th>
<th>Noise</th>
</tr>
</thead>
<tbody>
<template class="diary-element" name="times">
<tr>
<td><span class="diary-element" name="hours"></span>:<span class="diary-element" name="minutes"></span></td>
<td class="diary-element" name="actigraphy"></td>
<td class="diary-element" name="noise"></td>
</tr>
</template>
</tbody>
</table>
</div>

<div style="float:left">
<h4 style="text-align:center">Events</h4>
<table>
<thead>
<tr>
<th>Time</th>
<th>Label</th>
<th>Value</th>
</tr>
</thead>
<tbody>
<template class="diary-element" name="events">
<tr>
<td class="diary-element" name="timestamp"></td>
<td class="diary-element" name="label"></td>
<td class="diary-element" name="value"></td>
</tr>
</template>
</tbody>
</table>
</div>

<hr style="clear:both">

</div></template>

## Preferences

<table class="diary-element diary-is-list" name="prefs">
<thead>
<tr>
<th>Key</th>
<th>Value</th>
</tr>
</thead>
<tbody>
<template class="diary-list">
<tr>
<td class="diary-key"></td>
<td class="diary-value"></td>
</tr>
</template>
</tbody>
</table>

<hr>

## Alarms

<pre class="diary-element diary-json" name="alarms"></pre>

<script src="../../sleep-diary-formats.js"></script>
<script src="../demo.js"></script>
