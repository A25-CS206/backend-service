const Joi = require("joi");

const UsersPayloadSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().required(),
  city: Joi.string().required(),
  imagePath: Joi.string().allow(null, ""),
});

module.exports = { UsersPayloadSchema };
