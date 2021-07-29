//setup

const express = require('express')
const app = express()
const bodyParser = require('body-parser') // middleware
const cors = require('cors')
require('dotenv').config()
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
    res.json({ 'username': newPerson.username, '_id': newPerson._id })
  });
});

// You can make a GET request to /api/users to get an array of all users. 
// Each element in the array is an object containing a user's username and _id.

app.get('/api/users', (req, res) => {
  Person.find({}, '_id, username').exec(function (err, users) {
    res.json(users);
  });
});

// You can POST to /api/users/:_id/exercises with form data description, duration, 
// and optionally date. If no date is supplied, the current date will be used. 
// The response returned will be the user object with the exercise fields added.

app.post('/api/users/:_id/exercises', (req, res) => {
  var day;
  req.body.date === "" ? day = new Date().toISOString().substring(0, 10) : day = req.body.date
  day = new Date(day).toDateString();
  let newSession = new Session({
    "description": req.body.description,
    'duration': parseFloat(req.body.duration),
    'date': day
  })

  Person.findByIdAndUpdate(req.params._id, { $push: { log: newSession } }, { new: true }, function (err, person) {
    res.json({
      '_id': req.params._id, 'username': person.username, "description": req.body.description,
      'duration': parseFloat(req.body.duration),
      'date': day
    })
  });
});

// You can make a GET request to /api/users/:_id/logs to retrieve a full exercise log 
// of any user. The returned response will be the user object 
// with a log array of all the exercises added. Each log item has the description, 
// duration, and date properties

// A request to a user's log (/api/users/:_id/logs) returns an object with a 
// count property representing the number of exercises returned.

// You can add from, to and limit parameters to a /api/users/:_id/logs request to 
// retrieve part of the log of any user. from and to are dates in yyyy-mm-dd format. 
// limit is an integer of how many logs to send back.

app.get('/api/users/:_id/logs', (req, res) => {
  Person.findById(req.params._id, (err, docs) => {
    if (req.query.limit) {
      var smallLog = docs.log.slice(0, req.query.limit);
      res.json({ '_id': docs._id, 'username': docs.username, 'log' : smallLog })
    } else if (req.query.from || req.query.to){
      //set and format default dates
      let fromDate = new Date(0);
      let toDate = new Date();

      if(req.query.from){
        fromDate = new Date(req.query.from)
      }
      if(req.query.to){
        toDate = new Date(req.query.to)
      }
      //convert dates to UNIX time stamps
      fromDate = fromDate.getTime();
      toDate = toDate.getTime();
      //filter log
      var filtLog = docs.log.filter((session)=>{
        //convert session dates to UNIX time stamps
        let sessionDate = new Date(session.date).getTime();
        return sessionDate >= fromDate && sessionDate <= toDate;
      })
      res.json({ '_id': docs._id, 'username': docs.username, 'log' : filtLog })
    }else{
      res.json({  '_id': docs._id, 'username': docs.username, "log" :docs.log, 'count': docs.log.length });
    }
  })

});

//Remove all users

app.get('/api/users/86', (req, res) => {
  Person.deleteMany({ username: { $exists: true } }, req.body, (err, data) => {
    !err ? console.log("Deleted Many!") : console.log(err);
    res.json({ 'Objects with usernames have been deleted': null })
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
