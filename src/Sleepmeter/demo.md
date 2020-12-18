# Sleepmeter viewer demo

This page should show the contents of a document.  If you do not see a document, please load one from [the main page](../../).

You can also see <a id="diary-standard-link">this document in standard format</a>.

## Records

<template class="diary-element" name="records"><div>

### Timing

<dl>
<dt>Bedtime</dt>
<dd>
<span class="diary-element" name="bedtime"><span class="diary-element" name="string"></span>
-
<span class="diary-element diary-date" name="start"></span>
</dd>
<dt>Sleep time</dt>
<dd>
<span class="diary-element" name="sleep"><span class="diary-element" name="string"></span>
</dd>
<dt>Wake time</dt>
<dd>
<span class="diary-element" name="wake"><span class="diary-element" name="string"></span>
-
<span class="diary-element diary-date" name="end"></span>
</dd>
<dt>Holes</dt>

<template class="diary-element" name="holes">
<dd>
minutes
<span class="diary-element" name="wake"></span>
-
<span class="diary-element" name="sleep"></span>
</dd>
</template>

<dt>Type</dt>
<dd class="diary-element" name="type"></dd>
</dl>

### Dreams
<table>
<thead>
<tr>
<th>Type</th>
<th>Mood</th>
<th>Themes</th>
</tr>
</thead>
<tbody>
<template class="diary-element" name="dreams">
<tr>
<td class="diary-element" name="type"></td>
<td class="diary-element" name="mood"></td>
<td class="diary-element diary-is-list" name="themes">
</tr>
</template>
</tbody>
</table>

### Description
<dl>
<dt>Aids</dt>
<dd class="aids"></dd>
<dt>Hindrances</dt>
<dd class="hindrances"></dd>
<dt>Tags</dt>
<dd class="tags"></dd>
<dt>Quality</dt>
<dd class="quality"></dd>
<dt>Notes</dt>
<dd class="notes"></dd>
</dl>

<hr>

</div>
</template>

## Custom Aids

<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Class</th>
      <th>Name</th>
    </tr>
  </thead>
  <tbody>
    <template class="diary-element" name="custom_aids">
      <tr>
        <td class="diary-element" name="custom_aid_id"></td>
        <td class="diary-element" name="class"></td>
        <td class="diary-element" name="name"></td>
      </tr>
    </template>
  </tbody>
</table>

## Custom Hindrances

<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Class</th>
      <th>Name</th>
    </tr>
  </thead>
  <tbody>
    <template class="diary-element" name="custom_hindrances">
      <tr>
        <td class="diary-element" name="custom_hindrance_id"></td>
        <td class="diary-element" name="class"></td>
        <td class="diary-element" name="name"></td>
      </tr>
    </template>
  </tbody>
</table>

## Custom Tags

<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Name</th>
    </tr>
  </thead>
  <tbody>
    <template class="diary-element" name="custom_tags">
      <tr>
        <td class="diary-element" name="custom_tag_id"></td>
        <td class="diary-element" name="name"></td>
      </tr>
    </template>
  </tbody>
</table>

<script src="../../sleep-diary-formats.js"></script>
<script src="../demo.js"></script>
