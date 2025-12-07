const routes = (handler) => [
  {
    method: "GET",
    path: "/insights/me",
    handler: handler.getInsightHandler,
    options: {
      auth: "learning_jwt", // Wajib Login
    },
  },
  {
    method: "GET",
    path: "/dashboard", // Endpoint Baru untuk Dashboard
    handler: handler.getDashboardHandler,
    options: {
      auth: "learning_jwt", // Wajib Login
    },
  },
];

module.exports = routes;
