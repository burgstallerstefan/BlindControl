#!/bin/bash

if [ $# -eq 2 ]; then 
	echo "a"
	sudo nmcli device wifi connect $1 password $2
elif [ $# -eq 1 ]; then
	echo "b"
	sudo nmcli device wifi connect $1
else 
	echo "error"
fi