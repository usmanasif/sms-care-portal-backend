/* eslint-disable @typescript-eslint/indent */
import express, {Request, Response} from 'express';
import { Outcome } from '../models/outcome.model';
import { Patient, PatientForPhoneNumber, checkPatientExist } from '../models/patient.model';
import auth from '../middleware/auth';
import { Message } from '../models/message.model';
import { ValidationError, ResourceNotFoundError } from '../exceptions';
import { validatePhoneNumber, validateLanguage, validateMessageTime, validateMongoId } from '../validators';
import wrapAsync from '../utils/asyncWrapper';

const { ObjectId } = require('mongoose').Types;

const router = express.Router();

router.post('/add', auth, wrapAsync(async (req, res) => {
  
  validatePhoneNumber(req.body.phoneNumber)

  if (await PatientForPhoneNumber(req.body.phoneNumber)) {
    throw new ValidationError('Patient already exists for given phone number');
  }

  if (req.body.firstName === '') {
    throw new ValidationError('Invalid first name');
  }

  if (req.body.lastName === '') {
    throw new ValidationError('Invalid last name');
  }

  validateLanguage(req.body.language);

  if (!req.body.coachId || req.body.coachId === '') {
    throw new ValidationError('Invalid coachId');
  }

  const {hours, mins} = validateMessageTime(req.body.msgTime);

  const newPatient = new Patient({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    language: req.body.language,
    phoneNumber: req.body.phoneNumber,
    reports: [],
    responseCount: 0,
    messagesSent: 0,
    coachID: req.body.coachId,
    coachName: req.body.coachName,
    enabled: req.body.isEnabled,
    prefTime: hours * 60 + mins,
  });

  await newPatient.save();

  res.status(200).json({
    success: true
  })
}));

router.put('/increaseResponseCount/:id', auth, wrapAsync(async (req, res) => {

  validatePhoneNumber(req.body.phoneNumber);

  if (req.body.firstName === '') {
    throw new ValidationError('Invalid first name');
  }

  if (req.body.lastName === '') {
    throw new ValidationError('Invalid last name');
  }

  validateLanguage(req.body.language);

  if(!checkPatientExist(req.params.id)) {
    throw new ValidationError('Invalid patient id');
  }

  const patient = new Patient({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    language: req.body.language,
    phoneNumber: req.body.phoneNumber,
    reports: [],
    responseCount: req.body.responseCount,
    messagesSent: req.body.messagesSent,
  });

  await Patient.updateOne({ _id: req.params.id }, patient);

  res.status(200).json({
    msg: 'Patient response count updated successfully!',
    sucess: true,
  });
}));

router.get('/getPatientOutcomes/:patientID', auth, wrapAsync(async (req, res) => {

  const id = req.params.patientID;

  if(!checkPatientExist(id)) {
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

  if(!checkPatientExist(id)) {
    throw new ValidationError('Invalid patient id');
  }

  const messageList = await Message.find({ patientID: new ObjectId(id) });

  res.status(200).json(messageList);
}));

router.post('/status', auth, wrapAsync(async (req, res) => {
  const { id, status } = req.body;

  if(!checkPatientExist(id)) {
    throw new ValidationError('Invalid patient id');
  }

  await Patient.findByIdAndUpdate(new ObjectId(id), { enabled: status });

  res.status(200).json('Patiet Status Changed!');
}));

export default router;
