window.addEventListener("load", async () => {
  const socket = new WebSocket(config.wsServer);
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const motor = new DRV8830(port, 0x64);
  await motor.init();
  let isRage = false;

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
      type: "message",
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

  socket.onmessage = message => {
    const data = JSON.parse(message.data);
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

  const asyncTextGenerater = function* (...asyncTexts) {
    for (const asyncText of asyncTexts) {
      yield asyncText;
    }
  };

  const darumaAbareru = async () => {
    isRage = true;
    while (isRage) {
      const asyncFunctions = asyncTextGenerater(
        `speak("乾いた")`,
        "sleep(100)",
        "drive(20)",
        "sleep(600)",
        `speak("乾いた")`,
        "drive(10)",
        "sleep(700)"
      );

      for (const asyncFunction of asyncFunctions) {
        if (isRage) {
          await eval(asyncFunction);
        } else {
          break;
        }
      }
      await sleep(0);
    }
  };

  const darumaTomaru = () => {
    isRage = false;
    stop();
  };
});
