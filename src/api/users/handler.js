class UsersHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    // Binding agar 'this' tidak hilang saat dipanggil router
    this.postUserHandler = this.postUserHandler.bind(this);
  }

  async postUserHandler(request, h) {
    // 1. Validasi data kiriman user (cegah data kosong/asal)
    this._validator.validateUserPayload(request.payload);

    // 2. Panggil Service untuk simpan ke Database
    const { name, email, password } = request.payload;
    const userId = await this._service.addUser({ name, email, password });

    // 3. Kembalikan respon sukses (201 Created)
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
}

module.exports = UsersHandler;
