const BookmarksService = {
    getAllBookmarks(knex) {
        // return 'all the bookmarks!!'
        // return Promise.resolve('all the bookmarks!!')
        return knex.select('*').from('bookmarks')
    },
    insertBookmark(knex, newBookmark) {
        // return Promise.resolve({})
        return knex 
            .insert(newBookmark)
            .into('bookmarks')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .from('bookmarks')
            .select('*')
            .where('id', id)
            .first()
    },
    deleteBookmark(knex, id) {
        return knex('bookmarks')
            .where({ id })
            .delete()
    },
    updateBookmark(knex, id, newBookmarkFields) {
        return knex('bookmarks')
            .where({ id })
            .update(newBookmarkFields)
    },
}

module.exports = BookmarksService