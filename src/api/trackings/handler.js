class TrackingsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postTrackingHandler = this.postTrackingHandler.bind(this);
    this.getStudentActivitiesHandler = this.getStudentActivitiesHandler.bind(this);

    // Bind method baru
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

  // GET: Dashboard Overview (FIXED)
  async getDashboardStatisticsHandler(request) {
    const { id: userId } = request.auth.credentials;

    // ⚠️ PERBAIKAN DI SINI: Panggil nama method yang BARU di Service
    const data = await this._service.getDashboardOverview(userId);

    return {
      status: "success",
      data: data, // Langsung return data (strukturnya sudah rapi dari service)
    };
  }

  // GET: My Courses (FIXED)
  async getMyCoursesHandler(request) {
    const { id: userId } = request.auth.credentials;

    // Panggil method getMyCourses
    const data = await this._service.getMyCourses(userId);

    return {
      status: "success",
      data: { courses: data }, // Bungkus dalam object 'courses' jika perlu, atau langsung 'data'
    };
  }

  // GET: Riwayat Lama
  async getStudentActivitiesHandler(request) {
    const { id: userId } = request.auth.credentials;
    const activities = await this._service.getStudentActivities(userId);

    return {
      status: "success",
      data: { activities },
    };
  }
}

module.exports = TrackingsHandler;
