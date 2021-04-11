# Example viewer demo

This page should show the contents of a document.  If you do not see a document, please load one from [the main page](../../).

You can also see <a id="diary-standard-link">this document in standard format</a>.

## Records

TODO: define nested templates describing your file format.  This will be filled in by ../demo.js

Here is a template that defines the top-level "records" member of your diary:

<template class="diary-element" name="records"><div>

<h3>Times</h3>

Elements with a "diary-element" class are normally treated as members of the current object.  Elements that also have "diary-date" are converted from Unix timestamps to date strings:

<dl>
<dt>Start time</dt>
<dd class="diary-element diary-date" name="start"></dd>
<dt>End time</dt>
<dd class="diary-element diary-date" name="end"></dd>
</dl>

<h3>Nested element</h3>

You can nest "diary-element"s to describe objects:

<template class="diary-element" name="my-object">
<span class="diary-element" name="first-value-in-object"></span>
<span class="diary-element" name="second-value-in-object"></span>
</template>

<h3>Arrays</h3>

A "diary-element" object for an array will be cloned once for each value in the array:

<ul>
<template class="diary-element" name="my-array">
<li></li>
</template>
</ul>

We normally add a horizontal rule at the bottom for readability:

<hr>

</div></template>

## TODO: add other top-level members here

<script src="../../sleep-diary-formats.js"></script>
<script src="../demo.js"></script>
