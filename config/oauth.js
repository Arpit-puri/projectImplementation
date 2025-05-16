const { OAuth2Client } = require('google-auth-library');
const GitHub = require('github-api');

module.exports = {
  googleClient: new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  ),

  githubClient: new GitHub({
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET
  }),

  providers: {
    google: {
      scopes: ['profile', 'email']
    },
    github: {
      scopes: ['user:email']
    }
  }
};