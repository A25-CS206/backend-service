const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const InvariantError = require("../../exceptions/InvariantError");

class UsersService {
  constructor() {
    this._pool = new Pool(); // Otomatis baca config database dari .env
  }

  async addUser({ name, email, password }) {
    // 1. Cek apakah email sudah terdaftar?
    await this.verifyNewEmail(email);

    // 2. Siapkan ID unik dan hash password
    const id = `user-${nanoid(16)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    // 3. Masukkan ke Database
    const query = {
      text: "INSERT INTO users VALUES($1, $2, $3, $4, DEFAULT, $5, $6) RETURNING id",
      values: [id, name, email, hashedPassword, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    // 4. Pastikan berhasil
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

    // 1. Cek apakah email ditemukan
    if (!result.rows.length) {
      throw new AuthenticationError("Kredensial yang Anda berikan salah");
    }

    const { id, password: hashedPassword, user_role } = result.rows[0];

    // 2. Bandingkan password input dengan hash di DB
    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      throw new AuthenticationError("Kredensial yang Anda berikan salah");
    }

    // 3. Kembalikan ID dan Role (untuk payload token)
    return { id, role: user_role };
  }
}

module.exports = UsersService;
