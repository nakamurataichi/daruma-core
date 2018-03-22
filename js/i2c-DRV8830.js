var DRV8830 = function(i2cPort,slaveAddress){
  this.i2cPort = i2cPort;
  this.i2cSlave = null;
  this.slaveAddress = slaveAddress;
};

DRV8830.prototype = {
  sleep: function(ms){
    return new Promise((resolve)=>{setTimeout(resolve,ms);});
  },

  init: function(){
    return new Promise((resolve, reject)=>{
      this.i2cPort.open(this.slaveAddress).then((i2cSlave)=>{
        this.i2cSlave = i2cSlave;
        console.log("init ok:"+this.i2cSlave);
        resolve();
      },(err)=>{
        reject(err);
      });
    });
  },
  // write speed setting
  // 1to100 forward(%)
  // -1to-100 reverse(%)
  // 0 is free
  // over 100 or -100 --> motor breake
  write: function(speed) {
    return new Promise(async (resolve, reject)=>{
      if(this.i2cSlave == null){
        reject("i2cSlave Address does'nt yet open!");
      }else{
	var set_val;
        if ((speed <= 100) & (speed >= -100)) {
	  if (speed ==  0) {
            set_val = 0; // free
          }
          if (speed > 0) {
            set_val = ((speed *63 /100) & 0x3f) << 2;
            set_val = set_val + 1; // forward
          }
          if (speed < 0) {
            set_val = ((speed *-63/100) & 0x3f) << 2;
            set_val = set_val + 2; // reverse
          }

          // Set Control
          await this.i2cSlave.write8(0x00, set_val & 0xff);
          await this.sleep(10);
          if (set_val ==0) {
            // clear falut
            await this.i2cSlave.write8(0x01, 0x1);
          }
        } else {
          // breake
          await this.i2cSlave.write8(0x00, 0x3);
          await this.sleep(10);
        }
      }
    });
  },
  // read  status
  status: function() {
    return new Promise(async (resolve, reject)=>{
      if(this.i2cSlave == null){
        reject("i2cSlave Address does'nt yet open!");
      }else{

        // READ status
        await this.i2cSlave.writeByte(0x1);
        this.i2cSlave.readBytes(1).then((v)=>{
          var status = v[0];
          var err = "Ready";
          if (status & 1) {
             err = "FAULT";
             if (status & 0x2) {
                 err = err + " OCP";
             }
             if (status & 0x4) {
                 err = err + " UVLO";
             }
             if (status & 0x8) {
                 err = err + " OTS";
             }
             if (status & 0x10) {
                 err = err + " LIMIT";
             }
          } 
          resolve([status,err]);

       },(err)=>{
          reject(err);

       });

      }
    });
  }

};
