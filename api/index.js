const init = require("../src/server");

module.exports = async (req, res) => {
  const server = await init();
  await server.initialize(); // Inisialisasi Hapi tanpa membuka port
  return server.listener(req, res); // Teruskan request HTTP ke listener Hapi
};
