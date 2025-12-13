const routes = (handler) => [
  {
    method: "GET",
    path: "/dashboard",
    handler: handler.getDashboardHandler,
    options: { auth: "learning_jwt" },
  },
  {
    method: "GET",
    path: "/insights/me",
    handler: handler.getInsightsHandler,
    options: { auth: "learning_jwt" },
  },
];
module.exports = routes;
