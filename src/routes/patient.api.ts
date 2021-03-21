/* eslint-disable @typescript-eslint/indent */
import express from 'express';
import { Outcome } from '../models/outcome.model';
import { Patient, PatientForPhoneNumber, checkPatientExist } from '../models/patient.model';
import auth from '../middleware/auth';
import { Message } from '../models/message.model';
import { ValidationError, ResourceNotFoundError } from '../exceptions';
import { validatePhoneNumber, validateLanguage, validateMessageTime, validateMongoId } from '../validators';
import wrapAsync from '../utils/asyncWrapper';
import { Coach } from '../models/coach.model';

const { ObjectId } = require('mongoose').Types;

const router = express.Router();

router.post('/add', auth, wrapAsync(async (req, res) => {

  const { firstName, lastName, phoneNumber,language, coachId, msgTime, isEnabled } = req.body;
  
  validatePhoneNumber(phoneNumber)

  if (await PatientForPhoneNumber(phoneNumber)) {
    throw new ValidationError('Patient already exists for given phone number');
  }

  if (!firstName) {
    throw new ValidationError('Invalid first name');
  }

  if (!firstName) {
    throw new ValidationError('Invalid last name');
  }

  validateLanguage(language);

  if (!validateMongoId(coachId) ) {
    throw new ValidationError('Invalid coachId');
  }

  const coach = await Coach.findById(coachId);

  if (!coach) {
    throw new ValidationError('Invalid coachId');
  }

  const coachName = coach.firstName + ' ' + coach.lastName;

  if (isEnabled === undefined || typeof isEnabled !== 'boolean') {
    throw new ValidationError('Invalid isEnabled field');
  }

  const {hours, mins} = validateMessageTime(msgTime);

  const newPatient = new Patient({
    firstName: firstName,
    lastName: lastName,
    language: language,
    phoneNumber: phoneNumber,
    reports: [],
    responseCount: 0,
    messagesSent: 0,
    coachID: coachId,
    coachName: coachName,
    enabled: isEnabled,
    prefTime: hours * 60 + mins,
  });

  await newPatient.save();

  res.status(200).json({
    success: true
  })
}));


router.put('/increaseResponseCount/:patientID', auth, wrapAsync(async (req, res) => {

  const id = req.params.patientID;
  const responseCount = req.body.responseCount;

  if(!validateMongoId(id) || !checkPatientExist(id)) {
    throw new ValidationError('Invalid patient id');
  }

  await Patient.updateOne({ _id: id }, {responseCount});

  res.status(200).json({
    msg: 'Patient response count updated successfully!',
    sucess: true,
  });
}));

router.get('/getPatientOutcomes/:patientID', auth, wrapAsync(async (req, res) => {

  const id = req.params.patientID;

  if(!validateMongoId(id) || !checkPatientExist(id)) {
    throw new ValidationError('Invalid patient id');
  }

  const outcomeList = await Outcome.find({ patientID: new ObjectId(id) }).sort({date: 1});

  res.status(200).json(outcomeList);

}));

router.get('/getPatient/:patientID', auth, wrapAsync(async (req, res) => {
  const id = req.params.patientID;

  if (!validateMongoId(id)) {
    throw new ResourceNotFoundError('Patient with given id not found');
  }

  const patient = await Patient.findById(new ObjectId(id));

  if (!patient) {
    throw new ResourceNotFoundError('Patient with given id not found');
  }

  res.status(200).json(patient);
}));

router.get('/getPatientMessages/:patientID', auth, wrapAsync(async (req, res) => {
  const id = req.params.patientID;

  if(!validateMongoId(id) || !checkPatientExist(id)) {
    throw new ValidationError('Invalid patient id');
  }

  const messageList = await Message.find({ patientID: new ObjectId(id) });

  res.status(200).json(messageList);
}));

router.post('/status', auth, wrapAsync(async (req, res) => {
  const { id, status } = req.body;

  if(!validateMongoId(id) || !checkPatientExist(id)) {
    throw new ValidationError('Invalid patient id');
  }

  await Patient.findByIdAndUpdate(new ObjectId(id), { enabled: status });

  res.status(200).json({
    succes: "true",
    message: "Patient status updated."
  });
}));

export default router;
