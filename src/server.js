require("dotenv").config();
const Hapi = require("@hapi/hapi");
const ClientError = require("./exceptions/ClientError");

// Import Plugin Users
const users = require("./api/users");
const UsersService = require("./services/postgres/UsersService");
const UsersValidator = require("./validator/users");

const authentications = require("./api/authentications");
const TokenManager = require("./tokenize/TokenManager");
const AuthenticationsValidator = require("./validator/authentications");

const init = async () => {
  // 1. Instansiasi Service (Koneksi ke DB dimulai di sini)
  const usersService = new UsersService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });

  // 2. Registrasi Plugin Users
  await server.register([
    {
      plugin: users, // Plugin user yang lama
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    // INI YANG BARU HARUS ADA:
    {
      plugin: authentications,
      options: {
        authenticationsService: null, // Kita belum pake ini, kasih null dulu gpp
        usersService: usersService, // Wajib ada
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
  ]);

  // Error Handling Otomatis
  server.ext("onPreResponse", (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      // Error Client (Input salah, dsb)
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: "fail",
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }

      // Error Server (Database mati, kodingan error, dsb)
      if (!response.isServer) {
        return h.continue;
      }

      console.error("Server Error:", response.message); // Log error di terminal biar tau
      const newResponse = h.response({
        status: "error",
        message: "Maaf, terjadi kegagalan pada server kami.",
      });
      newResponse.code(500);
      return newResponse;
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
