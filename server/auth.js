import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

export const verifyPassword = (password, passwordHash) =>
  bcrypt.compareSync(password, passwordHash);

export const createToken = (admin) =>
  jwt.sign(
    {
      sub: String(admin.id),
      username: admin.username,
    },
    config.jwtSecret,
    { expiresIn: `${config.sessionDays}d` }
  );

export const verifyToken = (token) => jwt.verify(token, config.jwtSecret);

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProduction,
  path: '/',
  maxAge: config.sessionDays * 24 * 60 * 60 * 1000,
});

export const setAuthCookie = (res, token) => {
  res.cookie(config.cookieName, token, getCookieOptions());
};

export const clearAuthCookie = (res) => {
  const options = getCookieOptions();
  delete options.maxAge;
  res.clearCookie(config.cookieName, options);
};
