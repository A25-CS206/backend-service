const init = require("../src/server");

let server;

module.exports = async (req, res) => {
  if (!server) {
    server = await init();
    await server.initialize();
  }

  return server.listener.emit("request", req, res);
};
