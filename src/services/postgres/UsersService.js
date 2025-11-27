const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const InvariantError = require("../../exceptions/InvariantError");
const AuthenticationError = require("../../exceptions/AuthenticationError");
const NotFoundError = require("../../exceptions/NotFoundError");

class UsersService {
  constructor() {
    if (process.env.DATABASE_URL) {
      this._pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
    } else {
      this._pool = new Pool();
    }
  }

  async addUser({ name, email, password, phone, city, imagePath }) {
    await this.verifyNewEmail(email);

    const id = `user-${nanoid(16)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: `INSERT INTO users 
             (id, display_name, email, password, phone, city, image_path, user_role, created_at, updated_at) 
             VALUES($1, $2, $3, $4, $5, $6, $7, 'developer', $8, $9) 
             RETURNING id`,
      values: [id, name, email, hashedPassword, phone, city, imagePath, createdAt, updatedAt],
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

  async getUserById(userId) {
    const query = {
      text: "SELECT id, display_name, email, phone, city, user_role FROM users WHERE id = $1",
      values: [userId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("User tidak ditemukan");
    }

    const user = result.rows[0];
    return {
      id: user.id,
      name: user.display_name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      role: user.user_role,
    };
  }
}

module.exports = UsersService;
