#!/bin/sh
sudo ip addr add 192.168.10.2/24 dev eth0
pkill -f "node"
node /home/server/BlindControl/app.js
sh /home/server/BlindControl/StartHotspot.sh
