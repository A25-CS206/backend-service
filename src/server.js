require("dotenv").config();
const Hapi = require("@hapi/hapi");
const Jwt = require("@hapi/jwt");
const ClientError = require("./exceptions/ClientError");

// Import Plugin
const users = require("./api/users");
const UsersService = require("./services/postgres/UsersService");
const UsersValidator = require("./validator/users");

const authentications = require("./api/authentications");
const TokenManager = require("./tokenize/TokenManager");
const AuthenticationsValidator = require("./validator/authentications");

const journeys = require("./api/journeys");
const JourneysService = require("./services/postgres/JourneysService");
const JourneysValidator = require("./validator/journeys");

const trackings = require("./api/trackings");
const TrackingsService = require("./services/postgres/TrackingsService");
const TrackingsValidator = require("./validator/trackings");

// >>> START: INTEGRASI PLUGIN INSIGHTS BARU <<<
const insights = require("./api/insights");
const InsightsService = require("./services/postgres/InsightsService");
// >>> END: INTEGRASI PLUGIN INSIGHTS BARU <<<

const init = async () => {
  const usersService = new UsersService();
  const journeysService = new JourneysService();
  const trackingsService = new TrackingsService();

  // >>> START: INSTANSIASI INSIGHTS SERVICE <<<
  const insightsService = new InsightsService();
  // >>> END: INSTANSIASI INSIGHTS SERVICE <<<

  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.HOST || "0.0.0.0",
    routes: {
      cors: {
        origin: ["*"], // 1. Izinkan semua domain (Naufal) masuk

        // 2. Izinkan Header Authorization (Token yang dibawa Naufal)
        headers: ["Accept", "Authorization", "Content-Type", "If-None-Match"],

        // 3. Tambahan header biar Browser ga rewel (Sesuai request Naufal)
        additionalHeaders: [
          "cache-control",
          "x-requested-with",
          "access-control-request-headers",
          "access-control-request-method",
        ],
      },
    },
  });

  await server.register([{ plugin: Jwt }]);

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

  await server.register([
    {
      plugin: users,
      options: { service: usersService, validator: UsersValidator },
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
      options: { service: journeysService, validator: JourneysValidator },
    },
    {
      plugin: trackings,
      options: { service: trackingsService, validator: TrackingsValidator },
    },
    {
      plugin: insights,
      options: { service: insightsService },
    },
  ]);

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

  return server;
};

if (require.main === module) {
  init().then((server) => {
    server.start().then(() => {
      console.log(`Server berjalan pada ${server.info.uri}`);
    });
  });
}

module.exports = init;
