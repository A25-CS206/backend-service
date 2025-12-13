class InsightsHandler {
  constructor(service) {
    this._service = service;

    this.getStudentInsightsHandler = this.getStudentInsightsHandler.bind(this);
  }

  async getStudentInsightsHandler(request) {
    const { id: userId } = request.auth.credentials;

    // Memanggil logic cerdas dari service (AI/ML logic ada di sini nanti)
    const insights = await this._service.getStudentInsights(userId);

    return {
      status: "success",
      data: insights, // Langsung return object data
    };
  }
}

module.exports = InsightsHandler;
