const username = 'admin';
const password = 'admin';
const shellyDefaultIp = '192.168.33.1';
const wifiSsid = 'ShellyAP';
const wifiPassword = '';
const wifiGateway = "192.168.10.1"
const wifiSubnet = "255.255.255.0"

var express = require('express');
const wifi = require('wifi-control');
var fs = require('fs');
var app = express();

// WLAN-Schnittstelle initialisieren
wifi.init({
  debug: true
});

// Konfiguration des Hotspots
const hotspotConfig = {
  ssid: wifiSsid,
  password: wifiPassword,
  mode: 'ap',
};

// Erstellung des Hotspots
wifi.configure(hotspotConfig, (err) => {
  if (err) {
    console.error('Fehler beim Konfigurieren des Hotspots: ', err);
    return;
  }

  console.log('Hotspot erfolgreich konfiguriert');
});

wifi.configure()

async function configureShelly(ip) {
  url = `http://${shellyDefaultIp}/rpc/WiFi.SetConfig?config={"sta":{"ssid":"${wifiSsid}","pass":"${wifiPassword}","enable":true,"ipv4mode":"static","ip":"${ip}", "netmask":"${wifiSubnet}", "gw":"${wifiGateway}", "nameserver":"8.8.8.8"}}`;
  console.log(url);
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Fehler beim Konfigurieren des Shelly 2PM.');
      }
      console.log('Shelly 2PM erfolgreich im STA-Modus mit statischer IP-Adresse konfiguriert.');
    })
    .catch(error => {
      console.error('Fehler:', error);
    });
}

async function switchShelly(ip, direction, state) {
  url = `http://${ip}/rpc/Switch.Set?id=${direction}&on=${state}`
  console.log(url);
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Fehler beim Schalten des Shelly 2PM.');
      }
      console.log('Shelly 2PM erfolgreich geschaltet.');
    })
    .catch(error => {
      console.error('Fehler:', error);
    });
}

async function handleData(data) {
  var command = data["Command"];
  var content = data["Content"];
  var filename = "Config.json";

  switch (command) {
    case "get":
      console.log("get");
      try {
        content = await fs.promises.readFile(filename, "utf8");
        console.log('Read file!');
      } catch (error) {
        console.error(error);
        content = error.message;
      }
      break;
    case "set":
      console.log("set");
      try {
        await fs.promises.writeFile(filename, content);
        console.log('Updated file!');
      } catch (error) {
        console.error(error);
        content = error.message;
      }
      break;
    case "getNetworkList":
      try {
        const scanResults = await new Promise((resolve, reject) => {
          wifi.scanForWiFi((err, response) => {
            if (err) reject(err);
            resolve(response);
          });
        });
        content = scanResults;
        console.log(content);
      } catch (error) {
        console.error(error);
        content = error.message;
      }
      break;
    case "setNetwork":
      try {
        console.log(content);
        content = JSON.parse(content);
        console.log(content);
        const ssid = content["ssid"];
        const password = content["password"];
        console.log("Try set network " + ssid + "   " + password);
        const connected = await new Promise((resolve, reject) => {
          wifi.connectToAP({ssid, password}, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(true);
            }
          });
        });
        if (connected) {
          content = "Connected to network " + ssid + ".";
          console.log(content);
        } else {
          content = "Failed to connect to network " + ssid + ".";
          console.log(content);
        }
      } catch (error) {
        console.error(error);
        content = error.message;
      }
      break;    
    case "configureShelly":
      await configureShelly(content)
      break;  
    case "switchShelly":
      await switchShelly(content.ip, content.id, content.state)
      break;
    default:
      break;
  }
  return [true, content];
}

async function sendJson(req, res){
  console.log('Request');
  data = req.query;
  console.log(data);
  result = await handleData(data);
  console.log(result);
  var jRes = {"Result" : result[0], "Content": result[1]};
  res.type('json');
  res.send(jRes);
  console.log("OK")
}

app.use("/",express.static(__dirname));

app.get("/data",sendJson);  // defining data as the get endpoint instead of root
app.get("/shelly",sendJson);  // defining data as the get endpoint instead of root

app.get('/Update.sh', (req, res) => {
  child_process.exec('bash Update.sh', (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      res.send('Update failed');
    } else {
      console.log(stdout);
      res.send('Update complete');
    }
  });
});

app.listen(port, host, () => {
  console.log(`Server is running at ${host}:${port}`);
});