const routes = (handler) => [
  {
    method: "GET",
    path: "/insights/me", // Endpoint untuk Dashboard
    handler: handler.getInsightHandler,
    options: {
      auth: "learning_jwt", // Wajib Login
    },
  },
];

module.exports = routes;
