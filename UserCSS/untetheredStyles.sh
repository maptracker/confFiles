#!/bin/bash

## Find styles that no longer have a URL pointing to their remote source

egrep '^		"(updateUrl|name)"' stylus.json
