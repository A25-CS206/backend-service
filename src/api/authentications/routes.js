const routes = (handler) => [
  {
    method: "POST",
    path: "/authentications", // <--- Pastikan ada 's' nya, bukan authentication
    handler: handler.postAuthenticationHandler,
  },
];

module.exports = routes;
