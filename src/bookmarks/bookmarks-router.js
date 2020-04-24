const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../logger')
const { isWebUri } = require('valid-url')
const bookmarksRouter = express.Router()
const BookmarksService = require('./bookmarks-service')
const xss = require('xss')

const bodyParser = express.json();
// Requirements


// You should also test that your POST /bookmarks endpoint validates each bookmark to have the required fields in valid formats. For example, rating should be a number between 1 and 5.


// Refactor or implement the integration tests for DELETEing bookmarks as well as making sure the DELETE responds with a 404 when the bookmark doesn't exist.
// Refactor your GET methods and tests to ensure that all bookmarks get sanitized.
// This assignment should take about 3 hours to complete. If you're having trouble, attend a Q&A session or reach out on Slack for help.


bookmarksRouter
.route('/bookmarks')
.get((req,res,next) => {
    // Write a route handler for the endpoint GET /bookmarks that returns a list of bookmarks
    const knexInstance = req.app.get('db')
    BookmarksService.getAllBookmarks(knexInstance)
        .then(bookmarks => {
            res.json(bookmarks.map(bookmark => ({
                id: bookmark.id,
                title: xss(bookmark.title),
                url: bookmark.url,
                description: xss(bookmark.description),
                rating: bookmark.rating
            }) 
            ))
        })
        .catch(next)
})
.post(bodyParser,(req, res, next) => {
    const { title, url, description, rating } = req.body;

    const newBookmark = { title, url, description, rating }

    for (const field of ['title','url', 'rating']) {
        if (!req.body[field]) {
            logger.error(`${field} is required`)
            return res.status(400).send({
                error: { message: `Missing '${field}' in request body` }
            })
        }
    }

    if (!isWebUri(url)) {
        logger.error(`Invalid url ${url}`)
        return res
            .status(400).json({
                error: { message: `'url' must be valid` }
            })
            
    }

   if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
       logger.error(`Invalid rating of ${rating}`)
       return res
            .status(400).json({
                error: { message: `'rating' must be a number between 0 and 5` }
            })
   }

    BookmarksService.insertBookmark(
        req.app.get('db'),
        newBookmark
    )
        .then(bookmark => {
            logger.info(`Bookmark with id ${bookmark.id} created`)
            res
                .status(201)
                .location(`/bookmarks/${bookmark.id}`)
                .json({
                    id: bookmark.id,
                    title: xss(bookmark.title),
                    url: bookmark.url,
                    description: xss(bookmark.description),
                    rating: bookmark.rating
                })
        })
        .catch(next)
})

bookmarksRouter
.route('/bookmarks/:id')
.get((req,res,next) => {
    // Write a route handler for the endpoint GET /bookmarks/:id that returns a single bookmark with the given ID, return 404 Not Found if the ID is not valid
    const knexInstance = req.app.get('db')
    const id = req.params.id;
    console.log(req.params.id)
    BookmarksService.getById(knexInstance, id)
        .then(bookmark => {
            if (!bookmark) {
                logger.error(`Bookmark with id ${id} not found`)
                return res.status(404).json({
                    error: { message: `Bookmark does not exist`}
                })
            }
            res.json({
                id: bookmark.id,
                title: xss(bookmark.title),
                url: bookmark.url,
                description: xss(bookmark.description),
                rating: bookmark.rating
            })
        })
        .catch(next)  
})
.delete((req,res,next) => {
    // Write a route handler for the endpoint DELETE /bookmarks/:id that deletes the bookmark with the given ID.

    BookmarksService.deleteBookmark(
        req.app.get('db'),
        req.params.id
    )
        .then(res => {
            if (!res) {
                res.status(404).json({
                    error: { message: `Bookmark does not exist`}
                })
            }
        })
        .then(()=>{
            res.status(204).end();
        })
        .catch(next)
})

module.exports = bookmarksRouter