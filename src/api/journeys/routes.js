const routes = (handler) => [
  {
    method: "POST",
    path: "/journeys",
    handler: handler.postJourneyHandler,
    options: {
      auth: "learning_jwt", // <--- Wajib login untuk bikin kelas!
    },
  },
  {
    method: "GET",
    path: "/journeys",
    handler: handler.getJourneysHandler,
    // Tidak ada auth, berarti publik bisa lihat
  },
  {
    method: "GET",
    path: "/journeys/{id}",
    handler: handler.getJourneyByIdHandler,
    // Tidak ada auth, berarti publik bisa lihat
  },
];

module.exports = routes;
