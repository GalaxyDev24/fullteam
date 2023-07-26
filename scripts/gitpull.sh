#!/bin/bash

git reset --hard HEAD;
git pull;
knex migrate:latest --env=staging;
pm2 restart app;
