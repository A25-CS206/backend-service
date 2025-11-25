const routes = (handler) => [
  {
    method: "POST",
    path: "/trackings",
    handler: handler.postTrackingHandler,
    options: {
      auth: "learning_jwt", // Wajib Login
    },
  },
  {
    method: "GET",
    path: "/trackings/me",
    handler: handler.getStudentActivitiesHandler,
    options: {
      auth: "learning_jwt", // Wajib Login
    },
  },
];

module.exports = routes;
