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

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// API routes come first
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Serve React app static files after API routes
app.use(express.static(path.resolve(__dirname, "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build/index.html"));
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
      statusCode: err.status || 500,
      message: err.message || 'Internal server error',
  });
});

app.use(cors({
  origin: 'https://newamericans-demo-h3a4aqbsh6asemcp.eastus2-01.azurewebsites.net',
  credentials: true,
}));

app.use(function(err, req, res, next) {
  console.error('Error details:', {
    statusCode: err.status || 500,
    message: err.message,
    stack: err.stack // This will show you the stack trace in the console
  });

  res.status(err.status || 500).json({
    statusCode: err.status || 500,
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
