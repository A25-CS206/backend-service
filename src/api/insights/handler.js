class InsightsHandler {
  constructor(service) {
    this._service = service;
    this.getDashboardHandler = this.getDashboardHandler.bind(this);
    this.getInsightsHandler = this.getInsightsHandler.bind(this);
  }

  async getDashboardHandler(request) {
    const { id } = request.auth.credentials;
    const data = await this._service.getDashboardStats(id);
    return { status: "success", data };
  }

  async getInsightsHandler(request) {
    const { id } = request.auth.credentials;
    const data = await this._service.getDeepInsights(id);
    return { status: "success", data };
  }
}
module.exports = InsightsHandler;
