var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
const session = require('express-session');
app.use(session({
  secret: 'Hema',  // Use a secret key to sign the session ID
  resave: false,              // Don't save session if unmodified
  saveUninitialized: false,   // Don't create session until something is stored
  cookie: { secure: false }   // Set to true if using HTTPS
}));

const passport = require("passport");



app.use(passport.initialize());
app.use(passport.session());
app.use(cors());

app.use(express.static(path.resolve(__dirname, "build")));
app.get("*", (req, res) => {
  console.log(path.join(__dirname, "build/index.html"));
  
  res.sendFile(path.join(__dirname, "build/index.html"));
  
});


// Your routes and other middleware
app.get('/', (req, res) => {
  res.send('Home Page');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error',
  });
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        statusCode: err.status || 500,
        message: err.message || 'Internal server error',
    });
});


module.exports = app;
