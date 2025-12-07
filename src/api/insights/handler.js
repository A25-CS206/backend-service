class InsightsHandler {
  constructor(service) {
    this._service = service;

    // Binding method agar 'this' tetap mengarah ke instance class
    this.getInsightHandler = this.getInsightHandler.bind(this);
    this.getDashboardHandler = this.getDashboardHandler.bind(this);
  }

  // Handler untuk memicu prediksi AI (tombol "Analyze Me")
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

  // Handler untuk menampilkan Dashboard Utama (Saat halaman dimuat)
  async getDashboardHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const dashboardData = await this._service.getDashboardStats(userId);

    return {
      status: "success",
      data: {
        dashboard: dashboardData,
      },
    };
  }
}

module.exports = InsightsHandler;
