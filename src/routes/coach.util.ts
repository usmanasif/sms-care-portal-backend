import { sign, verify } from 'jsonwebtoken';
import * as _ from 'lodash';
import { Coach, ICoach } from '../models/coach.model';
import { JWT_SECRET } from '../utils/config';
import { UnauthorizedError } from '../exceptions';

async function generateAccessToken(coach: ICoach) {
  return sign(_.omit(coach.toObject(), 'password'), JWT_SECRET, {
    expiresIn: '5 m', // for testing purposes
  });
}

async function generateRefreshToken(coach: ICoach) {
  const refreshToken = sign({ type: 'refresh' }, JWT_SECRET, {
    expiresIn: '9999 years',
  });

  await Coach.findOneAndUpdate({ email: coach.email }, { refreshToken });

  return refreshToken;
}

async function validateRefreshToken(refreshToken: string) {

  try {
    verify(refreshToken, JWT_SECRET);
  } catch (error) {
    throw new UnauthorizedError('Expired refresh token.');
  }

  const coach = await Coach.findOne({ refreshToken });

  if (!coach) {
    throw new UnauthorizedError('Invalid refresh token.');
  }

  return coach;
}

export { generateAccessToken, generateRefreshToken, validateRefreshToken };
