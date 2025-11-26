const init = require("../src/server"); // Pastikan path ini benar

module.exports = async (req, res) => {
  const server = await init(); // Memanggil fungsi init yang diexport tadi
  await server.initialize();
  return server.listener.emit("request", req, res);
};
