const Joi = require("joi");

const UsersPayloadSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(), // Aturan: Password min 6 huruf
});

module.exports = { UsersPayloadSchema };
