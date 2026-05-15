import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

export const authService = {
  async register(input: { email: string; password: string; name: string }) {
    const email = input.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw ApiError.badRequest("Email already registered");

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: { email, name: input.name.trim(), passwordHash },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const token = this.signToken(user.id, user.email);
    return { user, token };
  },

  async login(input: { email: string; password: string }) {
    const email = input.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw ApiError.unauthorized("Invalid credentials");

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw ApiError.unauthorized("Invalid credentials");

    const token = this.signToken(user.id, user.email);
    return {
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      token,
    };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) throw ApiError.notFound("User not found");
    return user;
  },

  signToken(sub: string, email: string) {
    return jwt.sign({ sub, email }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  },
};
