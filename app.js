const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const {open} = require('sqlite') // open method is used to connect database server and provide connection object
const sqlite3 = require('sqlite3') //it contains the driver of the database
const path = require('path')
const dbpath = path.join(__dirname, 'userData.db')
app.use(express.json())
let db = null

//get connection object
const initializeDatabaseAndServer = async () => {
  try {
    db = await open({
      //here open method returns promise object that's why we write await here
      filename: dbpath,
      driver: sqlite3.Database, //it tells how to connect with the database
    })
    app.listen(3000, () => {
      console.log('Server is Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log('DB Error: ${e.message}')
    process.exit(1)
  }
}
initializeDatabaseAndServer()

//api1 Wtiting an API for new User to Register

app.post('/register', async (request, response) => {
  const bodydetails = request.body
  const {username, name, password, gender, location} = bodydetails
  // query to find the username is exits
  const usernameQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(usernameQuery)
  if (dbUser === undefined) {
    //means if username is does not exits it retruns the value as undefined
    if (password.length <= 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const hashedPassword = await bcrypt.hash(password, 10) // hash() method is used to convert the plainText password to encrypted type password
      const registerNewUserQuery = `INSERT INTO user (username, name, password, gender, location)
      VALUES ( '${username}','${name}','${hashedPassword}','${gender}','${location}' )`
      const dbResponse = await db.run(registerNewUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//api2 writing an API for user to login

app.post('/login/', async (request, response) => {
  const bodyDetails = request.body
  const {username, password} = bodyDetails
  //writing query to know user is registered person or not
  const userQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(userQuery)
  if (dbUser === undefined) {
    //means user is not register yet
    response.status(400)
    response.send('Invalid user')
  } else {
    /*here we compare passwords that entering 
    while login and while registering passwords*/
    const isEnteredPassword = await bcrypt.compare(password, dbUser.password)
    if (isEnteredPassword === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//api3 writing the API for changing the password

app.put('/change-password/', async (request, response) => {
  const bodyContent = request.body
  const {username, oldPassword, newPassword} = bodyContent
  const userQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(userQuery)
  if (dbUser === undefined) {
    //means user is not register yet
    response.status(400)
    resonse.send('Invalid user')
  } else {
    const comparing = await bcrypt.compare(oldPassword, dbUser.password)
    if (comparing === true) {
      if (newPassword.length <= 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const hashedpassword = await bcrypt.hash(newPassword, 10)
        const upadteQuery = `UPDATE user SET username = '${username}',password='${hashedpassword}'`
        const dbResponsefromUpdate = await db.run(upadteQuery)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
