const username = 'admin';
const password = 'admin';
const shellyDefaultIp = '192.168.33.1';
const wifiSsid = 'ShellyAP';
const wifiPassword = 'shelly';
const wifiGateway = "192.168.10.1"
const wifiSubnet = "255.255.255.0"

var request= require('request');
var express = require('express');
const wifi = require('node-wifi');
var fs = require('fs');
var app = express();


const port = 3000
const host = "0.0.0.0";

// WLAN-Schnittstelle initialisieren
wifi.init({
  iface: null,
});

async function configureShelly(ip) {
  url = `http://${shellyDefaultIp}/rpc/WiFi.SetConfig?config={"sta":{"ssid":"${wifiSsid}","pass":"${wifiPassword}","enable":true,"ipv4mode":"dhcp"}}`;
  console.log(url);
  request(url, (error, response, body) => {
    if (error) {
      console.error(error);
      return;
    }
    console.log(JSON.parse(body));
  });
}

async function switchShelly(ip, direction, state) {
  url = `http://${ip}/rpc/Switch.Set?id=${direction}&on=${state}`
  console.log(url);
  request(url, (error, response, body) => {
    if (error) {
      console.error(error);
      return;
    }
    console.log(JSON.parse(body));
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
          wifi.scan((err, response) => {
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
          wifi.connect({ssid:ssid, password:password}, (err) => {
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

app.use(function(req, res, next){
	res.header("Access-Control-Allow-Origin","*");
	res.header("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept");
	next();
});
app.use("/",express.static(__dirname));

app.get("/data",sendJson);  // defining data as the get endpoint instead of root
app.get("/shelly",sendJson);  // defining data as the get endpoint instead of root

app.get('/Update.sh', (req, res) => {
  child_process.exec('sh Update.sh', (err, stdout, stderr) => {
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
