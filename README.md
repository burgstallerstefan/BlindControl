# BlindControl

Setup

1. At sudo nano /etc/xdg/lxsession/LXDE-pi/autostart add:
	1.1 @sh /home/server/BlindControl/StartServer.sh 
	
1.2 Eventuell muss dnsmasq und hostapd installiert werden 


2. At sudo nano /etc/dhcpcd.conf add
	2.1 
	interface eth0
	static ip_address=192.168.10.2/24
	static routers=192.168.10.1
	static domain_name_servers=192.168.10.1

3. user of raspi should be server (for path)


4. clone git

5. install npm

6. npm install all required modules in app.js and index.js as module.js
	install in blindcontrol folder (!):
		- node-wifi
		- node-fetch
		
7. install hostapd
sudo apt-get install hostapd
