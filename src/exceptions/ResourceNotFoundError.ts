
export class ResourceNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ResourceNotFoundError";
        // Due to TS broken prototype chain for Error
        Object.setPrototypeOf(this, new.target.prototype);
    }
}