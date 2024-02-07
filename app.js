'use strict'

const express = require('express')
const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')
const app = express()
const port = process.env.PORT || 3000

// Connect to MongoDB
let mongod
MongoMemoryServer.create().then((mongo) => {
  mongod = mongo
  const mongoUri = mongo.getUri()
  const mongooseOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }

  mongoose.connect(mongoUri, mongooseOpts).then(() => {
    console.log('Connected to Database')

    // set the view engine to ejs
    app.set('view engine', 'ejs')

    // add routes
    app.use('/', require('./routes/profile')())

    // start server
    app.listen(port)
    console.log('Express started. Listening on %s', port)
  })
})

// Close the Mongoose connection when the Node process ends
process.on('SIGINT', async () => {
  await mongod.stop()
  process.exit(0)
})
