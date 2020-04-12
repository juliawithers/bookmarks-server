require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const errorHandler = require('./error-handler')
const validateBearerToken = require('./validate-bearer-token')
const bookmarksRouter = require('./bookmarks/bookmarks-router')

const app = express()

const morganOption = (NODE_ENV === 'production') ? 'tiny' : 'common';
app.use(morgan(morganOption))
app.use(cors())
app.use(helmet())

app.use(validateBearerToken)

app.use(bookmarksRouter)

app.get('/', (req,res) => {
    res.send('Hello')
})

app.use(errorHandler)

module.exports = app