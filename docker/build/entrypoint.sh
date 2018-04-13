#!/bin/bash

_term() {
    kill -TERM "$child" 2>/dev/null
}

_int() {
    kill -TERM "$child" 2>/dev/null
}

trap _term SIGTERM
trap _int SIGINT

$@ &

child=$!
wait "$child"
