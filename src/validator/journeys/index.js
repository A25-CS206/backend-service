const { JourneysPayloadSchema } = require("./schema");
const InvariantError = require("../../exceptions/InvariantError");

const JourneysValidator = {
  validateJourneyPayload: (payload) => {
    const validationResult = JourneysPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = JourneysValidator;
