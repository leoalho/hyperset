#!/bin/bash

sqlite3 /mnt/joukko/production.db ".backup '/mnt/joukko/dbbackups/$(date +%F-%R).db'"
