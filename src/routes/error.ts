export const Error = {
  REFRESH_EXPIRED: 'refreshExpired',
  INVALID_TOKEN: 'invalidToken',
  RESOURCE_NOT_FOUND: 'resourceNotFound',
  BAD_REQUEST: 'badRequest',
  INTERNAL_SERVER_ERROR: 'internalServerError'
};

const errorHandler = (
  res: any,
  errorMessage: string,
  errorCode?: string,
): Response => {
  if (errorCode === Error.INVALID_TOKEN || errorCode === Error.REFRESH_EXPIRED) {
    return res.status(401).send({
      success: false,
      message: errorMessage,
      code: errorCode,
    });
  } if (errorCode === Error.RESOURCE_NOT_FOUND) {
    return res.status(404).send({
      success: false,
      message: errorMessage,
      code: errorCode,
    });
  }
  return res.status(500).send({
    success: false,
    message: errorMessage,
  });
};

export default errorHandler;
