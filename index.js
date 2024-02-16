require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns'); 
const bodyParser = require('body-parser');
const app = express();

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    unique: true,
    required: true
  },
  short_url: {
    type: Number,
    unique: true,
    required: true
  }
});
const Url = new mongoose.model('Url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', function(req, res) {
  const original_url = req.body.url;
  let req_url = original_url;
  const startIndex = req_url.lastIndexOf('//');
  req_url = startIndex > -1 ? req_url.slice(startIndex + 2) : req_url;
  let endIndex = req_url.lastIndexOf('/');
  req_url = endIndex > -1 ? req_url.slice(0, endIndex) : req_url;
  dns.lookup(req_url, err => {
    if (err) {
      res.json({ error: 'invalid url' });
    } else {
      Url.findOne({ original_url }, (err, url) => {
        if (err) {
          res.json({ error: 'invalid url' });
        } else if (url) {
          res.json({
            original_url: url.original_url,
            short_url: url.short_url
          });
        } else {
          Url.estimatedDocumentCount((err, count = 0) => {
            if (err) {
              res.json({ error: 'invalid url' });
            } else {
              url = new Url({
                original_url,
                short_url: count + 1
              });
              url.save((err, data) => {
                if (err) {
                  res.json({ error: 'invalid url' });
                } else {
                  res.json({
                    original_url: data.original_url,
                    short_url: data.short_url
                  });
                }
              });
            }
          });
        }
      });
    }
  });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  Url.findOne({ short_url: req.params.short_url - 0 }, (err, url) => {
    if (err) {
      res.json({ error: 'invalid url' });
    } else {
      res.redirect(url.original_url);
    }
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
