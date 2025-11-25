const Joi = require("joi");

const PostTrackingPayloadSchema = Joi.object({
  journeyId: Joi.string().required(),
  tutorialId: Joi.string().required(),
});

module.exports = { PostTrackingPayloadSchema };
