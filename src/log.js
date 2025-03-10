const { createLogger, format, transports, addColors } = require('winston');
const { combine, timestamp,  printf } = format;
const moment = require('moment-timezone');

const customTimestamp = () => {
    return moment().tz('Asia/Shanghai').format();
};

addColors({
    info: 'green',
    warn: 'yellow',
    error: 'red',
    debug: 'blue'
});

const logger = createLogger({
    level: 'info',
    format: combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ level, message,  timestamp }) => {
            return `${timestamp} ${level}: ${message}`;
        })
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.File({ filename: 'info.log' }),
    ],
});

module.exports = logger;