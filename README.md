# Express Boilerplate!

This is a boilerplate project used for starting new projects!

## Set up

Complete the following steps to start a new project (NEW-PROJECT-NAME):

1. Clone this repository to your local machine `git clone BOILERPLATE-URL NEW-PROJECTS-NAME`
2. `cd` into the cloned repository
3. Make a fresh start of the git history for this project with `rm -rf .git && git init`
4. Install the node dependencies `npm install`
5. Move the example Environment file to `.env` that will be ignored by git and read by the express server `mv example.env .env`
6. Edit the contents of the `package.json` to use NEW-PROJECT-NAME instead of `"name": "express-boilerplate",`

## Scripts

Start the application `npm start`

Start nodemon for the application `npm run dev`

Run the tests `npm test`

## Deploying

When your new project is ready for deployment, add a new Heroku application with `heroku create`. This will make a new git remote called "heroku" and you can then `npm run deploy` which will push to this remote's master branch.



Bookmarks API assignment: 

1) Add an endpoint to support updating bookmarks using a PATCH request
2) Ensure the Bookmarks API has a uniform RESTful interface. For example, are the endpoints consistently named?
3) Update all of the endpoints to use the /api prefix
Write integration tests for your PATCH request to ensure:
    It requires the bookmark's ID to be supplied as a URL param
    It responds with a 204 and no content when successful
    It updates the bookmark in your database table
    It responds with a 400 when no values are supplied for any fields (title, url, description, rating)
    It allows partial updates, for example, only supplying a new title will only update the title for that item
4) Write the appropriate API code to make these tests pass