const express = require('express')
const mongoose = require('mongoose')
const request = require('supertest')

const { MongoMemoryServer } = require('mongodb-memory-server')

const { Profile } = require('../../models')
const profileRoutes = require('../../routes/profile')
const { TestProfile } = require('../constants')

const app = express()
app.use(express.json())
app.use('/', profileRoutes())

let mongod
let expect
let originalNodeEnv

before(async () => {
  originalNodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'test';

  ({ expect } = await import('chai'))

  try {
    mongod = await MongoMemoryServer.create()
    const mongoUri = mongod.getUri()
    const mongooseOpts = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
    await mongoose.connect(mongoUri, mongooseOpts)
  } catch (err) {
    console.error(err)
  }
})

beforeEach(async () => {
  for (const i in mongoose.connection.collections) {
    await mongoose.connection.collections[i].deleteMany({})
  }
})

after(async () => {
  process.env.NODE_ENV = originalNodeEnv
  try {
    await mongod.stop()
  } catch (err) {
    console.error(err)
  }
})

describe('GET /profiles', () => {
  it('empty list', async () => {
    const res = await request(app).get('/profiles')
    expect(res.statusCode).to.equal(200)
    expect(res.body).to.be.an('array')
  })
  it('should fetch a single profile', async () => {
    const newProfile = new Profile(TestProfile)
    await newProfile.save()

    const res = await request(app).get('/profiles/')
    expect(res.statusCode).to.equal(200)
    expect(res.body).to.be.an('array')
    expect(res.body.length).to.equal(1)
    expect(res.body[0]._id).to.equal(newProfile._id.toString())
  })
})

describe('GET /profiles/:id', () => {
  it('should fetch a single profile', async function () {
    const newProfile = new Profile(TestProfile)
    await newProfile.save()

    const res = await request(app).get(`/profiles/${newProfile._id}`)
    expect(res.statusCode).to.equal(200)
    expect(res.body).to.be.an('object')
    expect(res.body._id).to.equal(newProfile._id.toString())
  })
  it('no profile found', async function () {
    const res = await request(app).get('/profiles/65c26a6417ca1866761ee007')
    expect(res.statusCode).to.equal(404)
  })
})

describe('POST /profiles', () => {
  it('should create a new profile', async () => {
    const res = await request(app).post('/profiles').send(TestProfile)
    expect(res.statusCode).to.equal(201)
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('_id')
  })
})
