# Standard viewer demo

This page should show the contents of a document.  If you do not see a document, please load one from [the main page](../../).

<a id="diary-standard-link"></a>

## Records

<template class="diary-element" name="records"><div>

<h3>Status</h3>

<dl>

<dt>Status</dt>
<dd class="diary-element" name="status"></dd>

<dt>Start time</dt>
<dd>
<span class="diary-element diary-date" name="start"></span>, timezone: <span class="diary-element" name="start_timezone"></span>
</dd>

<dt>End time</dt>
<dd>
<span class="diary-element diary-date" name="end"></span>, timezone: <span class="diary-element" name="end_timezone"></span>
</dd>

<dt>Duration (not including gaps)</dt>
<dd class="diary-element diary-duration" name="duration"></dd>

</dl>

<h3>Commentary</h3>

<dl>

<dt>Tags</dt>
<dd class="diary-element diary-json" name="tags"></dd>

<dt>Comments</dt>
<dd class="diary-element diary-is-list" name="comments"></dd>

</dl>

<h3>Metadata</h3>

<dl>

<dt>Day number</dt>
<dd class="diary-element diary-is-list" name="day_number"></dd>

<dt>Is this the start of new day?</dt>
<dd class="diary-element diary-is-list" name="start_of_new_day"></dd>

<dt>Is this the primary sleep of the day?</dt>
<dd class="diary-element diary-is-list" name="is_primary_sleep"></dd>

<dt>Does it look like there is a missing record after this one?</dt>
<dd class="diary-element diary-is-list" name="missing_record_after"></dd>

</dl>

<hr>

</div></template>

## Settings

<table>
<tr><th>Minimum day duration</th><td class="diary-element diary-duration" name="minimum_day_duration"></td></tr>
<tr><th>Maximum day duration</th><td class="diary-element diary-duration" name="maximum_day_duration"></td></tr>
</table>

<script src="../../sleep-diary-formats.js"></script>
<script src="../demo.js"></script>
