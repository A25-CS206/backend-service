class AuthenticationsHandler {
  constructor(authenticationsService, usersService, tokenManager, validator) {
    this._authenticationsService = authenticationsService; // Nanti dipake kalau ada fitur Refresh Token
    this._usersService = usersService;
    this._tokenManager = tokenManager;
    this._validator = validator;

    this.postAuthenticationHandler = this.postAuthenticationHandler.bind(this);
  }

  async postAuthenticationHandler(request, h) {
    // 1. Validasi input
    this._validator.validatePostAuthenticationPayload(request.payload);

    // 2. Cek kredensial (Email & Password benar?)
    const { email, password } = request.payload;
    const { id, role } = await this._usersService.verifyUserCredential(email, password);

    // 3. Buat Token Access
    const accessToken = this._tokenManager.generateAccessToken({ id, role });

    // 4. Kirim Token ke user
    const response = h.response({
      status: "success",
      message: "Authentication berhasil ditambahkan",
      data: {
        accessToken,
      },
    });
    response.code(201);
    return response;
  }
}

module.exports = AuthenticationsHandler;
