var config = {};
config["User"] = {};
config["Blinds"] = [];
ip = "localhost"

const direction = {
    up: 0,
    down: 1,
  }

class Blind extends Shelly{
    constructor(network, name, ip, uptime, downtime, htmlId){
        super(network, ip)
        this.name = name;
        this.uptime = uptime;
        this.downtime = downtime;
        this.uptimeLeft = 0;
        this.downtimeLeft = downtime;
        this.htmlId = htmlId;
        this.timer = null;
        this.timerStartedTimestamp = 0;
        this.direction = direction.down;
        this.isStopped = true;
    }

    startTimer(timeRemaining) {
        this.timerStartedTimestamp = Date.now();
        this.timer = setTimeout(() => {
            this.stop();            
        }, timeRemaining);
    }

    stopTimer() {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    moveUp(){
        this.stopTimer()
        this.isStopped = false;
        this.switchShelly(direction.down, false);
        this.switchShelly(direction.up, true);
        this.startTimer(this.uptimeLeft);
    }

    moveDown(){
        this.stopTimer()
        this.isStopped = false;
        this.switchShelly(direction.up, false);
        this.switchShelly(direction.down, true);
        this.startTimer(this.downtimeLeft);
    }

    stop(){
        this.stopTimer()
        this.switchShelly(direction.up, false);
        this.switchShelly(direction.down, false);
        this.isStopped = true;
        var tp = (Date.now()-this.timerStartedTimestamp); // passed time since timer has started
        if(this.direction == direction.up){
            this.uptimeLeft = this.uptime-tp;
            if(this.uptimeLeft < 0){this.uptimeLeft=0;}
            this.downtimeLeft = (tp/this.uptime) * this.downtime;
        }else{
            this.downtimeLeft = this.downtime-tp;
            if(this.downtimeLeft < 0){this.downtimeLeft=0;}
            this.uptimeLeft = (tp/this.downtime) * this.uptime;
        }
    }

    toggle(){
        // change direction if is stopped
        if(this.isStopped){
            if(this.direction == direction.up){
                this.direction = direction.down;
            }else{
                this.direction = direction.up;
            }
        }
        if(!this.isStopped){
            this.stop();
        }
        else if(this.direction == direction.down){
            this.moveDown();
        }else{
            this.moveUp();
        }

    }
}

function moveAllDown(){
    for(blind of config.Blinds){
        if(!blind.isStopped){
            this.stop()
        }
        blind.moveDown();
    }
}

function moveAllUp(){
    for(blind of config.Blinds){
        if(!blind.isStopped){
            this.stop()
        }
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
        url: "http://"+serverIp+":"+port+"/data",
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
            resp.Content.forEach(function(network) {
              var option = $('<option>');
              option.val(network);
              option.text(network);
              $('#blindNetworkSSID').append(option);
        });
    }
});
}

function getAvailableIp(){
    let _blacklist = ["192.168.8.0", "192.168.8.1", "192.168.8.255"]
    for(var blind of config.Blinds){
        _blacklist.push(blind.ip)
    }
    for(let i = 0; i < 256; i++){
        _ip = `192.168.8.${i}`
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
        url: "http://"+serverIp+":"+port+"/data",
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
        }
    });
}

async function switchShelly(shellyIp, id, state){
    console.log("switchShelly")
    var data = {};
    data["Command"] = "switchShelly";
    data["Content"] = {ip:shellyIp,id:id,state:state};
    await $.ajax({
        url: "http://"+serverIp+":"+port+"/shelly",
        type: "GET",
        data: data,
        dataType: 'json',
        success: function(resp){
            console.log(resp.Content);
        }
    });
}
