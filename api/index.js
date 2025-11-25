const init = require("../src/server"); // Mengambil fungsi init yang di-export di atas

module.exports = async (req, res) => {
  const server = await init(); // Membuat instance server
  await server.initialize(); // Menyiapkan server tanpa membuka port (listen)
  return server.listener(req, res); // Meneruskan request HTTP Vercel ke Hapi
};
