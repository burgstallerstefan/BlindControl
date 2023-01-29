#! bin/sh
pkill -f "nodejs"
git pull --all
nodejs blindcontrol/app.js