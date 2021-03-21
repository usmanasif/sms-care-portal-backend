import express from 'express';
import { hash, compare } from 'bcrypt';
import { ObjectId } from 'mongodb';
import * as _ from 'lodash';
import { Coach } from '../models/coach.model';
import auth from '../middleware/auth';
import {
  generateAccessToken,
  generateRefreshToken,
  validateRefreshToken,
} from './coach.util';
import { Patient } from '../models/patient.model';
import { CoachMeRequest } from '../types/coach_me_request';
import wrapAsync from '../utils/asyncWrapper';
import { UnauthorizedError, ValidationError } from '../exceptions';

const router = express.Router();

const saltRounds = 10;

// create new coach
router.post('/signup', auth, wrapAsync(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const emailLower = email.toLowerCase();

  if (await Coach.findOne({ email: emailLower })) {
    throw new ValidationError('User already exists.');
  }

  const hashedPassword = await hash(password, saltRounds);

  const newCoach = new Coach({
    firstName,
    lastName,
    email: emailLower,
    password: hashedPassword,
  });
  
  await newCoach.save();

  res.status(200).json({ success: true });
}));

// login coach
router.post('/login', wrapAsync(async (req, res) => {
  const emailAdress = req.body.email.toLowerCase();
  const { password } = req.body;

  const coach = await Coach.findOne({ email: emailAdress });
  if (!coach) {
    throw new UnauthorizedError('Email or password is incorrect.');
  }

  const validCredentials = await compare(password, coach.password);

  if (!validCredentials) {
    throw new UnauthorizedError('Email or password is incorrect.');
  }

  const accessToken = await generateAccessToken(coach);
  const refreshToken = await generateRefreshToken(coach);

  return res.status(200).json({
    success: true,
    accessToken,
    refreshToken,
  });
}));

// refresh token
router.post('/refreshToken', wrapAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Missing refresh token.');
  }

  const coach = await validateRefreshToken(refreshToken);
  const accessToken = await generateAccessToken(coach);

  res.status(200).json({
    success: true,
    accessToken,
  });
}));

// get me
// protected route
router.get('/me', auth, wrapAsync(async (req: CoachMeRequest, res) => {
  const { userId } = req;

  const coach = await Coach.findById(new ObjectId(userId));

  if (!coach) {
    throw new ValidationError("User doesn't exist");
  }

  res.status(200).json({ success: true, data: _.omit(coach, ['password', 'refreshToken']) });
}));

router.get('/getPatients', auth, wrapAsync(async (req, res) => {
  const patients = await Patient.find();
  res.status(200).json(patients);
}));

router.get('/search', auth, wrapAsync(async (req, res) => {
  const { query } = req.query;

  const result = Coach.aggregate([
    { $project: { name: { $concat: ['$firstName', ' ', '$lastName'] } } },
    {
      $match: {
        name: {
          $regex: query,
          $options: 'i',
        },
      },
    },
  ]);

  res.status(200).json({
    coaches: result,
  });
}));

export default router;
