#!/bin/sh

if [ -z "$container" ]
then
    echo "Please run this inside a container"
    exit 2
fi

chdir "$( dirname "$0" )/.."
START_TIME="$( date -R )"
ORIGINAL_USER="$( stat -c %U:%G /app )"

if [ $( git rev-list --count HEAD..@{u}) != 0 ]
then
    echo
    echo "Please pull or rebase upstream changes"
    exit 2
fi

# Make sure everything is up-to-date and run the tests:
make -B FULL
MAKE_RESULT="$?"

# fix permissions for any modified files, and check the make succeeded:
if ! find -newermt "$START_TIME" -exec chown "$ORIGINAL_USER" '{}' ';' || [ "$MAKE_RESULT" != 0 ]
then
    echo
    echo "Please fix the above errors"
    exit 2
fi
echo

RESULT=

fail() {
    echo
    echo ^^^ "$@"
    echo
    echo
    RESULT=2
}

git log --oneline | grep -i 'fixup!\|squash\!' && fail "Please do: git rebase -i @{u}"
git diff --exit-code || {
    git status
    fail "Please commit the above changes"
}

kramdown -v | grep -q . || fail "Please install the 'kramdown' parser"
for DEMO in src/*/demo.md
do
    if kramdown "$DEMO" 2>&1 >/dev/null | grep -q .
    then
        kramdown "$DEMO" >/dev/null
        fail "Please fix markdown issues in $DEMO"
    fi
done

git diff @{u} -- . ':!src/Example' | grep -i '^\+.*todo' && fail "Please remove 'TODO' messages in your code"

git diff @{u} -- . ':!src/Example' | grep -i '^\+.*[^@\/]example[^s]' | grep -vF 'example code' && fail "Please fix 'example' messages in your code"

git diff @{u} -- . ':!src/Example' | grep -i '^\+[^\*]*\.\.\.' && fail "Please fix '...' messages in your code"

git ls-files src/\*/format.js \
    | sed -e 's/^src\///' -e 's/\/format.js$//' -e '/^Example$/ d' \
    | while read FORMAT
      do
          for FILE in Makefile index.js README.md doc/README.md
          do
              if ! grep -q "$FORMAT" "$FILE"
              then
                  fail "Please add $FORMAT to $FILE"
              fi
          done
      done

[ -n "$RESULT" ] && exit "$RESULT"

# Make sure we're going to push what we expected to:
git diff @{u} ':(exclude)doc/*.html' ':(exclude)sleep-diary-formats.js.map'
echo
git log --oneline --graph @{u}...HEAD

echo
echo "Please review the above changes, then do: git push"
