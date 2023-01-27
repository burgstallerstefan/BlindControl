var express = require('express');
var fs = require('fs');
var app = express();
var host = "0.0.0.0"
var port = 3000

function handleData(data){
  var command = data["Command"];
  var content = data["Content"];
  var filename = "Config.json"; 

  switch(command){
    case "get":
      console.log("get");
      content = fs.readFileSync(filename,
            {encoding:'utf8', flag:'r'});
      console.log('Read file!');
      break;
    case "set":
      console.log("set");
      fs.writeFileSync(filename, content);
      console.log('Updated file!');
      break;
    default:
      break;
  }
  return [true, content];
}

function sendJson(req, res){
   console.log('Request');
   data = req.query;
   console.log(data);
   result = handleData(data);
   console.log(result);
   var jRes = `{"Result" : ${result[0]}, "Content": ${result[1]}}`;
   res.type('json');
   res.send(JSON.stringify(jRes));
   console.log("OK")
}

app.use("/",express.static(__dirname));

app.get("/data",sendJson);  // defining data as the get endpoint instead of root

app.listen(port, host, () => {
  console.log(`Server is running at ${host}:${port}`);
});