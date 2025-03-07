class ApiError extends Error {
	constructor(statusCode, message, isOperational = true, stack = '') {
	  super(message);
	  this.statusCode = statusCode;
	  this.message = message;
	  this.success = false;
	  this.data = null;
	  this.isOperational = isOperational;
	  if (stack) {
		this.stack = stack;
	  } else {
		Error.captureStackTrace(this, this.constructor);
	  }
	}
  }
  
  export {ApiError};

