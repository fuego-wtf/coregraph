"use strict";

const fp = require("fastify-plugin");

// custom error types
class AppError extends Error {
  constructor(statusCode, message, errorCode = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(400, message, "VALIDATION_ERROR");
  }
}

class AuthError extends AppError {
  constructor(message) {
    super(401, message, "AUTH_ERROR");
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(404, message, "NOT_FOUND");
  }
}

async function errorHandler(fastify, opts) {
  // decorate fastify with error classes
  fastify.decorate("AppError", AppError);
  fastify.decorate("ValidationError", ValidationError);
  fastify.decorate("AuthError", AuthError);
  fastify.decorate("NotFoundError", NotFoundError);

  // add error handler
  fastify.setErrorHandler(async (error, request, reply) => {
    const statusCode = error.statusCode || 500;
    const errorCode = error.errorCode || "INTERNAL_ERROR";
    
    // log error with request context
    fastify.log.error({
      err: error,
      request: {
        method: request.method,
        url: request.url,
        params: request.params,
        query: request.query,
        user: request.user?.id
      }
    });

    // structured error response
    const response = {
      error: {
        code: errorCode,
        message: error.message || "an unexpected error occurred",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      request: {
        id: request.id,
        path: request.url
      }
    };

    reply.code(statusCode).send(response);
  });

  // not found handler
  fastify.setNotFoundHandler((request, reply) => {
    throw new NotFoundError(`route ${request.method} ${request.url} not found`);
  });
}

module.exports = fp(errorHandler); 