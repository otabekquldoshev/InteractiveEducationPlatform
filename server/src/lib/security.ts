import crypto from "node:crypto"
import jwt, { type SignOptions } from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { config } from "../config.js"

export type TokenUser = { sub: string; role: "STUDENT" | "ADMIN" }

export const hashPassword = (password: string) => bcrypt.hash(password, 12)
export const verifyPassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash)
export const randomToken = () => crypto.randomBytes(48).toString("base64url")
export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex")

export function signAccessToken(payload: TokenUser) {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
    issuer: "eduaccess-api",
    audience: "eduaccess-web",
  })
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, config.JWT_SECRET, {
    issuer: "eduaccess-api",
    audience: "eduaccess-web",
  }) as TokenUser
}
