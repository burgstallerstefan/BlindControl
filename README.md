# BlindControl

Setup

1. At sudo nano /etc/xdg/lxsession/LXDE-pi/autostart add:
	1.1 @lxterminal -e /home/server/BlindControl/StartServer.sh

2. At sudo nano /etc/dhcpcd.conf add
	2.1 
	interface eth0
	static ip_address=192.168.10.2/24
	static routers=192.168.10.1
	static domain_name_servers=192.168.10.1

3. user server, server
