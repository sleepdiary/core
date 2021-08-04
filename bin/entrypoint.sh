#!/bin/sh

SLEEPDIARY_NAME=core

cmd_build() {

    npm install --silent

    if [ -n "$FORCE" ]
    then make -j -B build
    else make -j    build
    fi

}

cmd_test() {

    if [ -t 1 ]
    then make             FULL || return "$?"
    else make -j -Otarget FULL || return "$?"
    fi

    git diff @{u} -- . ':!src/Example' | grep -i '^\+.*todo' \
        && warning \
               "git diff found 'TODO' messages" \
               "Please do these or remove the messages"

    git diff @{u} -- . ':!src/Example' | grep -i '^\+.*[^@\/]example[^s]' | grep -vF 'example code' \
        && warning \
               "git diff found example code" \
               "Please remove these from your code"

    git diff @{u} -- . ':!src/Example' | grep -i '^\+[^\*]*\.\.\.' \
        && warning \
               "git diff found '...' messages" \
               "Please fill these in or remove the messages"

    git ls-files src/\*/engine.js \
        | sed -e 's/^src\///' -e 's/\/engine.js$//' -e '/^Example$/ d' \
        | while read ENGINE
    do
        for FILE in Makefile README.md doc/README.md
        do
            if ! grep -q "$ENGINE" "$FILE"
            then
                warning "Please add $ENGINE to $FILE"
            fi
        done
    done

}

cmd_run() {
    find src/ -type f -print0 | \
        xargs -0 inotifywait -q -e CLOSE_WRITE -m | \
        while read REPLY
        do make build
        done
}

if [ -e /build-sleepdiary.sh ]
then
    . /build-sleepdiary.sh "$@"
else
    echo "Usage: docker run --rm -it -v $( realpath "$( dirname "$0" )/.." ):/app sleepdiaryproject/builder" "$@"
    exit 2
fi
