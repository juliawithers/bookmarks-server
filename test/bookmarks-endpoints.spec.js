const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe.only('Bookmarks Endpoints', function() {
    let db

    before('make knex instance', () => {
      db = knex({
        client: 'pg',
        connection: process.env.TEST_DB_URL,
      })
      app.set('db', db)
    })
  
    after('disconnect from db', () => db.destroy())
  
    before('clean the table', () => db('bookmarks').truncate())

    afterEach('cleanup', () => db('bookmarks').truncate())

    describe(`GET /api/bookmarks`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, [])
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()
            
            beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks')
                .insert(testBookmarks)
            })
    
            it('GET /api/bookmarks responds with 200 and all of the bookmarks', () => {
                return supertest(app)
                  .get('/api/bookmarks')
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(200, testBookmarks)
            })
        })

        context(`Given an XSS attack bookmark`, () => {
            const maliciousBookmark = {
                id: 911,
                title: 'Naughty naughty very naughty <script>alert("xss");</script>',
                url: 'https://www.fakebad.com',
                description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
                rating: 0
            }
            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert(maliciousBookmark)
            })
        
            it('removes XSS attack content', () => {
            return supertest(app)
                .get(`/api/bookmarks`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200)
                .expect(res => {
                    expect(res.body[0].title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    expect(res.body[0].description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                })
            })
        })
    })

    describe(`POST /api/bookmarks`, () => {
        
        it(`creates a bookmark, responding with 201 and the new bookmark`, function () {
            // this.retries(3)
            const newBookmark = {
                title: 'Test',
                url: 'https://www.test2bookmark.com',
                description: 'test description 2',
                rating: 4
            }
            return supertest(app)
                .post('/api/bookmarks')
                .send(newBookmark)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect( res =>{
                    console.log(res.body)
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
                })
                .then(postRes => 
                    supertest(app)
                        .get(`/api/bookmarks/${postRes.body.id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body)    
                )
        })

        const requiredFields = ['title', 'url', 'rating']

        requiredFields.forEach(field => {
            const newBookmark = {
                title: 'Test new bookmark',
                url: 'https://www.newurl.com',
                rating: 5
            }

            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newBookmark[field]
                return supertest(app)
                    .post('/api/bookmarks')
                    .send(newBookmark)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body`}
                    })
            })
        })

        it(`responds with 400 invalid 'url' if not a valid url`, () => {
            const newInvalidBookmarkUrl = {
                title: 'Test new bookmark',
                url: 'htps//www.newurl.com',
                rating: 5
            } 
            return supertest(app)
                .post(`/api/bookmarks`)
                .send(newInvalidBookmarkUrl)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {error: { message: `'url' must be valid` }
                })
        })

        it(`responds with 400 invalid 'rating' if not a number between 0 and 5`,() => {
            const newInvalidBookmarkRating = {
                title: 'Test new bookmark',
                url: 'https://www.newurl.com',
                rating: 'invalid'
            } 
            return supertest(app)
                .post(`/api/bookmarks`)
                .send(newInvalidBookmarkRating)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {error: { message: `'rating' must be a number between 0 and 5` }
                })
        })
                   
    })

    describe(`GET /api/bookmarks/:id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
            const bookmarkId = 123456
            return supertest(app)
                .get(`/api/bookmarks/${bookmarkId}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(404, { error: { message: `Bookmark does not exist` } })
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()
            
            beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks')
                .insert(testBookmarks)
            })
    
            it('GET /api/bookmarks/:id responds with 200 and the specified bookmark', () =>{
                const bookmarkId = 2
                const expectedBookmarks = testBookmarks[bookmarkId -1]
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedBookmarks)
            })
        })

        context(`Given an XSS attach bookmarks`, () => {
            const maliciousBookmark = {
                id: 911,
                title: 'Naughty naughty very naughty <script>alert("xss");</script>',
                url: 'https://www.fakebad.com',
                description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
                rating: 0
            }
            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert(maliciousBookmark)
            })
            
            it('removes XSS attack content', () => {
            return supertest(app)
                .get(`/api/bookmarks/${maliciousBookmark.id}`)                
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                })
            })
        })
    })

    describe(`DELETE /api/bookmarks/:id`, () => {
        context('Given there are bookmarks in the database', () =>{
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () =>{
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('responds with 204 and removes the bookmark', () => {
                const idToRemove = 2
                const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/bookmarks/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res =>{
                        supertest(app)
                            .get(`/api/bookmarks`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedBookmarks)
                    })
            })
        })
        
        context(`Given no bookmarks`, () =>{
            it('responds with 404 not found if the bookmark does not exist', ()=>{
                const idToRemove = 123456
                return supertest(app)
                    .delete(`/api/bookmarks/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404,{error: { message: `Bookmark does not exist`}
                    })
            })
        }) 
    })

    describe(`PATCH /api/bookmarks/:id`, () => {
        context(`Given no articles`, () => {
            it(`responds with 404`, () => {
                const bookmarkId = 123456789
                return supertest(app)
                    .patch(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `Bookmark does not exist` } })
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()
            console.log(testBookmarks)

            beforeEach('insert bookmark', () => {
            return db
                .into('bookmarks')
                .insert(testBookmarks)
            })
    
            it('responds with 204 and updates the bookmark', () => {
                const idToUpdate = 2
                const updateBookmark = {
                    title: 'updated bookmark title',
                    url: 'http://helloworld.com',
                    description: 'updated bookmark content',
                    rating: 5
                }
                const expectedBookmark ={
                    ...testBookmarks[idToUpdate - 1],
                    ...updateBookmark
                }
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(updateBookmark)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/bookmarks/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedBookmark)
                    )
            })

            it(`responds with 400 when no required fields are supplied`, () =>{
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({ irrelevantField: 'foo' })
                    .expect(400, {
                        error: {
                            message: `Request body must contain either 'title, 'url', or 'rating'`
                        }
                    })
            })

            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2
                const updateBookmark = {
                title: 'updated bookmark title',
                }
                const expectedBookmark ={
                    ...testBookmarks[idToUpdate - 1],
                    ...updateBookmark
                }
        
                    return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({
                        ...updateBookmark,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res =>
                        supertest(app)
                        .get(`/api/bookmarks/${idToUpdate}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(expectedBookmark)
                    )
                
            })

            it(`responds with 400 invalid 'url' if not a valid url`, () => {
                const idToUpdate = 2
                const newInvalidBookmarkUrl = {
                    url: 'htp://invalid.url',
                } 
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newInvalidBookmarkUrl)
                    .expect(400, {error: { message: `'url' must be valid` }
                    })
            })
    
            it(`responds with 400 invalid 'rating' if not a number between 0 and 5`,() => {
                const idToUpdate = 2
                const newInvalidBookmarkRating = {
                    rating: 'invalid'
                } 
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newInvalidBookmarkRating)
                    .expect(400, {error: { message: `'rating' must be a number between 0 and 5` }
                    })
            })
        })
    }) 
})