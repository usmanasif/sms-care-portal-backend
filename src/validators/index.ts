
import { ValidationError } from '../exceptions';
import { Types } from 'mongoose';

const PHONE_NUMBER_REGEX = /^\d{10}$/;
const ENGLISH_LANG = 'english';
const SPANISH_LANG = 'spanish';

export function validatePhoneNumber(phoneNumber: string) {
    if(phoneNumber && PHONE_NUMBER_REGEX.test(phoneNumber)) {
        return;
    }
    throw new ValidationError('Invalid phone number')
}

export function validateLanguage(language: string) {
    if (language && (language.toLowerCase() === ENGLISH_LANG || language.toLowerCase() === SPANISH_LANG)) {
        return;
    }
    throw new ValidationError('Invalid language');
}

export function validateMessageTime(messageTime: string) {
    // Time parsing
    const splitTime = messageTime.split(':');
    if (splitTime.length !== 2) {
        throw new ValidationError('Invalid message time');
    }

  const hours = Number(splitTime[0]);
  const mins = Number(splitTime[1]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(mins) ||
    hours < 0 ||
    hours >= 24 ||
    mins >= 60 ||
    mins < 0
  ) {
    throw new ValidationError('Invalid message time');
  }

  return {hours, mins};
}

export function validateMongoId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}