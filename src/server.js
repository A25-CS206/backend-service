require("dotenv").config();
const Hapi = require("@hapi/hapi");
const Jwt = require("@hapi/jwt");
const { Pool } = require("pg"); // <--- WAJIB: Import Driver Postgres
const ClientError = require("./exceptions/ClientError");

// Import Plugins & Services
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

// >>> FITUR BARU <<<
const insights = require("./api/insights");
const InsightsService = require("./services/postgres/InsightsService");

const init = async () => {
  // 1. SETUP KONEKSI DATABASE (NEON)
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // WAJIB: Agar bisa konek ke Neon di Vercel
    },
  });

  // Tes koneksi database saat server nyala (Opsional, buat debug)
  pool
    .connect()
    .then(() => console.log("✅ Terhubung ke Neon DB"))
    .catch((e) => console.error("❌ Gagal konek DB:", e.message));

  // 2. INSTANSIASI SERVICE (Dependency Injection)
  // Kita masukkan 'pool' ke dalam kurung service
  const usersService = new UsersService(pool);
  const journeysService = new JourneysService(pool);
  const trackingsService = new TrackingsService(pool);
  const insightsService = new InsightsService(pool);

  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.HOST || "0.0.0.0",
    routes: {
      cors: {
        origin: ["*"], // Izinkan akses dari Frontend manapun
        headers: ["Accept", "Authorization", "Content-Type", "If-None-Match"],
        additionalHeaders: ["cache-control", "x-requested-with"],
      },
    },
  });

  await server.register([{ plugin: Jwt }]);

  server.auth.strategy("learning_jwt", "jwt", {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: { aud: false, iss: false, sub: false, maxAgeSec: process.env.ACCESS_TOKEN_AGE },
    validate: (artifacts) => ({
      isValid: true,
      credentials: { id: artifacts.decoded.payload.id, role: artifacts.decoded.payload.role },
    }),
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
        usersService, // Auth butuh UsersService buat cek password
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

  // Route Default (Cek Status Server)
  server.route({
    method: "GET",
    path: "/",
    handler: () => ({
      status: "online",
      message: "Backend API Learning System is Running! 🚀",
      version: "1.0.0",
    }),
  });

  // Error Handling Global
  server.ext("onPreResponse", (request, h) => {
    const { response } = request;
    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({ status: "fail", message: response.message });
        newResponse.code(response.statusCode);
        return newResponse;
      }
      if (!response.isServer) return h.continue;

      console.error("Server Error:", response); // Log error asli ke terminal/console Vercel
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
