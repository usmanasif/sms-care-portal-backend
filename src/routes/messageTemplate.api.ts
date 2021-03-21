import express from 'express';
import { ObjectId } from 'mongodb';
import auth from '../middleware/auth';
import wrapAsync from '../utils/asyncWrapper';
import { MessageTemplate } from '../models/messageTemplate.model';
import { ValidationError } from '../exceptions';

const router = express.Router();

router.post('/newTemplate', auth, wrapAsync(async (req, res) => {

  const {messageTxt, language, type} = req.body;

  if (!messageTxt) {
    new ValidationError('Please Enter Message Text!');
  }

  const newMessageTemplate = new MessageTemplate({
    language: language,
    text: messageTxt,
    type: type,
  });
  
  await newMessageTemplate.save()

  res.status(200).json({
    success: true,
  });
}));

router.post('/deleteTemplate', wrapAsync(async (req, res) => {
  const { id } = req.body;

  await MessageTemplate.findByIdAndDelete(new ObjectId(id));

  res.status(200);
}));

router.get('/templates', auth, wrapAsync(async (req, res) => {

  const messageTemplates = await MessageTemplate.find();

  res.status(200).json(messageTemplates);
}));

export default router;
