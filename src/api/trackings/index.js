const TrackingsHandler = require("./handler");
const routes = require("./routes");

module.exports = {
  name: "trackings",
  version: "1.0.0",
  register: async (server, { service, validator }) => {
    const trackingsHandler = new TrackingsHandler(service, validator);
    server.route(routes(trackingsHandler));
  },
};
