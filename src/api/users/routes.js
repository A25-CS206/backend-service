const routes = (handler) => [
  {
    method: "POST",
    path: "/users",
    handler: handler.postUserHandler,
  },
  // --- ROUTE BARU ---
  {
    method: "GET",
    path: "/users/me",
    handler: handler.getUserByIdHandler,
    options: {
      auth: "learning_jwt", // <--- Pintu ini dikunci, harus bawa token!
    },
  },
];

module.exports = routes;
