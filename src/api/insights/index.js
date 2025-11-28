const InsightsHandler = require("./handler");
const routes = require("./routes");

module.exports = {
  name: "insights",
  version: "1.0.0",
  register: async (server, { service }) => {
    const insightsHandler = new InsightsHandler(service);
    server.route(routes(insightsHandler));
  },
};
