/* eslint-disable no-shadow */
import express from 'express';
import { ObjectId } from 'mongodb';
import { ValidationError } from '../exceptions';
import auth from '../middleware/auth';
import { Message } from '../models/message.model';
import { MessageTemplate } from '../models/messageTemplate.model';
import { Outcome } from '../models/outcome.model';
import { checkPatientExist, Patient } from '../models/patient.model';
import wrapAsync from '../utils/asyncWrapper';

import initializeScheduler from '../utils/scheduling';
import { validateLanguage, validateMongoId, validatePhoneNumber } from '../validators';

const cron = require('node-cron');

const router = express.Router();
initializeScheduler();

// run messages every day at midnight PST
cron.schedule(
  '0 0 5 * * *',
  async () => {
    console.log('Running batch of scheduled messages');

    const patients = await Patient.find();
    const messageTemplates = await MessageTemplate.find({ type: 'Initial' });

    patients.forEach((patient) => {
      if (patient.enabled) {
        const messages = messageTemplates.filter(
          (template) =>
            template.language.toLowerCase() ===
            patient.language.toLowerCase(),
        );
        if (messages.length < 1) {
          console.log(
            'Unable to find message appropriate for member = ',
            patient._id,
          );
          return;
        }
        const randomVal = Math.floor(Math.random() * messages.length);
        const message = messages[randomVal].text;
        const date = new Date();
        date.setMinutes(date.getMinutes() + 1);
        const newMessage = new Message({
          patientID: new ObjectId(patient._id),
          phoneNumber: patient.phoneNumber,
          date,
          message,
          sender: 'BOT',
          sent: false,
        });

        newMessage.save();
      }
    });
  },
  {
    scheduled: true,
    timezone: 'America/Los_Angeles',
  },
);

router.post('/newMessage', auth, wrapAsync(async (req, res) => {

  const {phoneNumber, patientID, sender, date} = req.body;

  // validate phone number
  validatePhoneNumber(phoneNumber);

  if (!patientID || !validateMongoId(patientID) || !checkPatientExist(patientID)) {
    throw new ValidationError('Invalid patient ID');
  }

  if (sender) {
    throw new ValidationError('Invalid sender');
  }

  // Need to add format check
  if (!date) {
    throw new ValidationError('Invalid date');
  }

  const newMessage = new Message({
    phoneNumber: req.body.phoneNumber,
    patientID: req.body.patientID,
    message: req.body.message,
    sender: req.body.sender,
    date: req.body.date,
  });

  await newMessage.save();

  res.status(200).json({
    success: true,
  });
}));

router.post('/newOutcome', auth, wrapAsync(async (req, res) => {

  const { phoneNumber, patientID, language } = req.body;

  validatePhoneNumber(phoneNumber);

  if (!patientID || !validateMongoId(patientID) || !checkPatientExist(patientID)) {
    throw new ValidationError('Invalid patient ID');
  }

  validateLanguage(language);

  const newOutcome = new Outcome({
    patientID: req.body.patientID,
    phoneNumber: req.body.phoneNumber,
    date: req.body.date,
    response: req.body.response,
    value: req.body.value,
    alertType: req.body.alertType,
  });

  await Patient.findOneAndUpdate(
    { _id: req.body.patientID },
    { $inc: { responseCount: 1 } },
  );

  await newOutcome.save();

  res.status(200).json({
    success: true,
  });
}));

router.post('/scheduledMessage', auth, wrapAsync(async (req, res) => {

  const { phoneNumber, patientID, language } = req.body;

  validatePhoneNumber(phoneNumber);

  if (!patientID || !validateMongoId(patientID) || !checkPatientExist(patientID)) {
    throw new ValidationError('Invalid patient ID');
  }

  validateLanguage(language);

  const newMessage = new Message({
    patientID: req.body.patientID,
    phoneNumber: req.body.phoneNumber,
    date: req.body.date,
    response: req.body.response,
    value: req.body.value,
    alertType: req.body.alertType,
  });

  await newMessage.save();

  await Patient.findByIdAndUpdate(new ObjectId(req.body.patientId), {
    $inc: { messagesSent: 1 },
  });

  res.status(200).json({
    success: true,
  });
}));

router.get('/allOutcomes', auth, wrapAsync(async (req, res) => {

  const outcomeList = await Outcome.find();
  const patientList = await Patient.find();

  res.status(200).send({ outcomes: outcomeList, patients: patientList }); 
}));

export default router;
