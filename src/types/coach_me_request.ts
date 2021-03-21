import {Request} from 'express';

export interface CoachMeRequest extends Request {
  userId?: string;
}

// export type CoachMeRequest = express.Request & {
//   userId?: string;
// };
