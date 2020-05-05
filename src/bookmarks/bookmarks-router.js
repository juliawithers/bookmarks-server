const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../logger')
const { isWebUri } = require('valid-url')
const bookmarksRouter = express.Router()
const BookmarksService = require('./bookmarks-service')
const xss = require('xss')
const path = require('path')

const bodyParser = express.json();

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
                .location(path.posix.join(req.originalUrl +`/${bookmark.id}`))
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
.all((req, res, next) => {
    const { id } = req.params
    BookmarksService.getById(req.app.get('db'), id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`)
          return res.status(404).json({
            error: { message: `Bookmark does not exist` }
          })
        }

        res.bookmark = bookmark
        next()
      })
      .catch(next)

  })
.get((req,res,next) => {
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

    BookmarksService.deleteBookmark(
        req.app.get('db'),
        req.params.id
    )
        .then(bookmark => {
            if (!bookmark) {
                logger.error(`Bookmark with id ${bookmark.id} not found`)
                return res.status(404).json({
                    error: { message: `Bookmark does not exist`}
                })
            }
            logger.info(`Bookmark with id ${bookmark.id} was deleted`)
            res.status(204).end();
        })
        .catch(next)
})
.patch(bodyParser, (req,res,next) => {
    const { title, url, description, rating } = req.body
    const bookmarkToUpdate = { title, url, description, rating }

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
    if (numberOfValues === 0){
        return res.status(400).json({
            error: {
                message: `Request body must contain either 'title, 'url', or 'rating'`
            }
        })
    }
  
    if (url && !isWebUri(url)) {
        logger.error(`Invalid url ${url}`)
        return res
            .status(400).json({
                error: { message: `'url' must be valid` }
            })
            
    }

    if (rating && !Number.isInteger(rating) || rating < 0 || rating > 5) {
       logger.error(`Invalid rating of ${rating}`)
        return res
            .status(400).json({
                error: { message: `'rating' must be a number between 0 and 5` }
            })
    }

    BookmarksService.updateBookmark(
        req.app.get('db'),
        req.params.id,
        bookmarkToUpdate
    )
        .then(numRowsAffected => {
            res.status(204).end()    
        })
        .catch(next)
    
})

module.exports = bookmarksRouter