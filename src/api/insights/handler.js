class InsightsHandler {
  constructor(service) {
    this._service = service;

    this.getStudentInsightsHandler = this.getStudentInsightsHandler.bind(this);
  }

  async getStudentInsightsHandler(request) {
    const { id: userId } = request.auth.credentials;

    // ⚠️ PERBAIKAN DI SINI: Panggil nama method yang BARU di Service
    const data = await this._service.getLearningInsights(userId);

    return {
      status: "success",
      data: data, // Data langsung dikirim
    };
  }
}

module.exports = InsightsHandler;
