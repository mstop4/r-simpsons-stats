const express = require('express');
const app = express();
const port = 5000;

const index = require('./routes/index');
const submissions = require('./routes/submissions');

app.use('', index);
app.use('/submissions', submissions);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));