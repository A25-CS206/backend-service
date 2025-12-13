const routes = (handler) => [
  {
    method: "POST",
    path: "/journeys",
    handler: handler.postJourneyHandler,
    options: { auth: "learning_jwt" },
  },
  { method: "GET", path: "/journeys", handler: handler.getJourneysHandler },
  {
    method: "GET",
    path: "/journeys/my-courses",
    handler: handler.getMyCoursesHandler,
    options: { auth: "learning_jwt" },
  },
  { method: "GET", path: "/journeys/{id}", handler: handler.getJourneyByIdHandler },
];
module.exports = routes;
