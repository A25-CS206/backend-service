const Joi = require("joi");

const JourneysPayloadSchema = Joi.object({
  name: Joi.string().required(),
  summary: Joi.string().required(),
  difficulty: Joi.string().valid("beginner", "intermediate", "advanced").required(),
});

module.exports = { JourneysPayloadSchema };
