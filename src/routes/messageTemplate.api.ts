import express from 'express';
import auth from '../middleware/auth';
import wrapAsync from '../utils/asyncWrapper';
import { MessageTemplate } from '../models/messageTemplate.model';
import { ValidationError } from '../exceptions';
import { validateLanguage, validateMessageTemplateType, validateMongoId } from '../validators';

const router = express.Router();

router.post('/newTemplate', auth, wrapAsync(async (req, res) => {

  const {messageTxt, language, type} = req.body;

  if (!messageTxt) {
    throw new ValidationError('Please Enter Message Text!');
  }
  validateLanguage(language);
  validateMessageTemplateType(type);

  const newMessageTemplate = new MessageTemplate({
    language,
    text: messageTxt,
    type,
  });
  
  await newMessageTemplate.save();

  res.status(200).json({
    success: true,
  });
}));

router.post('/deleteTemplate', auth, wrapAsync(async (req, res) => {
  const { id } = req.body;

  if (!validateMongoId(id)) {
    throw new ValidationError('Invalid templateId');
  }

  await MessageTemplate.findByIdAndDelete(id);

  res.status(200).json();
}));

router.get('/templates', auth, wrapAsync(async (req, res) => {

  const messageTemplates = await MessageTemplate.find();

  res.status(200).json(messageTemplates);
}));

export default router;
