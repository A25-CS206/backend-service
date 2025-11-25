require("dotenv").config();
const Hapi = require("@hapi/hapi");
const Jwt = require("@hapi/jwt");
const ClientError = require("./exceptions/ClientError");

// --- IMPORT PLUGIN USERS ---
const users = require("./api/users");
const UsersService = require("./services/postgres/UsersService");
const UsersValidator = require("./validator/users");

// --- IMPORT PLUGIN AUTHENTICATIONS ---
const authentications = require("./api/authentications");
const TokenManager = require("./tokenize/TokenManager");
const AuthenticationsValidator = require("./validator/authentications");

// --- IMPORT PLUGIN JOURNEYS ---
const journeys = require("./api/journeys");
const JourneysService = require("./services/postgres/JourneysService");
const JourneysValidator = require("./validator/journeys");

// --- IMPORT PLUGIN TRACKINGS ---
const trackings = require("./api/trackings");
const TrackingsService = require("./services/postgres/TrackingsService");
const TrackingsValidator = require("./validator/trackings");

const init = async () => {
  // 1. INSTANSIASI SEMUA SERVICE
  const usersService = new UsersService();
  const journeysService = new JourneysService();
  const trackingsService = new TrackingsService();

  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.HOST || "0.0.0.0", // 0.0.0.0 wajib untuk Vercel/Render
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });

  // 2. REGISTRASI JWT STRATEGY
  await server.register([
    {
      plugin: Jwt,
    },
  ]);

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

  // 3. REGISTRASI PLUGIN INTERNAL
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
        usersService: usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: journeys,
      options: {
        service: journeysService,
        validator: JourneysValidator,
      },
    },
    {
      plugin: trackings,
      options: {
        service: trackingsService,
        validator: TrackingsValidator,
      },
    },
  ]);

  // 4. ERROR HANDLING
  server.ext("onPreResponse", (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: "fail",
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }

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

  // PENTING: Jangan di-start di sini, tapi return instance server-nya
  return server;
};

// Logika Start: Hanya jalankan server.start() jika file ini dieksekusi langsung (Local)
// Vercel TIDAK akan masuk ke blok if ini.
if (require.main === module) {
  init().then((server) => {
    server.start().then(() => {
      console.log(`Server berjalan pada ${server.info.uri}`);
    });
  });
}

// PENTING: Export fungsi init agar bisa dibaca oleh api/index.js
module.exports = init;
