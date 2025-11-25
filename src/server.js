require("dotenv").config();
const Hapi = require("@hapi/hapi");
const Jwt = require("@hapi/jwt"); // <--- (1) Wajib Import ini
const ClientError = require("./exceptions/ClientError");

// Import Plugin Users
const users = require("./api/users");
const UsersService = require("./services/postgres/UsersService");
const UsersValidator = require("./validator/users");

// Import Plugin Authentications
const authentications = require("./api/authentications");
const TokenManager = require("./tokenize/TokenManager");
const AuthenticationsValidator = require("./validator/authentications");

const init = async () => {
  // 1. Instansiasi Service
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

  // ==========================================================
  // BAGIAN AUTHENTICATION STRATEGY (PENTING!)
  // ==========================================================

  // 2. Registrasi Plugin Eksternal JWT
  await server.register([
    {
      plugin: Jwt,
    },
  ]);

  // 3. Definisikan Strategi Auth 'learning_jwt'
  server.auth.strategy("learning_jwt", "jwt", {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => {
      return {
        isValid: true,
        credentials: {
          id: artifacts.decoded.payload.id,
          role: artifacts.decoded.payload.role,
        },
      };
    },
  });

  // ==========================================================
  // REGISTRASI PLUGIN INTERNAL
  // ==========================================================

  // 4. Daftarkan Plugin Users & Authentications
  await server.register([
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService: null,
        usersService: usersService, // Diperlukan untuk verifikasi password login
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
  ]);

  // ==========================================================
  // ERROR HANDLING
  // ==========================================================

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

      console.error("Server Error:", response.message);
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
