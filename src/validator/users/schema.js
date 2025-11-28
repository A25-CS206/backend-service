const Joi = require("joi");

const UsersPayloadSchema = Joi.object({
  // Wajib (untuk Login)
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),

  // Wajib/Opsional Tambahan
  phone: Joi.string().optional().allow(null, ""),
  city: Joi.string().optional().allow(null, ""),
  imagePath: Joi.string().optional().allow(null, ""),

  // Kolom Tambahan dari CSV (Semua dianggap opsional untuk API Register)
  rememberToken: Joi.string().optional().allow(null, ""),
  customCity: Joi.string().optional().allow(null, ""),
  unsubscribeLink: Joi.string().optional().allow(null, ""),
  tz: Joi.string().optional().allow(null, ""),
  verifiedAt: Joi.string().optional().allow(null, ""),
  ama: Joi.number().integer().optional(),
  phoneVerificationStatus: Joi.number().integer().optional(),
  phoneVerifiedWith: Joi.string().optional().allow(null, ""),
  verifiedCertificateName: Joi.string().optional().allow(null, ""),
  verifiedIdentityDocument: Joi.string().optional().allow(null, ""),
});

module.exports = { UsersPayloadSchema };
