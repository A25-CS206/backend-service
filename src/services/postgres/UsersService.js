const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const InvariantError = require("../../exceptions/InvariantError");
const AuthenticationError = require("../../exceptions/AuthenticationError");
const NotFoundError = require("../../exceptions/NotFoundError"); // <--- Wajib ada

class UsersService {
  constructor() {
    this._pool = new Pool();
  }

  async addUser({ name, email, password }) {
    await this.verifyNewEmail(email);

    const id = `user-${nanoid(16)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: "INSERT INTO users VALUES($1, $2, $3, $4, DEFAULT, $5, $6) RETURNING id",
      values: [id, name, email, hashedPassword, createdAt, updatedAt],
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

  // --- METHOD BARU UNTUK FITUR /USERS/ME ---
  async getUserById(userId) {
    const query = {
      text: "SELECT id, display_name, email FROM users WHERE id = $1",
      values: [userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("User tidak ditemukan");
    }

    const user = result.rows[0];
    return {
      id: user.id,
      name: user.display_name, // Mapping dari display_name ke name
      email: user.email,
    };
  }
}

module.exports = UsersService;
