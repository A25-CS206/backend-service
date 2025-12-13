class TrackingsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    // Bind method lama
    this.postTrackingHandler = this.postTrackingHandler.bind(this);
    this.getStudentActivitiesHandler = this.getStudentActivitiesHandler.bind(this);

    // Bind method BARU (Dashboard & My Courses)
    this.getDashboardStatisticsHandler = this.getDashboardStatisticsHandler.bind(this);
    this.getMyCoursesHandler = this.getMyCoursesHandler.bind(this);
  }

  // POST: Catat Aktivitas
  async postTrackingHandler(request, h) {
    this._validator.validatePostTrackingPayload(request.payload);

    const { journeyId, tutorialId } = request.payload;
    const { id: userId } = request.auth.credentials;

    const trackingId = await this._service.logActivity({
      journeyId,
      tutorialId,
      userId,
    });

    const response = h.response({
      status: "success",
      message: "Aktivitas berhasil dicatat",
      data: { trackingId },
    });
    response.code(201);
    return response;
  }

  // GET: Riwayat Detail (Log Activity)
  async getStudentActivitiesHandler(request) {
    const { id: userId } = request.auth.credentials;
    const activities = await this._service.getStudentActivities(userId);

    return {
      status: "success",
      data: { activities },
    };
  }

  // --- ENDPOINT BARU UNTUK NAUFAL ---

  // GET: Dashboard Stats (Total Jam, Trend, dll)
  async getDashboardStatisticsHandler(request) {
    const { id: userId } = request.auth.credentials;

    // Panggil service getDashboardStatistics
    const stats = await this._service.getDashboardStatistics(userId);

    return {
      status: "success",
      data: { ...stats }, // Spread object biar langsung jadi root data
    };
  }

  // GET: My Courses (Completed / In Progress)
  async getMyCoursesHandler(request) {
    const { id: userId } = request.auth.credentials;

    // Panggil service getMyCourses
    const courses = await this._service.getMyCourses(userId);

    return {
      status: "success",
      data: { courses },
    };
  }
}

module.exports = TrackingsHandler;
