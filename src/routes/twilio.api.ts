/* eslint-disable radix */
import express from 'express';
import twilio from 'twilio';
import bodyParser from 'body-parser';

import { Message } from '../models/message.model';
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER,
} from '../utils/config';

import { Outcome } from '../models/outcome.model';
import { checkPatientExist, PatientForPhoneNumber } from '../models/patient.model';
import auth from '../middleware/auth';
import { parseInboundPatientMessage } from '../domain/message_parsing';
import { responseForParsedMessage } from '../domain/glucose_reading_responses';
import wrapAsync from '../utils/asyncWrapper';
import { validateMongoId } from '../validators';
import { ValidationError } from '../exceptions';

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const { MessagingResponse } = twilio.twiml;

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

const UNRECOGNIZED_PATIENT_RESPONSE =
  'We do not recognize this number. Please contact CoachMe support.';

router.post('/sendMessage', auth, wrapAsync(async (req, res) => {
  const {content, to, patientID} = req.body;
  const date = new Date();

  if (!validateMongoId(patientID) || !checkPatientExist(patientID)) {
    throw new ValidationError('Invalid patientId');
  }

  // TODO Could be great to await here so we can get message sid and save it in DB message record
  twilioClient.messages.create({
    body: content,
    from: TWILIO_FROM_NUMBER,
    to,
  });

  const outgoingMessage = new Message({
    sent: true,
    phoneNumber: TWILIO_FROM_NUMBER,
    patientID,
    message: content,
    sender: 'COACH',
    date,
  });

  await outgoingMessage.save();

  res.status(200).send({
    success: true,
    msg: outgoingMessage,
  });
}));

// this route receives and parses the message from one user, then responds accordingly with the appropriate output
router.post('/reply', async (req, res) => {
  const twiml = new MessagingResponse();

  const inboundMessage = req.body.Body || 'Invalid Text (image)';
  const fromPhoneNumber = req.body.From.slice(2);
  const date = new Date();

  const patient = await PatientForPhoneNumber(fromPhoneNumber);

  if (!patient) {
    const twilioResponse = twiml.message(UNRECOGNIZED_PATIENT_RESPONSE);

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twilioResponse.toString());
    return;
  }

  // TODO again we should save message ids from twilio
  const incomingMessage = new Message({
    sent: true,
    phoneNumber: req.body.From,
    patientID: patient._id,
    message: inboundMessage,
    sender: 'PATIENT',
    date,
  });

  await incomingMessage.save();

  const parsedResponse = parseInboundPatientMessage(inboundMessage);

  if (parsedResponse.glucoseReading) {
    const outcome = new Outcome({
      phoneNumber: fromPhoneNumber,
      patientID: patient._id,
      response: inboundMessage,
      value: parsedResponse.glucoseReading.score,
      alertType: parsedResponse.glucoseReading.classification,
      date,
    });

    await outcome.save();
  }

  const responseMessage = await responseForParsedMessage(
    parsedResponse,
    patient.language,
  );

  const outgoingMessage = new Message({
    sent: true,
    phoneNumber: fromPhoneNumber,
    patientID: patient._id, // lost on this
    message: responseMessage,
    sender: 'BOT',
    date,
  });

  await outgoingMessage.save();

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.message(responseMessage).toString());
});

export default router;
