import express from 'express';
import { ICoach } from '../models/coach.model';

export type CoachMeRequest = express.Request & {
  coach?: ICoach;
};
