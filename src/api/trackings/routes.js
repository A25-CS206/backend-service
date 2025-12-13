const routes = (handler) => [
  // --- 1. FITUR LAMA (Tetap Dipertahankan) ---
  {
    method: "POST",
    path: "/trackings", // Untuk mencatat user membuka materi
    handler: handler.postTrackingHandler,
    options: {
      auth: "learning_jwt",
    },
  },
  {
    method: "GET",
    path: "/trackings/me", // Untuk melihat log history detail
    handler: handler.getStudentActivitiesHandler,
    options: {
      auth: "learning_jwt",
    },
  },

  // --- 2. FITUR BARU UNTUK NAUFAL (DASHBOARD) ---
  {
    method: "GET",
    path: "/dashboard", // Endpoint: http://localhost:5000/dashboard
    handler: handler.getDashboardStatisticsHandler,
    options: {
      auth: "learning_jwt", // Wajib login untuk tahu data user siapa
    },
  },

  // --- 3. FITUR BARU UNTUK NAUFAL (MY COURSES) ---
  {
    method: "GET",
    path: "/my-courses", // Endpoint: http://localhost:5000/my-courses
    handler: handler.getMyCoursesHandler,
    options: {
      auth: "learning_jwt",
    },
  },
];

module.exports = routes;
