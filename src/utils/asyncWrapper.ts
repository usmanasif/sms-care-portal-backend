import { Request, Response, NextFunction } from 'express';

export default function wrapAsync(callback: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return function (req: Request, res: Response, next: NextFunction) {
        callback(req, res, next).catch(next);
    }
}