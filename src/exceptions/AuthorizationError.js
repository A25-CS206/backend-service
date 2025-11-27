const ClientError = require("./ClientError");

class AuthorizationError extends ClientError {
  constructor(message) {
    super(message, 403); // 403 Forbidden
    this.name = "AuthorizationError";
  }
}

module.exports = AuthorizationError;
