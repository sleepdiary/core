#!/bin/sh

SLEEPDIARY_NAME=core

cmd_build() {

    npm install -g xmldom timezonecomplete exceljs

    if [ -n "$FORCE" ]
    then make -B build
    else make    build
    fi

}

cmd_test() {

    make FULL || return "$?"

    git log --oneline | grep -i 'fixup!\|squash\!' && warning "Please do: git rebase -i @{u}"

    git diff @{u} -- . ':!src/Example' | grep -i '^\+.*todo' && warning "Please remove 'TODO' messages in your code"

    git diff @{u} -- . ':!src/Example' | grep -i '^\+.*[^@\/]example[^s]' | grep -vF 'example code' && warning "Please fix 'example' messages in your code"

    git diff @{u} -- . ':!src/Example' | grep -i '^\+[^\*]*\.\.\.' && warning "Please fix '...' messages in your code"

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

. /build-sleepdiary.sh "$@"
