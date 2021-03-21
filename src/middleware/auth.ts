import { Response, NextFunction } from 'express';
import { verify, VerifyErrors } from 'jsonwebtoken';
import { UnauthorizedError } from '../exceptions';
import { IUser } from '../models/user.model';
import { CoachMeRequest } from '../types/coach_me_request';
import wrapAsync from '../utils/asyncWrapper';
import { JWT_SECRET } from '../utils/config';

function wrapTokenVerifivationCallback(verifyFunction: (err: VerifyErrors | null, decoded: object | undefined) => Promise<any>, next: NextFunction) {
  return function (err: VerifyErrors | null, decoded: object | undefined) {
    verifyFunction(err, decoded).catch(next);
  };
}

async function authMiddleware(req: CoachMeRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedError('Invalid access token');
  }
  const token = authHeader!.replace('Bearer ', '');

  verify(token, JWT_SECRET, wrapTokenVerifivationCallback(async (jwtErr, decoded) => {

    if (jwtErr) {
      throw new UnauthorizedError('Invalid access token');
    }
    // append decoded id onto request
    const decodedUser = decoded as IUser;

    if (!decodedUser || !decodedUser._id) {
      throw new UnauthorizedError('Invalid access token');
    }

    req.userId = decodedUser._id;

    next();

  }, next));
}

export default wrapAsync(authMiddleware);
