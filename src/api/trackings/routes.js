const routes = (handler) => [
  {
    method: "POST",
    path: "/trackings",
    handler: handler.postTrackingHandler,
    options: { auth: "learning_jwt" },
  },
  {
    method: "GET",
    path: "/trackings/me",
    handler: handler.getStudentActivitiesHandler,
    options: { auth: "learning_jwt" },
  },

  // DASHBOARD
  {
    method: "GET",
    path: "/dashboard",
    handler: handler.getDashboardStatisticsHandler,
    options: { auth: "learning_jwt" },
  },

  // MY COURSES (Ini yang akan menampilkan list journey user)
  {
    method: "GET",
    path: "/my-courses",
    handler: handler.getMyCoursesHandler,
    options: { auth: "learning_jwt" },
  },
];

module.exports = routes;
