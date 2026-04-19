import winston from "winston";

const { combine, timestamp, printf, colorize } = winston.format;

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

export const logger = winston.createLogger({
  level: "info",
  format: combine(timestamp(), myFormat),
  transports: [
    // Log to the console with colorized output for better readability during development.
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), myFormat),
    }),
    // Log error-level messages to a separate file for easier debugging and monitoring of issues.
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    // Log all messages (including info and debug) to a combined log file for comprehensive logging of application activity.
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});
