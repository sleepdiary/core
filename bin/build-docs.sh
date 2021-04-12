#!/bin/sh
#
# Build the documentation
#
# Called from .github/workflows/gh-pages

set -v # verbose mode - print commands to stderr
set -e # exit if any of the commands below return non-zero

#
# Check if there's anything to do
#

if ! git rev-list gh-pages..main | grep -q .
then
    echo "'main' has already been merged into 'gh-pages' - stopping"
    exit 0
fi

#
# Initialise the build environment
#

npm install -g jsdoc google-closure-compiler

git clone --depth 1 https://github.com/wolfcw/libfaketime.git /tmp/libfaketime
sed -i -e 's/\/usr\/local/\/tmp\/libfaketime/' /tmp/libfaketime/Makefile /tmp/libfaketime/*/Makefile
make -j -C /tmp/libfaketime/src
ln -s . /tmp/libfaketime/lib
ln -s src /tmp/libfaketime/faketime

#
# Merge changes from main
#

git merge --strategy-option=theirs --no-edit origin/main

#
# Run the build itself
#

make -B gh-pages
git add .

#
# Commit/push changes
#

if git diff --quiet HEAD
then
    echo "No changes to commit"
else
    git commit -a -m "Update documentation"
fi
git push
