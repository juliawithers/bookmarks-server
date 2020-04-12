const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../logger')
const store = require('../store')
const { isWebUri } = require('valid-url')
const bookmarksRouter = express.Router()

const bookmarks = store.bookmarks;
const bodyParser = express.json();

bookmarksRouter
.route('/bookmarks')
.get((req,res) => {
    // Write a route handler for the endpoint GET /bookmarks that returns a list of bookmarks
    res
    .json(bookmarks)
})
.post(bodyParser,(req,res) => {
    // Write a route handler for POST /bookmarks that accepts a JSON object representing a bookmark and adds it to the list of bookmarks after validation.

    // need to add rating to this apparently? why would you require a user to do this???!

    const { title, url, description, rating } = req.body;

    if (!title || !url || !rating) {
        logger.error(`title, url, or rating not supplied`)
        return res 
            .status(400)
            .send('You must enter all of the following information: title, url, and rating. Description is optional')
    }

     if (title) {
        const duplicate = bookmarks.find(bookmarked => bookmarked.title === title)
        if (duplicate) {
            return res
                .status(400)
                .send('This title is already in use as a bokmark')
        }
    }

    // did not know about isWebUri before looking at the solution, good to know
    if (!isWebUri(url)) {
        logger.error(`Invalid url ${url}`)
        return res
            .status(400)
            .send('Please enter a valid url')
    }

    if (url) {
        const duplicate = bookmarks.find(bookmarked => bookmarked.url === url)
        if (duplicate) {
            return res
                .status(400)
                .send('This url is already in use as a bokmark')
        }
    }

   if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
       logger.error(`Invalid rating of ${rating}`)
       return res
            .status(400)
            .send('You must enter a rating between 0 and 5')
   }

    const id = uuid();
    const bookmark = {
        id,
        title,
        url,
        description
    }

    bookmarks.push(bookmark);

    logger.info(`Card with id ${id} created`)
    res
        .status(201)
        .location(`http://localhost:8000/${id}`)
        .json(bookmark)
})

bookmarksRouter
.route('/bookmarks/:id')
.post((req,res) => {
    // Write a route handler for the endpoint GET /bookmarks/:id that returns a single bookmark with the given ID, return 404 Not Found if the ID is not valid
    console.log(req.params.id)
    const id = req.params.id;
    
    const website = bookmarks.find(bookmarked => bookmarked.id === id)
    console.log(website)
    console.log(id)

    res.json(website)
    if (!website) {
        logger.error(`Bookmark with id ${id} not found`)
        return res
                .status(404)
                .send('404 Not Found')
    } 
    
    res.json(website)    
})
.delete((req,res) => {
    // Write a route handler for the endpoint DELETE /bookmarks/:id that deletes the bookmark with the given ID.
    const id = req.params.id;

    const bookmarkInd = bookmarks.findIndex(bookmarked => bookmarked.id == id)

    if (bookmarkInd === -1) {
        logger.error(`Bookmark with id ${id} does not exist`)
        return res 
            .status(404)
            .send('Not Found')
    }

    bookmarks.splice(bookmarkInd,1)
    logger.info(`Bookmark with id ${id} deleted.`)
    res
        .status(204)
        .end();

})

module.exports = bookmarksRouter