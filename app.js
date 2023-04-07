const ABS_PATH = "/home/server/BlindControl";
const username = 'admin';
const password = 'admin';
const shellyDefaultIp = '192.168.33.1';
const wifiSsid = 'ShellyAP';
const wifiPassword = 'shellypass';
const wifiGateway = "192.168.8.1";
const wifiSubnet = "255.255.255.0";
var gSsid = "";
var gPassword = "";

var request= require('request');
var express = require('express');
const { exec } = require("child_process");
var fs = require('fs');
var app = express();

const port = 3000
const host = "0.0.0.0";

async function getWifiList(){
  console.log("getWifiList");
  return new Promise((resolve, reject) => {
    exec("./GetWifiList.sh", (err, stdout, stderr) => {
      if(err){
        console.log(stderr);
        reject(stderr);
      }else{
        console.log(stdout);
        console.log("Liste erfolgreich geholt.");
        const lines = stdout.trim().split("\n");
        lines.shift();
        const networks = lines.map(line => line.trim().split(/\s+/)[0]);
        resolve(networks);
      }
    });
  });
}

async function disconnectWifi(){
  return new Promise((resolve, reject) => {
    exec(ABS_PATH+"/DisconnectWifi.sh", (err, stdout, stderr) => {
        if(err){
          console.log(err);
          reject(stderr);
        }else{
          console.log(stdout);
          console.log("Wifi getrennt.");
          resolve(stdout);
        }
    });
  });
}

async function connectWifi(ssid, password){
  return new Promise((resolve, reject) => {
    exec(ABS_PATH+"/ConnectWifi.sh "+ssid+" "+password, (err, stdout, stderr) => {
        if(err){
          console.log(err);
          reject(stderr);
        }else{
          console.log(stdout);
          console.log("Wifi verbunden.");
          resolve(stdout);
        }
    });
  });
}

async function stopHotspot(){
  return new Promise((resolve, reject) => {
    exec(ABS_PATH+"/StopHotspot.sh", (err, stdout, stderr) => {
        if(err){
          console.log(err);
          reject(stderr);
        }else{
          console.log(stdout);
          console.log("Hotspot gestoppt.");
          setTimeout(()=>{resolve(stdout);}, 3000);
        }
    });
  });
}

async function startHotspot(){
  return new Promise((resolve, reject) => {
    exec(ABS_PATH+"/StartHotspot.sh", (err, stdout, stderr) => {
        if(err){
          console.log(err);
          reject(stderr);
        }else{
          console.log(stdout);
          console.log("Hotspot gestartet.");
          setTimeout(()=>{resolve(stdout);}, 3000);
        }
    });
  });
}

startHotspot();

async function configureShelly(ip) {
  return new Promise((resolve, reject) => {
    url = `http://${shellyDefaultIp}/rpc/WiFi.SetConfig?config={"sta":{"ssid":"${wifiSsid}","pass":"${wifiPassword}","enable":true,"ipv4mode":"static", "ip":"${ip}", "netmask":"${wifiSubnet}", "gw":"${wifiGateway}", "nameserver":"8.8.8.8"}}`;
    console.log(url);
    request(url, (error, response, body) => {
      if (error) {
        console.error(error);
        reject(error);
      }else{
        console.log(JSON.parse(body));
        resolve(JSON.parse(body));
      }
    });
  });
}

async function switchShelly(ip, direction, state) {
  return new Promise((resolve, reject) => {
    url = `http://${ip}/rpc/Switch.Set?id=${direction}&on=${state}`
    console.log(url);
    request(url, (error, response, body) => {
      if (error) {
        console.error(error);
        reject(error);
      }else{
        console.log(JSON.parse(body));
        resolve(JSON.parse(body));
      }
    });
  });
}

async function isInput(ip, direction) {
  return new Promise((resolve, reject) => {
    url = `http://${ip}/rpc/Input.GetStatus?id=${direction}`
    console.log(url);
    request(url, (error, response, body) => {
      if (error) {
        console.error(error);
        reject(error);
      }else{
        resolve(JSON.parse(body));
      }
    });
  });
}

async function handleData(data) {
  var command = data["Command"];
  var content = data["Content"];
  var filename = ABS_PATH+"/Config.json";

  switch (command) {
    case "get":
      console.log("get");
      try {
        console.log(filename);
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
        try{
          await stopHotspot();
          const scanResults = await getWifiList(); 
          content = scanResults;
          await startHotspot();
        }catch(err){
          console.error(err);
        }
      break;
    case "setNetwork":
        console.log(content);
        content = JSON.parse(content);
        console.log(content);
        gSsid = content["ssid"];
        gPassword = content["password"];
        console.log("Set global network properties to " + gSsid + "   " + gPassword);
      break;    
    case "configureShelly":
      try{
        await stopHotspot();
        await connectWifi(gSsid, gPassword);
        await configureShelly(content);
        await disconnectWifi();
        await startHotspot();
      }catch(err){
        console.error(err);
      }
      break;  
    case "switchShelly":
      try{
        await switchShelly(content.ip, content.id, content.state);
      }catch(err){
        console.error(err);
      }
      break;
    case "isInput":
      try{
        content = await isInput(content.ip, content.id);
        console.log("IsinputContent="+content);
      }catch(err){
        console.error(err);
      }
      break;
    default:
      break;
  }
  return [true, content];
}

async function sendJson(req, res){
  console.log('Request');
  data = req.query;
  //console.log(data);
  try{
    result = await handleData(data);
  }catch(err){
    console.log(err);
  }
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
