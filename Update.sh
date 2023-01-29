#! bin/sh
pkill -f "nodejs"
git pull --all
nodejs app.js