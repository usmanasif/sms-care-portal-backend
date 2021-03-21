import { ValidationError } from '../exceptions';

const MESSAGE_TEMPLATE_TYPES = ['initial', 'red', 'green', 'yellow'];

export default function validateMessageTemplateType(type: string) {
  if (!type || !MESSAGE_TEMPLATE_TYPES.includes(type)) {
    throw new ValidationError('Invalid tamplate type');
  }
}