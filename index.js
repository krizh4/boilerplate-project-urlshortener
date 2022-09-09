require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
let bodyParser = require("body-parser");
let mongoose = require("mongoose");

// Basic Configuration
const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

//BODY PHRASING
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//DATABASE SCHEMA
let ShortLink;

const Schema = mongoose.Schema;
const shortLinkSchema = new Schema({
  link: {type: String, required: true},
  short: {type: Number, required: true}
});
const numberingSchema = new Schema({
  name: {type: String},
  count: {type: Array}
});

ShortLink = mongoose.model('ShortLink', shortLinkSchema);
Numbering = mongoose.model('Numbering', numberingSchema);

app.get('/api/shorturl/:shorturl', (req, res, next) => {
  ShortLink.findOne({short: req.params.shorturl}, (err, data) => {
    if (err) res.json({error: "No short URL found for the given input"});
    console.log(data.link);
    res.redirect(data.link);
  });
}).post('/api/shorturl', (req, res, next) => {
  try{
    var url = new URL(req.body.url);
  } catch (err) {
    return res.json({error: "Invalid URL"});
  }

  const options = {
    all: true,
  };

  dns.lookup(url.hostname, options, (err, address) => {
    if (err) return res.json({error: "Invalid URL"});

    Numbering.findById({_id: '631b23fde335cd14a45d1b82'}, (err, numbering) => {
      if (err) return console.log(err);

      var array = numbering.count;
      console.log(array);
      numbering.count.push(array[array.length - 1] + 1);

      numbering.save((err, updatednum) => {
        if (err) return console.log(err);
        var shortkey = updatednum.count[updatednum.count.length - 1]
        ShortLink({
          link: url,
          short: shortkey
        }).save((err, data) => {
          if (err) return console.log(err);
          res.json({
            original_url: url, 
            short_url: data.short
          });
        });
      });
    });
  });
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
