# How to implement a new engine

This document explains the general process of implementing a new engine for a sleep diary format.  It is split out into distinct stages for purposes of explanation, but in practice you will spend a lot of time going back and forth between stages.

## Research the format

The first step in implementing an engine is to find out what's already known about the format it will process.

Make sure to search thoroughly online, both for official documentation and unofficial guides.  You might not find a technical description of the format, but you will usually be able to find out e.g. non-obvious features you'll need to support.

Also go through the official program(s) that support the format, digging through every menu and clicking every button.  It's particularly important to find:

* how to load and save files
* how to import/export data from/to other formats
* how to create records
* how to display the list of records
  * create at least one record before looking for this, as your app might not do anything useful when there are no records

Finally, you should use any available programs to get information about your file format.  In particular:
* open files in a text editor, to see if it looks like text
* check the sizes of different files (an empty file, a file with one record, two and so on)
* use the Linux [file](https://linux.die.net/man/1/file) program to see if it's a known file type

## Reverse-engineer the format

Unless you found a lot of technical information, you will probably need to work some things out experimentally.  One excellent (but very detailed) discussion of reverse engineering comes from [the authors of Samba](https://www.samba.org/ftp/tridge/misc/french_cafe.txt), but you will need to come up with a solution that works for you.

Formats generally resemble the era they were created.  A format from the 90's will probably contain arrays of binary data with a fixed number of bytes per record; formats from the 2000's will probably XML (possibly in a zip file); and a format from the 2010's will probably use JSON.  If you couldn't uncover this during the research stage, you will need to work it out now.

Many formats of all eras use [CSV](https://en.wikipedia.org/wiki/Comma-separated_values).  See [CSV.md](../CSV.md) for more information about problems with CSV formats.

## Document the format

People who maintain your work will need to understand your format.  See the other README files in this project for examples of what you'll need to write up.  In particular, make sure to include:

* links to any resources you found during your research
* step-by-step guides for how to access non-obvious features in the official software
* documentation for anything about the format that you couldn't find documented elsewhere

## Write code and tests

You will eventually need to write your code and unit tests in JavaScript, although you might prefer to write an initial implementation in some other language.  For example, a binary format might be easier to prototype in C, or you might be more comfortable trying things out in Python.

[engine.js](engine.js) and [test.js](test.js) in this directory show what your code should eventually look like.  Make sure to add unit tests for all the edge cases you found in previous stages.

See [the main README file](../../README.md) for instructions on building the repository.

## Final checklist

Before creating a pull request for your format, make sure to:

* write `./README.md`
* write `./engine.js`
* write `./tests.js`
* mention the file in `/Makefile`
* mention the file in `/README.md`
* mention the file in `/doc/README.md`
* fix any issues when rebuilding the code
