Steps for creating a new format:

1. research the format
  * search online for documentation
  * figure out how to import and export data
  * get some copies of the exported file format
2. reverse-engineer the format
  * https://www.samba.org/ftp/tridge/misc/french_cafe.txt
    (our formats are usually nowhere near complicated enough to need all this)
  * if your format uses CSV and contains free-text strings, see ../CSV.md
3. document the format
4. write the code and tests
  * in practice, this will usually turn up things we missed in the documentation
  * to rebuild quickly during development without running everything: docker run --rm -v "$PWD":/sleep-diary-formats sleep-diary-formats make

Checklist before creating a pull request for your format:

* write ./README.md, ./format.js, ./tests.js and ./demo.html
* mention the file in /Makefile, /index.js, /README.md and /doc/README.md
* run /bin/release-checks.sh
