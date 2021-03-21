
export default class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
    // Due to TS broken prototype chain for Error
    Object.setPrototypeOf(this, new.target.prototype);
  }
}