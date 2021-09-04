#!/bin/sh

set -e

if [ -e /opt/sleepdiary/utils.sh ]
then . /opt/sleepdiary/utils.sh
else printf '\033[1;31m/opt/sleepdiary/utils.sh not found - some checks bypassed.\033[0m\n'
fi

do_build() {

    echo

    if [ -n "$FORCE" ]
    then make -j -B build
    else make -j    build
    fi

}

case "$1" in

    build)

        do_build
        ;;

    test)

        if [ -t 1 ]
        then make             FULL || exit "$?"
        else make -j -Otarget FULL || exit "$?"
        fi

        generic_tests

        git diff @{u} -- . ':!src/Example' | grep -i '^\+.*[^@\/]example[^s]' | grep -vF 'example code' \
            && warning \
                   "git diff found example code" \
                   "Please remove these from your code"

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

        exit "$WARNED"
        ;;

    upgrade)
        npm upgrade
        rm -f yarn.lock
        yarn import
        ;;

    serve)
        DIRECTORIES=src
        do_build
        inotifywait -r -q -e CLOSE_WRITE -m $DIRECTORIES | \
            while read REPLY
            do
                do_build
                case "$?" in
                    0) printf '\033[1;32mSuccess!\033[0m\n' ;;
                    1) printf '\033[1;33mNon-fatal errors occurred!\033[0m\n' ;;
                    *) printf '\033[1;31mFailed!\033[0m\n' ;;
                esac
            done
        ;;

    *)
        exit 2
        ;;

esac
