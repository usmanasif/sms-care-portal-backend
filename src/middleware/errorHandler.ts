/* eslint-disable @typescript-eslint/no-unused-vars */

import {NextFunction, Request, Response} from 'express';
import {ResourceNotFoundError, UnauthorizedError, ValidationError} from '../exceptions';

export default function errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  if (error instanceof ResourceNotFoundError) {
    res.status(404).json({
      message: error.message
    });
  } else if (error instanceof ValidationError) {
    res.status(400);
    res.json({
      message: error.message
    });
  } else if (error instanceof UnauthorizedError) {
    res.status(401);
    res.json({
      message: error.message
    });
  } else {
    res.status(500);
    res.json({
      message: error.message
    });
  }
} 