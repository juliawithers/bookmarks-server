const winston = require('winston')
const { NODE_ENV } = require('./config')

// Configure logging and API key handling middleware on the server - using winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({filename: 'info.log'})
    ]
})
if (NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }))
}

module.exports =  logger