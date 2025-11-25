class TrackingsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postTrackingHandler = this.postTrackingHandler.bind(this);
    this.getStudentActivitiesHandler = this.getStudentActivitiesHandler.bind(this);
  }

  // Endpoint untuk mencatat aktivitas (POST)
  async postTrackingHandler(request, h) {
    this._validator.validatePostTrackingPayload(request.payload);

    const { journeyId, tutorialId } = request.payload;
    const { id: userId } = request.auth.credentials; // Ambil ID dari Token

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

  // Endpoint untuk melihat riwayat belajar sendiri (GET)
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
