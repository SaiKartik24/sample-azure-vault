const passport = require('passport');
const { OIDCStrategy } = require('passport-azure-ad');
const dotenv = require('dotenv');
dotenv.config();

const initPassport = async () => {
    const idmetadata = `${process.env.CLOUD_INSTANCE}${process.env.AZURE_TENANT_ID}/.well-known/openid-configuration`;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    const azureADConfig = {
        identityMetadata: idmetadata,
        clientID: clientId,
        clientSecret: clientSecret,
        responseType: process.env.RESPONSE_TYPE,
        responseMode: process.env.RESPONSE_MODE,
        redirectUrl: process.env.REDIRECT_URI,
        allowHttpForRedirectUrl: true,
        isB2C: false,
        validateIssuer: false,
        passReqToCallback: true,
        useCookieInsteadOfSession: false,
        scope: ['openid', 'profile', 'email'],
        loggingLevel: 'info',
    };

    const callbackFunction = (req, iss, sub, profile, accessToken, refreshToken, done) => {
        if (accessToken) {
            // console.log('Received accessToken - ' + accessToken);
        }
        if (refreshToken) {
            // console.log('Received refreshToken - ' + refreshToken);
        }
        if (!profile.oid) {
            return done(new Error("No oid found"), null);
        }

        return done(null, profile);
    };

    passport.use(new OIDCStrategy(azureADConfig, callbackFunction));
};

module.exports = { initPassport };
