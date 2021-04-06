'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg =require('pg');
const cors = require('cors');
// const { request, response } = require('express');
const DATABASE_URL= process.env.DATABASE_URL;
const client=new pg.Client(DATABASE_URL);

// Application Setup
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3001;


// Application Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('views', 'views/');

// Set the view engine for server-side templating
app.set('view engine', 'ejs');

// API Routes
// Renders the home page
app.get('/', renderHomePage);

// Renders the search form
app.get('/searches/new', showForm);

// Creates a new search to the Google Books API
app.post('/searches', createSearch);

// Catch-all
app.get('*', (request, response) => response.status(404).send('This route does not exist'));


client.on('error', err => console.error(err));


client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
  });

// HELPER FUNCTIONS
// Only show part of this to get students started
let booksArray = [];
function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';

  this.author = info.authors || 'No authors available.';
  this.img=info.imageLinks|| placeholderImage;
  this.description = info.description || 'No description available.';
  this.title = info.title || 'No title available'; // shortcircuit
  booksArray.push(this);
}

// Note that .ejs file extension is not required

function renderHomePage(request, response) {
  // response.render('pages/index');
  let SQL = 'SELECT * from books;';

  return client.query(SQL)
    .then(results => response.render('index', { results: results.rows }))
    .catch((error) => handleError(error, response));
}

function showForm(request, response) {
  response.render('pages/searches/new.ejs');
}

// No API key required
// Console.log request.body and request.body.search
function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  console.log(request.body);
  console.log(request.body.search);
  
  if (request.body.search[1] === 'title') { url += `intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `inauthor:${request.body.search[0]}`; }

  superagent.get(url)
    .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    .then(results => response.render('pages/searches/show', { searchResults: results }));
  // how will we handle errors?
}

app.get('/books/add', getAddForm);
app.post('/books', addBook);
app.get('/books/:book_id', showOneBook);


function showOneBook(request, response) {
  const selectedBook = 'SELECT * FROM books WHERE id=$1';
  const safeValues = [request.params.book_id];
  client.query(selectedBook, safeValues).then(data => {
    response.render('pages/searches/show', {
      book: data.rows[0]
    });
  }).catch(() => {
    response.status(500).send('Something Went Wrong');
  });
}

function addBook (request, response){
  console.log(request.body);
  let { title, description, category, contact, status } = request.body;

  let SQL = 'INSERT INTO books(title, description, category, contact, status) VALUES ($1, $2, $3, $4, $5);';
  let values = [title, description, category, contact, status];

  return client.query(SQL, values)
    .then(response.redirect('/'))
    .catch(err => handleError(err, response))
}

function getAddForm(request, response){
  response.render('pages/books/add');}