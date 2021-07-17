const express = require('express')
const app = express()
const bodyParser = require('body-parser') // middleware
const cors = require('cors')
require('dotenv').config()
// const mongoose = require('mongoose');
let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e);
}
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//create exerciseSchema
const { Schema } = mongoose;

const exerciseSchema = new Schema({
  description: String,
  duration: Number,
  date: String
})

//create personSchema

const personSchema = new Schema({
  username: String,
  log: [exerciseSchema]
});

//create Session model

const Session = mongoose.model('Session', exerciseSchema);
//create Person model
const Person = mongoose.model('Person', personSchema);

//bodyParser to recognize form input from index. HTML 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// You can POST to /api/users with form data username to create a new user. 
// The returned response will be an object with username and _id properties.
app.post('/api/users', (req, res) => {
  const newPerson = new Person({ username: req.body.username });
  newPerson.save((err, data) => {
    res.json({ "username": data.username, "_id": data.id })
  });
  // res.json({"response": req.body.username});
});

// You can make a GET request to /api/users to get an array of all users. 
// Each element in the array is an object containing a user's username and _id.

app.get('/api/users', (req, res) => {
  Person.find({}, '_id, username').exec(function (err, users) {
    console.log('users : ', users);
    // console.log('err', err);
    res.json(users);
  });
});

// You can POST to /api/users/:_id/exercises with form data description, duration, 
// and optionally date. If no date is supplied, the current date will be used. 
// The response returned will be the user object with the exercise fields added.

app.post('/api/users/:_id/exercises', (req, res) => {
  var day; 
  req.body.date === "" ? day = new Date().toISOString().substring(0,10) : day = req.body.date
  let newSession = new Session({
    "description": req.body.description, 
    'duration': parseFloat(req.body.duration),
    'date': day
  })

  Person.findByIdAndUpdate(req.params._id, {$push : {log : newSession}}, {new : true}, function (err, person) {
    res.json({person})
  });
});

// You can make a GET request to /api/users/:_id/logs to retrieve a full exercise log 
// of any user. The returned response will be the user object 
// with a log array of all the exercises added. Each log item has the description, 
// duration, and date properties
app.get('/api/users/:_id/logs', (req, res) => {
  Person.findById(req.params._id, (err, docs) => {
    console.log("Result : ", docs.log);
    res.json(docs.log);
  })

});
//Remove

app.get('/api/users/:_id/86', (req, res) => {
  Person.findByIdAndRemove(req.params._id, req.body, (err, data) => {
    !err ? console.log("Deleted!") : console.log(err);
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
