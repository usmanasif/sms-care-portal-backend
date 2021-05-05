import express from 'express';
import { hash, compare } from 'bcrypt';
import { Coach, ICoach } from '../models/coach.model';
import auth from '../middleware/auth';
import errorHandler from './error';
import {
  generateAccessToken,
  generateRefreshToken,
  validateRefreshToken,
} from './coach.util';
import { Patient } from '../models/patient.model';
import { CoachMeRequest } from '../types/coach_me_request';

const router = express.Router();

const saltRounds = 10;

// create new coach
router.post('/signup', auth, async (req, res) => {
  const { firstName } = req.body;
  const { lastName } = req.body;
  const emailRaw = req.body.email;
  const emailLower = emailRaw.toLowerCase();
  const { password } = req.body;

  if (await Coach.findOne({ email: emailLower })) {
    return errorHandler(res, 'User already exists.');
  }

  // hash + salt password
  return hash(password, saltRounds, (err, hashedPassword) => {
    if (err) {
      return errorHandler(res, err.message);
    }
    const newCoach = new Coach({
      firstName,
      lastName,
      email: emailLower,
      password: hashedPassword,
    });
    return newCoach
      .save()
      .then(() => res.status(200).json({ success: true }))
      .catch((e) => errorHandler(res, e.message));
  });
});

// login coach
router.post('/login', async (req, res) => {
  const emailAdress = req.body.email.toLowerCase();
  const { password } = req.body;

  const coach = await Coach.findOne({ email: emailAdress });
  if (!coach) return errorHandler(res, 'Email or password is incorrect.');

  if (await compare(password, coach.password)) {
    const accessToken = generateAccessToken(coach._id);
    const refreshToken = generateRefreshToken();

    coach.accessToken = accessToken;
    coach.refreshToken = refreshToken;

    const tokens = await Promise.all([accessToken, refreshToken, coach.save()]);
    return res.status(200).json({
      success: true,
      accessToken: tokens[0],
      refreshToken: tokens[1],
    });
  }
  // wrong password
  return errorHandler(res, 'Email or password is incorrect.');
});

// refresh token
router.post('/refreshToken', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return errorHandler(res, 'No token provided.');
  }

  return validateRefreshToken(refreshToken)
    .then((coach: ICoach) => {
      // eslint-disable-next-line no-param-reassign
      coach.accessToken = generateAccessToken(coach._id);
      return coach.save();
    })
    .then(({ accessToken }: ICoach) => {
      res.status(200).json({
        success: true,
        accessToken,
      });
    })
    .catch((err: { code: string; message: string }) => {
      if (err.code) {
        return errorHandler(res, err.message, err.code);
      }
      return errorHandler(res, err.message);
    });
});

// get me
// protected route
router.get('/me', auth, (req: CoachMeRequest, res) => {
  const { _id: id, firstName, lastName, email } = req.coach as ICoach;

  return res.status(200).json({ success: true, data: {
    _id: id,
    firstName,
    lastName,
    email
  } });
});

router.get('/getPatients', auth, (req, res) => {
  return Patient.find().then((patients) => {
    return res.status(200).json(patients);
  });
});

router.get('/search', auth, async (req, res) => {
  const { query } = req.query;
  Coach.aggregate([
    { $project: { name: { $concat: ['$firstName', ' ', '$lastName'] } } },
    {
      $match: {
        name: {
          $regex: query,
          $options: 'i',
        },
      },
    },
  ]).exec((err, result) => {
    return res.status(200).json({
      coaches: result,
    });
  });
});

router.delete('/logout', auth, async (req: CoachMeRequest, res) => {
  try {
    const coach = req.coach as ICoach;

    coach.refreshToken = '';
    coach.accessToken = '';

    await coach.save();

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({
      success: false,
      code: 'serverError',
      message: 'something went wrong',
    });
  }
});

export default router;
