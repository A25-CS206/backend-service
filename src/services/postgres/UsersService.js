const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const InvariantError = require("../../exceptions/InvariantError");
const AuthenticationError = require("../../exceptions/AuthenticationError");
const NotFoundError = require("../../exceptions/NotFoundError");

class UsersService {
  constructor() {
    // Logic connection string untuk Vercel/Neon
    if (process.env.DATABASE_URL) {
      this._pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
    } else {
      this._pool = new Pool();
    }
  }

  // Method untuk registrasi user baru (dengan data lengkap)
  async addUser(payload) {
    await this.verifyNewEmail(payload.email);

    const id = `user-${nanoid(16)}`;
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    // Destructure payload lengkap, set default untuk field yang tidak wajib diisi
    const {
      name,
      email,
      phone,
      city,
      imagePath,
      customCity,
      tz,
      rememberToken = null,
      unsubscribeLink = null,
      verifiedAt = null,
      ama = 0,
      phoneVerificationStatus = 0,
      phoneVerifiedWith = null,
      verifiedCertificateName = null,
      verifiedIdentityDocument = null,
    } = payload;

    // Query INSERT yang memasukkan SEMUA kolom sesuai skema lengkap (20 kolom + 3 kolom default)
    const query = {
      text: `INSERT INTO users (
        id, display_name, name, email, password, phone, city, image_path, user_role, 
        custom_city, tz, remember_token, unsubscribe_link, verified_at, ama, 
        phone_verification_status, phone_verified_with, verified_certificate_name, verified_identity_document,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, 'developer', 
        $9, $10, $11, $12, $13, $14, 
        $15, $16, $17, $18, $19, $20
      ) RETURNING id`,
      values: [
        id,
        name,
        name,
        email,
        hashedPassword,
        phone,
        city,
        imagePath,
        customCity,
        tz,
        rememberToken,
        unsubscribeLink,
        verifiedAt,
        ama,
        phoneVerificationStatus,
        phoneVerifiedWith,
        verifiedCertificateName,
        verifiedIdentityDocument,
        createdAt,
        updatedAt,
      ],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError("User gagal ditambahkan");
    }

    return result.rows[0].id;
  }

  async verifyNewEmail(email) {
    const query = {
      text: "SELECT email FROM users WHERE email = $1",
      values: [email],
    };
    const result = await this._pool.query(query);
    if (result.rows.length > 0) {
      throw new InvariantError("Gagal menambahkan user. Email sudah digunakan.");
    }
  }

  async verifyUserCredential(email, password) {
    const query = {
      text: "SELECT id, password, user_role FROM users WHERE email = $1",
      values: [email],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new AuthenticationError("Kredensial yang Anda berikan salah");
    }

    const { id, password: hashedPassword, user_role } = result.rows[0];
    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      throw new AuthenticationError("Kredensial yang Anda berikan salah");
    }

    return { id, role: user_role };
  }

  // Method untuk mendapatkan data user berdasarkan ID
  async getUserById(userId) {
    // SELECT kolom yang relevan untuk dikembalikan ke API
    const query = {
      text: "SELECT id, display_name, name, email, phone, city, user_role, image_path FROM users WHERE id = $1",
      values: [userId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("User tidak ditemukan");
    }

    const user = result.rows[0];
    return {
      id: user.id,
      name: user.name, // Nama lengkap
      displayName: user.display_name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      role: user.user_role,
      image_path: user.image_path,
    };
  }
}

module.exports = UsersService;
