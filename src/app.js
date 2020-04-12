require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const winston = require('winston')
const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

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

const bookmarks = [
    {
        "id": "cjozyzcil0000lxygs3gyg2mr",
        "title": "Thinkful",
        "url": "https://www.thinkful.com",
        "description": "Think outside the classroom",
        "rating": 5
    },
    {
        "id": "cjozyzeqh0001lxygb8mhnvhz",
        "title": "Google",
        "url": "https://www.google.com",
        "description": "Where we find everything else",
        "rating": 4
    },
    {
        "id": "cjkzyzeqh0001lxygb8mhqvh3",
        "title": "MDN",
        "url": "https://developer.mozilla.org",
        "description": "The only place to find web documentation",
        "rating": 5
    }
];

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())


app.use(function validateBearerToken(req, res, next) {
    const apiToken = process.env.API_TOKEN
    const authToken = req.get('Authorization') 
    console.log('NODE_ENV from config: '+NODE_ENV, 'process.env.NODE_ENV: '+process.env.NODE_ENV)
    console.log('apiToken(using process.env.API_TOKEN): '+apiToken, 'authToken: '+authToken)
    if ( !authToken || authToken.split(' ')[1] !== apiToken) {
        logger.error(`Unauthorized request to path: ${req.path}`);
        return res.status(401).json({error: 'Unauthorized request'})
    }

    next()
})

app.get('/', (req, res) => {
    res.send('Hello, world!')
})

app.use(function errorHandler(error,req,res,next) {
    let response
    if (NODE_ENV === 'production') {
        response = { error: {message: 'server error'}}
    } else {
        console.log(error)
        response = { message: error.message, error}
    }
    res.status(500).json(response)
})

module.exports = app


// Write a route handler for the endpoint GET /bookmarks that returns a list of bookmarks
// Write a route handler for the endpoint GET /bookmarks/:id that returns a single bookmark with the given ID, return 404 Not Found if the ID is not valid
// Write a route handler for POST /bookmarks that accepts a JSON object representing a bookmark and adds it to the list of bookmarks after validation.
// Write a route handler for the endpoint DELETE /bookmarks/:id that deletes the bookmark with the given ID.
