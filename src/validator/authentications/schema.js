const Joi = require("joi");

const PostAuthenticationPayloadSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = { PostAuthenticationPayloadSchema };
