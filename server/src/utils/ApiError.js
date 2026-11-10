// Throw this anywhere to send a clean error to the client:  throw new ApiError(404, 'Product not found')
export default class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
