window.addEventListener("load", async () => {
  const socket = new WebSocket(config.wsServer);
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const motor = new DRV8830(port, 0x64);
  await motor.init();

  const sendMessage = object => {
    socket.send(JSON.stringify(object));
  };
  const sleep = ms => {
    return new Promise((resolve, reject) => setTimeout(resolve, ms));
  };
  const drive = speed => {
    motor.write(speed);
    sendMessage({
      type: "speed",
      speed: speed
    })
  };
  const stop = () => {
    drive("stop");
  };
  const speak = message => {
    sendMessage({
      type: "voice",
      message: message
    });
  };

  const timerId = setInterval(async () => {
    const values = await motor.status().catch(reason => {
      console.log(`READ ERROR: ${reason}`);
    });
    if (values) {
      sendMessage({
        type: "motor",
        stat: values[0],
        err: values[1]
      });
    }
  }, 100);

  socket.onmessgae = message => {
    const data = JSON.parse(message);
    if (data.type !== "status") {
      return;
    }
    if (data.onoff === "COMMAND") {
      drive(data.command);
    }
    if (data.onoff === "ON") {
      darumaAbareru();
    }
    if (data.onoff === "OFF") {
      darumaTomaru();
    }
  };

  // TODO
  const darumaAbareru = async () => {
    // example
    stop();
    await sleep(200);
    drive(100);
    speak("動いた");
  };

  const darumaTomaru = () => {
    stop();
  };
});
