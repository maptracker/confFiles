#!/bin/bash

## Just check that I've changed the @name field in each style. New
## styles are copied from UsaToday.user.css

match="(USA Today)"
egrep -H '^@name\b' *.user.css | egrep "$match"
