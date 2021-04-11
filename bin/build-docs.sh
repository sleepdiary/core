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

npm install -g jsdoc google-closure-compiler &

git clone --depth 1 https://github.com/wolfcw/libfaketime.git /tmp/libfaketime
sed -i -e 's/\/usr\/local/\/tmp\/libfaketime/' /tmp/libfaketime/Makefile /tmp/libfaketime/*/Makefile
make -j -C /tmp/libfaketime/src
ln -s . /tmp/libfaketime/lib
ln -s src /tmp/libfaketime/faketime

#
# Merge changes from main
#

git merge --strategy-option=theirs --no-edit main

#
# Finish initialisation
#

fg

#
# Run the build itself
#

git merge --strategy-option=theirs origin/main
make -j -B gh-pages
git add .

#
# Commit/push changes
#

git commit -a -m "Update documentation"
git push
