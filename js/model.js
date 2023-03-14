var config = {};
config["User"] = {};
config["Blinds"] = [];
ip = "localhost"

const direction = {
    up: 0,
    down: 1
  }

class Blind extends Shelly{
    constructor(network, name, ip, uptime, downtime, htmlId){
        super(network, ip)
        this.name = name;
        this.uptime = uptime;
        this.downtime = downtime;
        this.uptimeLeft = 0;
        this.downtimeLeft = 0;
        this.htmlId = htmlId;
    }
    moveUp(){
        return 0;
    }
    moveDown(){
        return 0;
    }
    toggle(){
        return 0;
    }
}

function moveAllDown(){
    for(b of config.Blinds){
        blind = new Blind(...b);
        blind.moveDown();
    }
}

function moveAllUp(){
    for(b of config.Blinds){
        blind = new Blind(...b);
        blind.moveUp();
    }
}

function getConfig(){
    data = {};
    data["Command"] = "get";
    data["Content"] = "{}";
    $.ajax({
        url: "http://"+serverIp+":3000//data",
        type: "GET",
        data: data,
        dataType: 'json',
        success: function(resp){
                console.log("Clientside json:");
                console.log(resp);
                config = resp.Content;
                console.log(config);
                config = JSON.parse(config);
                
                for(var blind of config.Blinds){
                    CreateButton("blind"+blind.htmlId, false);
                    RenameButton("blind"+blind.htmlId, blind.name);
                }
                currentId = config.Blinds.at(-1).htmlId + 1;
                console.log("Read next html id = " + currentId);
            }
    });
    return config
}

function updateConfigJson(){
    data = {};
    data["Command"] = "set";
    data["Content"] = JSON.stringify(config);
    $.ajax({
        url: "http://"+serverIp+":3000/data",
        type: "GET",
        data: data,
        dataType: 'json',
        success: function(resp){
                console.log(resp.Content);
            }
    });
}

function getNetworks(){
    data = {};
    data["Command"] = "getNetworkList";
    data["Content"] = "";
    $.ajax({
        url: "http://"+serverIp+":3000/data",
        type: "GET",
        data: data,
        dataType: 'json',
        success: function(resp){
            $('#blindNetworkSSID').empty();
            // add new options from response
            resp.Content.networks.forEach(function(network) {
              var option = $('<option>');
              option.val(network.ssid);
              option.text(network.ssid);
              $('#blindNetworkSSID').append(option);
        });
    }
});
}

function getAvailableIp(){
    let _blacklist = ["192.168.10.0", "192.168.10.1", "192.168.10.2", "192.168.10.3", "192.168.10.255"]
    for(var blind of config.Blinds){
        _blacklist.push(blind.ip)
    }
    for(let i = 0; i < 256; i++){
        _ip = `192.168.10.${i}`
        if(!_blacklist.includes(_ip)){
            return _ip
        }
    }
    return "No ip address available."
}

async function setNetwork(network){
    var data = {};
    data["Command"] = "setNetwork";
    data["Content"] = network;
    await $.ajax({
        url: "http://"+serverIp+":3000/data",
        type: "GET",
        data: data,
        dataType: 'json',
        success: function(resp){
            console.log(resp.Content);
        }
    });
}

async function configure(shellyIp){
    console.log("configure")
    var data = {};
    data["Command"] = "configureShelly";
    data["Content"] = shellyIp;
    await $.ajax({
        url: "http://"+serverIp+":3000/shelly",
        type: "GET",
        data: data,
        dataType: 'text',
        success: function(resp){
            console.log(resp.Content);
            alert(resp.Content);
        }
    });
}

async function switchShelly(shellyIp, id, state){
    console.log("configure")
    var data = {};
    data["Command"] = "switchShelly";
    data["Content"] = {ip:shellyIp,id:id,state:state};
    await $.ajax({
        url: "http://"+serverIp+":3000/shelly",
        type: "GET",
        data: data,
        dataType: 'json',
        success: function(resp){
            console.log(resp.Content);
            alert(resp.Content);
        }
    });
}