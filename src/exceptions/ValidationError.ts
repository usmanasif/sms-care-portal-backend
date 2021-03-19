export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
        // Due to TS broken prototype chain for Error
        Object.setPrototypeOf(this, new.target.prototype);
    }
}