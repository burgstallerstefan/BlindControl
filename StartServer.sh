#!/bin/sh
sudo systemctl start NetworkManager
sudo ip addr add 192.168.10.2/24 dev eth0
sudo pkill -f "node"
sudo node /home/server/BlindControl/app.js
