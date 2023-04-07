var config = {};
config["User"] = {};
config["Blinds"] = [];
ip = "localhost";

const direction = {
    up: 0,
    down: 1
}

dir = direction.up;
  
const setExactTimeout = function(callback, duration, resolution){
    const start = (new Date()).getTime();
    const timeout = setInterval(function(){
        if((new Date()).getTime() - start > duration){
            callback();
            clearInterval(timeout);
        }
    }, resolution);
    
    return timeout;
};

const clearExactTimeout = function(timeout){
        clearInterval(timeout);
};

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
        this.isStopped = true
        this.pollInput = setInterval(function(){
            //console.log("Polling");
            this.manualMove();
        }.bind(this),100)
    }
    
    async manualMove(){
      try{
      var _isUp = await this.isInput(direction.up);
      var _isDown = await this.isInput(direction.down);
      //console.log(_isUp);
      //console.log(_isUp);
      if(((_isUp!=true) && this.prevUp) || ((_isDown!=true) && this.prevDown)){
        this.stop();
        console.log("MANUALLY STOPPED");
      }
      else if(_isUp && (this.prevUp!=true)){
          console.log("MANUALLY MOVE UP");
          this.moveUp();
      }
      else if(_isDown && (this.prevDown!=true)){
        console.log("MANUALLY MOVE DOWN");
        this.moveDown();
      }
      
      this.prevUp = _isUp;
      this.prevDown = _isDown;
    }catch{}
    }

    startTimer(timeRemaining) {
        if(timeRemaining<=0) return;
        console.log("Timer started with " + timeRemaining + "s.");
        this.timerStartedTimestamp = Date.now();
        this.timer = setExactTimeout(() => {
            this.stop();        
        }, timeRemaining*1000, 10);
    }

    stopTimer() {
        if (this.timer !== null) {
            console.log("Timer stopped");
            clearExactTimeout(this.timer);
            this.timer = null;
        }
    }

    moveUp(){
        this.direction = direction.up;
        console.log(`MOVE UP ${this.name} ${this.ip}.`);
        this.stopTimer()
        this.isStopped = false;
        this.switchShelly(direction.down, false);
        this.switchShelly(direction.up, true);
        this.startTimer(this.uptimeLeft);
    }

    moveDown(){
        this.direction = direction.down;
        console.log(`MOVE DOWN ${this.name} ${this.ip}.`);
        this.stopTimer()
        this.isStopped = false;
        this.switchShelly(direction.up, false);
        this.switchShelly(direction.down, true);
        this.startTimer(this.downtimeLeft);
    }
    
    calcRemainingTime(){
        var tp = (Date.now()-this.timerStartedTimestamp); // passed time since timer has started
        tp = tp/1000;
        console.log("Time passed since timer started " + tp +"s.");
        if(this.direction == direction.up){
            this.uptimeLeft -= tp;
            this.downtimeLeft += tp * (this.downtime/this.uptime);
            console.log("Downtime left: "+this.downtimeLeft+".");
            console.log("Uptime left: "+this.uptimeLeft+".");
            
        }else{
            this.downtimeLeft -= tp;
            this.uptimeLeft += tp * (this.uptime/this.downtime);
            console.log("Downtime left: "+this.downtimeLeft+".");
            console.log("Uptime left: "+this.uptimeLeft+".");
        }
        if(this.uptimeLeft < 0){this.uptimeLeft=0;}
        if(this.uptimeLeft > this.uptime){this.uptimeLeft = this.uptime}
        if(this.downtimeLeft < 0){this.downtimeLeft=0;}
        if(this.downtimeLeft > this.downtime){this.downtimeLeft = this.downtime}
        console.log("update times");
        updateConfigJson();
    }

    stop(){
        if(this.isStopped) return;
        var d = "down";
        if(this.direction == direction.up){
            d = "up";
        }
        console.log(`STOP ${this.name} ${this.ip} - Direction was ${d}.`);
        
        this.stopTimer()
        this.switchShelly(direction.up, false);
        this.switchShelly(direction.down, false);
        this.isStopped = true;
        this.calcRemainingTime();
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
            blind.stop();
        }
        blind.moveDown();
    }
}

function moveAllUp(){
    for(blind of config.Blinds){
        if(!blind.isStopped){
            blind.stop();
        }
        blind.moveUp();
    }
}

function stopAll(){
    for(blind of config.Blinds){
        blind.stop()
    }
}

function isStoppedAll(){
    for(blind of config.Blinds){
        if(!blind.isStopped){
            console.log("Not all stopped");
            return false;
        }
    }
    console.log("All stopped");
    return true;
}

function ToggleAll(event){
    var btn = event.target || event.srcElement; // IE

    if(isStoppedAll()){
        if(dir== direction.up){
            dir = direction.down;
            btn.textContent = "UP"
        }else{
            dir = direction.up;
            btn.textContent = "DOWN"
        }
    }
    if(!isStoppedAll()){
        stopAll();
    }
    else if(dir== direction.down){
        moveAllDown();
    }else{
        moveAllUp();
    }
}

function AllOnTop(){
    console.log("All on top!");
    document.getElementById("ToggleAll").textContent = "DOWN"
    dir = direction.up;
    for(blind of config.Blinds){
        blind.switchShelly(direction.down, false);
        blind.switchShelly(direction.up, true);
        blind.uptimeLeft = 0;
        blind.downtimeLeft = blind.downtime;
        blind.direction = direction.up
        blind.isStopped = true;
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
                jConfig = JSON.parse(resp.Content);
                console.log("Blinds in JSON: "+ config.Blinds);
                for(var blind of jConfig.Blinds){
                    console.log(typeof(blind));
                    b = new Blind()
                    Object.assign(b, blind);
                    config.Blinds.push(b);
                    CreateButton("blind"+blind.htmlId, false);
                    RenameButton("blind"+blind.htmlId, blind.name);
                }
                currentId = config.Blinds.at(-1).htmlId + 1;
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
                //console.log(resp.Content);
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
            window.alert("Done.");
        }
    });
}

async function switchShelly(shellyIp, id, state){
    //console.log("switchShelly")
    var data = {};
    data["Command"] = "switchShelly";
    data["Content"] = {ip:shellyIp,id:id,state:state};
    await $.ajax({
        url: "http://"+serverIp+":"+port+"/shelly",
        type: "GET",
        data: data,
        dataType: 'json',
        success: function(resp){
            //console.log(resp.Content);
        }
    });
}


async function isInput(shellyIp, id){
    return new Promise((resolve, reject) =>{
        //console.log("isInput")
        var data = {};
        data["Command"] = "isInput";
        data["Content"] = {ip:shellyIp,id:id};
        $.ajax({
            url: "http://"+serverIp+":"+port+"/shelly",
            type: "GET",
            data: data,
            dataType: 'json',
            success: function(resp){
                //console.log("IsInputState="+resp.Content.state);
                resolve(resp.Content.state);
            },
            error: function(resp){
                //console.log("IsInputStateError="+resp);
                reject(resp);
            }
        });
    });
}

