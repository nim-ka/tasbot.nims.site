#!/bin/bash

NODE_PATH="$(npm root -g)" /usr/bin/node $@ 2>>$DOCUMENT_ROOT/private/node-error-log.txt
