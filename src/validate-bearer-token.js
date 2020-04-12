
const { API_TOKEN } = require('./config')
const logger = require('./logger')


function validateBearerToken(req, res, next) {
    const apiToken = API_TOKEN
    const authToken = req.get('Authorization')

    if ( !authToken || authToken.split(' ')[1] !== apiToken) {
        logger.error(`Unauthorized request to path: ${req.path}`);
        return res.status(401).json({error: 'Unauthorized request'})
    }

    next()
}

module.exports = validateBearerToken