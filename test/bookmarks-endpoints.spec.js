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

    describe(`GET /bookmarks`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/bookmarks')
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
    
            it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
                return supertest(app)
                  .get('/bookmarks')
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
                .get(`/bookmarks`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200)
                .expect(res => {
                    expect(res.body[0].title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    expect(res.body[0].description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                })
            })
        })
    })

    describe(`POST /bookmarks`, () => {
        
        it(`creates a bookmark, responding with 201 and the new bookmark`, function () {
            // this.retries(3)
            const newBookmark = {
                title: 'Test',
                url: 'https://www.test2bookmark.com',
                description: 'test description 2',
                rating: 4
            }
            return supertest(app)
                .post('/bookmarks')
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
                    expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
                })
                .then(postRes => 
                    supertest(app)
                        .get(`/bookmarks/${postRes.body.id}`)
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
                    .post('/bookmarks')
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
                .post(`/bookmarks`)
                .send(newInvalidBookmarkUrl)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {error: { message: `'url' must be valid` }
                })
        })

        it(`responds with 400 invalid 'rating' if not a number between 0 and 5`,() => {
            const newInvalidBookmarkUrl = {
                title: 'Test new bookmark',
                url: 'https://www.newurl.com',
                rating: 'invalid'
            } 
            return supertest(app)
                .post(`/bookmarks`)
                .send(newInvalidBookmarkUrl)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {error: { message: `'rating' must be a number between 0 and 5` }
                })
        })
                   
    })

    describe(`GET /bookmarks/:id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
            const bookmarkId = 123456
            return supertest(app)
                .get(`/bookmarks/${bookmarkId}`)
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
    
            it('GET /bookmarks/:id responds with 200 and the specified bookmark', () =>{
                const bookmarkId = 2
                const expectedBookmarks = testBookmarks[bookmarkId -1]
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
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
                .get(`/bookmarks/${maliciousBookmark.id}`)                
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                })
            })
        })
    })

    describe(`DELETE /bookmarks/:id`, () => {
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
                    .delete(`/bookmarks/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res =>{
                        supertest(app)
                            .get(`/bookmarks`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedBookmarks)
                    })
            })
        })
        
        context(`Given no bookmarks`, () =>{
            it('responds with 404 not found if the bookmark does not exist', ()=>{
                const idToRemove = 123456
                return supertest(app)
                    .delete(`/bookmarks/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404,{error: { message: `Bookmark does not exist`}
                    })
            })
        })

        
    })
    
})