#!/bin/bash

sqlite3 /mnt/joukko/production.db ".backup '/mnt/joukko/backups/$(date +%F-%R).db'"
