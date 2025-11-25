class JourneysHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postJourneyHandler = this.postJourneyHandler.bind(this);
    this.getJourneysHandler = this.getJourneysHandler.bind(this);
    this.getJourneyByIdHandler = this.getJourneyByIdHandler.bind(this);
  }

  async postJourneyHandler(request, h) {
    // 1. Validasi Input
    this._validator.validateJourneyPayload(request.payload);

    // 2. Ambil ID User yang sedang login (Otomatis jadi instruktur)
    const { id: instructorId } = request.auth.credentials;
    const { name, summary, difficulty } = request.payload;

    // 3. Panggil Service
    const journeyId = await this._service.addJourney({
      name,
      summary,
      difficulty,
      instructorId,
    });

    const response = h.response({
      status: "success",
      message: "Kelas berhasil ditambahkan",
      data: { journeyId },
    });
    response.code(201);
    return response;
  }

  async getJourneysHandler() {
    const journeys = await this._service.getJourneys();
    return {
      status: "success",
      data: { journeys },
    };
  }

  async getJourneyByIdHandler(request) {
    const { id } = request.params;
    const journey = await this._service.getJourneyById(id);
    return {
      status: "success",
      data: { journey },
    };
  }
}

module.exports = JourneysHandler;
