const routes = (handler) => [
  {
    method: "GET",
    path: "/insights",
    handler: handler.getStudentInsightsHandler,
    options: {
      auth: "learning_jwt",
    },
  },
];

module.exports = routes;
