// Requiring LTIJS provider
const Lti = require('ltijs').Provider
// Requiring path
const path = require('path')
// Loading environment variables
require('dotenv').config()

// Creating a provider instance
const lti = new Lti(process.env.LTI_KEY,
  // Setting up database configurations
  { url: 'mongodb://' + process.env.DB_HOST + '/' + process.env.DB_DATABASE,
    connection: { user: process.env.DB_USER, pass: process.env.DB_PASS } })

// Main route
lti.app.get('/main', async (req, res) => {
  return res.sendFile(path.join(__dirname, '/public/index.html'))
})

// Grading route
lti.app.post('/grade', async (req, res) => {
  try {
    const grade = {
      scoreGiven: 70,
      activityProgress: 'Completed',
      gradingProgress: 'FullyGraded'
    }

    // Sends a grade to a platform's grade line
    lti.Grade.ScorePublish(res.locals.token, grade)
    return res.send('Grade Succesfully Created')
  } catch (err) {
    return res.status(500).send(err.message)
  }
})

async function setup () {
  // Deploying provider, connecting to the database and starting express server.
  await lti.deploy()

  const plat = await lti.registerPlatform({
    url: 'http://localhost/moodle',
    name: 'Local Moodle',
    clientId: 'grRonGwE7uZ4pgo',
    authenticationEndpoint: 'http://localhost/moodle/mod/lti/auth.php',
    accesstokenEndpoint: 'http://localhost/moodle/mod/lti/token.php',
    authConfig: { method: 'JWK_SET', key: 'http://localhost/moodle/mod/lti/certs.php' }
  })

  console.log(await plat.platformPublicKey())

  lti.onConnect((connection, request, response) => {
    lti.redirect(response, '/main', { ignoreRoot: true, isNewResource: true })
  }, { secure: false })

  console.log('Deployed!')
}

setup()
