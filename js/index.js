var mode = 0;
var currentId = 0;
var clickedId = 0;

// Reset to normal mode if click anywhere
document.addEventListener('click', function(event) {
    console.log(event)
    var dropdownButton = document.getElementById("Dropdown");
    var outsideClickDropdownButton = !dropdownButton.contains(event.target);
    var dropdown = document.getElementById("navbarToggleExternalContent");
    var outsideClickDropdown = !dropdown.contains(event.target);
    var outsideClickButtons = !event.target.id.includes("blind");
    console.log("Outside dropdown: " + outsideClickDropdown);
    console.log("Outside buttons: " + outsideClickButtons);
    console.log("Previous mode: " + mode);
    if(outsideClickDropdown && outsideClickDropdownButton && outsideClickButtons){
        console.log("DeleteBlind");
        console.log(config);
        for(blind of config.Blinds){
            var htmlId = "blind" + blind.htmlId;
            btn = document.getElementById(htmlId);
            btn.className = "btn btn-success";
        mode = 0;
    }
    console.log("Mode: " + mode);
    }
});

getConfig();

console.log(config);

function _findBlind(htmlId){
    for(blind of config.Blinds){
        if("blind"+blind.htmlId === htmlId){
            return blind;
        }
    }
    return null;
}

function blindClicked(event){
    var htmlId = event.target.id;
    var blind = _findBlind(htmlId)
    if(blind == null) return;
    clickedId = blind.htmlId;
    console.log("HtmlID = " + htmlId);

    switch(mode){
        case 0: /* Normal mode */
            blind.toggle()
            break;
        case 1: /* Info mode */    
            document.getElementById("blindNetworkSSID").value = blind.network.ssid
            document.getElementById("blindNetworkPassword").value = blind.network.password
            document.getElementById("blindName").value = blind.name;
            document.getElementById("blindIp").value = blind.ip;
            document.getElementById("blindDownTime").value = blind.downtime;
            document.getElementById("blindUpTime").value = blind.uptime;
                
            $('#ModalBlind').modal('show');
            break;
        case 2: /* Delete mode */
            DeleteButton(htmlId);
            for(blind of config.Blinds){
                if("blind"+blind.htmlId == htmlId){
                    console.log("ID " + htmlId + "found.");
                    index = config.Blinds.indexOf(blind);
                    console.log("Index = " + index);
                    console.log(config);
                    config.Blinds.splice(index, 1);
                    updateConfigJson();
                    break;
                } 
            }
            break;
        default:break;
    }
}

function CreateButton(htmlId, dialog){
    var c = document.getElementById("c");
    // Create button
    var btn = document.createElement("button");
    btn.id = htmlId;
    btn.style.fontSize = "50px";
    btn.style.width = "30%";
    btn.style.height = "250px";
    btn.className = "btn btn-success";
    btn.style.marginLeft = "2.5%";
    btn.style.marginTop = "50px";
    btn.onclick = blindClicked;
    c.appendChild(btn);
    getNetworks()
    $("#blindIp").val(getAvailableIp);
    if(dialog){
        $('#ModalBlind').modal('show');
    }
}

function DeleteButton(htmlId){
    console.log("Delete button " + htmlId);
    var btn = document.getElementById(htmlId);
    btn.remove();
}

function RenameButton(htmlId, name){
    var btn = document.getElementById(htmlId);
    btn.textContent = name;
}

function Overview(){

}

function DeleteBlind(){
    console.log("DeleteBlind");
    console.log(config)
    for(blind of config.Blinds){
        var htmlId = "blind" + blind.htmlId;
        btn = document.getElementById(htmlId);
        btn.className = "btn btn-danger";
    }
    mode  = 2;
}

function Info(){
    console.log("DeleteBlind");
    console.log(config)
    for(blind of config.Blinds){
        var htmlId = "blind" + blind.htmlId;
        btn = document.getElementById(htmlId);
        btn.className = "btn btn-warning";
    }
    mode = 1;
}

function SaveChanges(htmlId, newBlind){
    var networkSSID = document.getElementById("blindNetworkSSID").value;
    var networkPassword = document.getElementById("blindNetworkPassword").value;
    var network = {
        ssid: networkSSID,
        password: networkPassword
    };
    var name = document.getElementById("blindName").value;
    var ip = document.getElementById("blindIp").value;
    var downTime = parseInt(document.getElementById("blindDownTime").value);
    var upTime = parseInt(document.getElementById("blindUpTime").value);

    var blind = new Blind(network, name, ip, upTime, downTime, currentId);

    if(newBlind){
        config["Blinds"].push(blind);
        currentId = currentId + 1;
    }else{
        var b = _findBlind(htmlId)
        if(b==null) return;
        if(b.networkSSID != networkSSID || b.ip != ip)
        Object.assign(b, blind);
    }
    RenameButton(htmlId, name);
    
    $('#ModalBlind').modal('hide');
    updateConfigJson();
}

function ToggleAll(event){
    this.up = !this.up;
    var btn = event.target || event.srcElement; // IE
    if(this.up){
        moveAllDown();
        btn.textContent = "UP"
    }else{
        moveAllUp();
        btn.textContent = "DOWN"
    }
}

function UpdateClock() {
    var now = new Date()
    var month = now.getMonth() + 1
    var time = now.getHours().toString().padStart(2, "0") + ':' + now.getMinutes().toString().padStart(2, "0") + ":" + now.getSeconds().toString().padStart(2, "0") + "    " + now.getDate().toString().padStart(2, "0") + "." + month.toString().padStart(2, "0") + "." + now.getFullYear().toString().padStart(4, "0")

    // set the content of the element with the ID time to the formatted string
    document.getElementById('dat').innerHTML = time;

    // call this function again in 1000ms
    setTimeout(UpdateClock, 200);
}
UpdateClock(); // initial call

function Update() {
	$.ajax({
	  url: 'http://'+serverIp+':3000//Update.sh',
	  type: 'GET',
	  success: function (result) {
		console.log(result);
		alert(result);
	  }
	});
}
  
  