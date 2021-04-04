const express = require('express');
const app = express();
const port = process.env.port || 3000;
const ejs = require('ejs');



app.listen(port, () => {
    console.log(`book-app listening at http://localhost:${port}`)
  });