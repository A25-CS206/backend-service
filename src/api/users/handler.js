class UsersHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postUserHandler = this.postUserHandler.bind(this);
    this.getUserByIdHandler = this.getUserByIdHandler.bind(this); // <--- Binding baru
  }

  async postUserHandler(request, h) {
    this._validator.validateUserPayload(request.payload);

    const { name, email, password } = request.payload;
    const userId = await this._service.addUser({ name, email, password });

    const response = h.response({
      status: "success",
      message: "User berhasil ditambahkan",
      data: {
        userId,
      },
    });
    response.code(201);
    return response;
  }

  // --- HANDLER BARU ---
  async getUserByIdHandler(request, h) {
    // Ambil ID dari token yang sudah dibuka oleh strategi 'learning_jwt'
    const { id } = request.auth.credentials;

    const user = await this._service.getUserById(id);

    return {
      status: "success",
      data: {
        user,
      },
    };
  }
}

module.exports = UsersHandler;
