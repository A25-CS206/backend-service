const AuthorizationError = require("../../exceptions/AuthorizationError"); // <-- Diperlukan untuk cek role

class JourneysHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postJourneyHandler = this.postJourneyHandler.bind(this);
    this.getJourneysHandler = this.getJourneysHandler.bind(this);
    this.getJourneyByIdHandler = this.getJourneyByIdHandler.bind(this);
  }

  async postJourneyHandler(request, h) {
    // 1. CEK ROLE (Otorisasi)
    const { role } = request.auth.credentials;

    // Hanya admin atau instructor yang boleh buat kelas
    if (role !== "admin" && role !== "instructor") {
      throw new AuthorizationError("Anda tidak berhak membuat kelas! Hanya Admin/Instruktur.");
    }

    // 2. Validasi Input
    this._validator.validateJourneyPayload(request.payload);

    // 3. Lanjut proses simpan...
    const { name, summary, difficulty, point, xp, description, imagePath, hoursToStudy } =
      request.payload;
    const { id: instructorId } = request.auth.credentials;

    const journeyId = await this._service.addJourney({
      name,
      summary,
      difficulty,
      instructorId,
      point,
      xp,
      description,
      imagePath,
      hoursToStudy,
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
