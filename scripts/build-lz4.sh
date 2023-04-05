#!/usr/bin/env bash
emsdk install 3.1.35
emsdk activate 3.1.35

emcc lz4/lib/lz4.c -O3 \
    -s "STRICT=1" \
    -s "ALLOW_MEMORY_GROWTH=1" \
    -s WASM=1 \
    -s EXPORT_NAME="LZ4Module" \
    -s "MODULARIZE=1" \
    -s EXPORTED_FUNCTIONS="['_LZ4_createStream']" \
    -s SINGLE_FILE=1 \
    -o src/lz4.js