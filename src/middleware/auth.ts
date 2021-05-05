import * as express from 'express';
import { verify } from 'jsonwebtoken';
import { Coach, ICoach } from '../models/coach.model';
import { IUser } from '../models/user.model';
import errorHandler from '../routes/error';
import { CoachMeRequest } from '../types/coach_me_request';
import { JWT_SECRET } from '../utils/config';

const auth = (
  req: CoachMeRequest,
  res: express.Response,
  next: express.NextFunction,
) => {
  let token = req.headers.authorization;
  if (!token)
    return errorHandler(res, 'Your access token is invalid.', 'invalidToken');
  token = token.replace('Bearer ', '');

  return verify(token, JWT_SECRET, (jwtErr, decoded) => {
    if (jwtErr) {
      return errorHandler(res, 'Your access token is invalid.', 'invalidToken');
    }

    // append decoded id onto request
    const decodedUser = decoded as IUser;

    if (!decodedUser._id)
      return errorHandler(res, 'Your access token is invalid.', 'invalidToken');

    return Coach.findOne({ _id: decodedUser._id, accessToken: token }).then((coach: ICoach | null) => {
      if (!coach) return errorHandler(res, 'Your access token is invalid.', 'invalidToken');

      req.coach = coach;

      return next();
    }).catch(() => errorHandler(res, 'Your access token is invalid.', 'invalidToken'));
  });
};

export default auth;
