#! /bin/sh
git pull --all
git add --all;
git commit -m "$1";
git push -u origin $2
