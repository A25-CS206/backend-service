const Jwt = require("@hapi/jwt");
const InvariantError = require("../exceptions/InvariantError");

const TokenManager = {
  generateAccessToken: (payload) => {
    return Jwt.token.generate(payload, process.env.ACCESS_TOKEN_KEY);
  },
  verifyAccessToken: (accessToken) => {
    try {
      const artifacts = Jwt.token.decode(accessToken);
      Jwt.token.verifySignature(artifacts, process.env.ACCESS_TOKEN_KEY);
      const { payload } = artifacts.decoded;
      return payload;
    } catch (error) {
      throw new InvariantError("Access Token tidak valid");
    }
  },
};

module.exports = TokenManager;
