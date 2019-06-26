#!/usr/bin/env bash

rm rfeeder.zip
zip -r rfeeder.zip . -x *.git* *.idea* *.sh
