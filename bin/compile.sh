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

if git log --oneline | grep -i 'fixup!\|squash\!'
then
    echo
    echo "Please do: git rebase -i @{u}"
    exit 2
fi

if ! git diff --exit-code
then
    git status
    echo
    echo "Please commit the above changes"
    exit 2
fi

if git diff @{u} | grep -i '^\+.*todo'
then
    echo "Please remove 'TODO' messages in your code"
    exit 2
fi

if git diff @{u} | grep -i '^\+.*[^@]example'
then
    echo "Please fix any 'example' messages in your code"
    exit 2
fi

if git diff @{u} | grep -i '^\+.*\.\.\.'
then
    echo "Please fix any '...' messages in your code"
    exit 2
fi

git ls-files src/\*/format.js \
    | sed -e 's/^src\///' -e 's/\/format.js$//' -e '/^Example$/ d' \
    | while read FORMAT
      do
          for FILE in Makefile index.js README.md doc/README.md
          do
              if ! grep -q "$FORMAT" "$FILE"
              then
                  echo "Please add $FORMAT to $FILE"
                  exit 2
              fi
          done
      done

# Make sure we're going to push what we expected to:
git diff @{u} ':(exclude)doc/*.html' ':(exclude)sleep-diary-formats.js.map'
echo
git log --oneline --graph @{u}...HEAD

echo
echo "Please review the above changes, then do: git push"
