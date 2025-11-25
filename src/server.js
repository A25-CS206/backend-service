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

// --- IMPORT PLUGIN TRACKINGS (BARU) ---
const trackings = require("./api/trackings");
const TrackingsService = require("./services/postgres/TrackingsService");
const TrackingsValidator = require("./validator/trackings");

const init = async () => {
  // 1. INSTANSIASI SEMUA SERVICE (Koneksi Database)
  const usersService = new UsersService();
  const journeysService = new JourneysService();
  const trackingsService = new TrackingsService(); // <--- Service Baru

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
  // KONFIGURASI JWT STRATEGY
  // ==========================================================

  // Registrasi plugin eksternal @hapi/jwt
  await server.register([
    {
      plugin: Jwt,
    },
  ]);

  // Definisikan Strategi Auth 'learning_jwt'
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

  await server.register([
    // 1. Plugin Users
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    // 2. Plugin Authentications
    {
      plugin: authentications,
      options: {
        authenticationsService: null,
        usersService: usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    // 3. Plugin Journeys
    {
      plugin: journeys,
      options: {
        service: journeysService,
        validator: JourneysValidator,
      },
    },
    // 4. Plugin Trackings (BARU)
    {
      plugin: trackings,
      options: {
        service: trackingsService,
        validator: TrackingsValidator,
      },
    },
  ]);

  // ==========================================================
  // ERROR HANDLING GLOBAL
  // ==========================================================

  server.ext("onPreResponse", (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      // Penanganan Client Error (400, 401, 404 buatan kita)
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: "fail",
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }

      // Penanganan Server Error (500)
      if (!response.isServer) {
        return h.continue;
      }

      // Log error di terminal untuk debugging
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
