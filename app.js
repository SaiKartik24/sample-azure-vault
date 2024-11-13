var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');


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

// app.use(express.static(path.resolve(__dirname, "Samaritas-Frontend/build")));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "Samaritas-Frontend/build/index.html"));
// });

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


// app.use(cors({
//   origin: 'https://newamericans-demo-h3a4aqbsh6asemcp.eastus2-01.azurewebsites.net',
//   credentials: true,
// }));
// Azure Key Vault setup
const credential = new DefaultAzureCredential();
const client = new SecretClient(`https://na-s.vault.azure.net/`, credential);

app.get('/get-secrets', async (req, res) => {
  // Check if the 'names' query parameter is provided
  if (!req.query.names) {
      return res.status(400).send('Missing query parameter: names. Please provide a comma-separated list of secret names.');
  }

  const secretNames = req.query.names.split(','); // Expecting names as a comma-separated list
  const secrets = {};

  for (const name of secretNames) {
      try {
          const secret = await client.getSecret(name);
          secrets[name] = secret.value;
      } catch (error) {
          console.error(`Failed to get secret ${name}:`, error.message);
          secrets[name] = null; // or handle differently if needed
      }
  }

  res.status(200).json(secrets);
});


// POST endpoint to set a secret
app.post('/set-secret', async (req, res) => {
  const { secretName, secretValue } = req.body;

  if (!secretName || !secretValue) {
      return res.status(400).send('Please provide both secretName and secretValue.');
  }

  try {
      await client.setSecret(secretName, secretValue);
      res.status(200).send(`Secret ${secretName} set successfully.`);
  } catch (error) {
      console.error(`Failed to set secret ${secretName}:`, error.message);
      res.status(500).send(`Failed to set secret: ${error.message}`);
  }
});
//AZUR-VAULT END

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
