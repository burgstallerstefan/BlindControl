shellyAP = "ShellyAP"
shellyPW = ""

class Shelly {
    constructor(network, ip) {
      this.network = network;
      this.ip = ip;
      console.log('Creating new Shelly with network:', network, 'and IP:', ip);
      this.init()
    }
    
    async init(){
      try {
        await setNetwork(JSON.stringify(this.network));
        console.log('Network set successfully');
        await configure(this.ip);
        console.log('Shelly configured successfully');
      } catch (error) {
        console.log(error);
      }
    }

    async switchShelly(id, state){
      try {
        await switchShelly(this.ip, id, state)
      } catch (error) {
        console.log(error);
      }
    }
  }
