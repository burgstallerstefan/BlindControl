var config = {};
config["User"] = {};
config["Blinds"] = [];
ip = "192.168.10.2"

class Blind{
    constructor(name, pin, port, uptime, downtime, htmlId){
        this.name = name;
        this.pin = pin;
        this.port = port;
        this.uptime = uptime;
        this.downtime = downtime;
        this.uptimeLeft = 0;
        this.downtimeLeft = 0;
        this.htmlId = htmlId;
    }
    moveUp(){
        return 0;
    }
}


function getConfig(){
    data = {};
    data["Command"] = "get";
    data["Content"] = "{}";
    $.ajax({
        url: "http://"+ip+":3000//data",
        type: "GET",
        data: data,
        dataType: 'json',
        success: function(resp){
                r = JSON.parse(resp);
                config = r.Content;
                console.log(JSON.stringify(config));
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
        url: "http://"+ip+":3000/data",
        type: "GET",
        data: data,
        dataType: 'json',
        success: function(resp){
                console.log(resp);
            }
    });
}