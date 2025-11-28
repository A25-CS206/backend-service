class InsightsHandler {
  constructor(service) {
    this._service = service;
    this.getInsightHandler = this.getInsightHandler.bind(this);
  }

  async getInsightHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const insight = await this._service.generateStudentInsight(userId);

    return {
      status: "success",
      data: {
        insight,
      },
    };
  }
}

module.exports = InsightsHandler;
