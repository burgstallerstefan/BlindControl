#!/bin/bash

# Konfiguration des Hotspots
nmcli device wifi hotspot con-name ShellyConn ssid ShellyAP band bg password shellypass
nmcli connection modify ShellyConn ipv4.addresses 192.168.8.1/24 ipv4.gateway 192.168.8.1 ipv4.method manual

# Starten des Hotspots
nmcli connection up ShellyConn
