const JourneysHandler = require("./handler");
const routes = require("./routes");

module.exports = {
  name: "journeys",
  version: "1.0.0",
  register: async (server, { service, validator }) => {
    const journeysHandler = new JourneysHandler(service, validator);
    server.route(routes(journeysHandler));
  },
};
