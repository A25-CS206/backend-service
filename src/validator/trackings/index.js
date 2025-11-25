const { PostTrackingPayloadSchema } = require("./schema");
const InvariantError = require("../../exceptions/InvariantError");

const TrackingsValidator = {
  validatePostTrackingPayload: (payload) => {
    const validationResult = PostTrackingPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = TrackingsValidator;
