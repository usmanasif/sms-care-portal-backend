export default class InternalServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InternalServerError';
    // Due to TS broken prototype chain for Error
    Object.setPrototypeOf(this, new.target.prototype);
  }
}