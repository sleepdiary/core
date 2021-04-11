#!/bin/sh
#
# Build the documentation
#
# Called from .github/workflows/gh-pages

set -e # exit if any of the commands below return non-zero
set -m # enable background jobs

#
# Initialise the build environment
#

npm install -g jsdoc jasmine google-closure-compiler xmldom timezonecomplete exceljs &

git clone --depth 1 https://github.com/wolfcw/libfaketime.git /tmp/libfaketime
make -j -C /tmp/libfaketime/src

fg

#
# Run the build itself
#

git merge --strategy-option=theirs main
make -j -B gh-pages
git add .

#
# Commit/push changes
#

git commit -a -m "Update documentation"
git push
