const express = require('express')
const mongoose = require('mongoose')
const request = require('supertest')

const { MongoMemoryServer } = require('mongodb-memory-server')

const commentRoutes = require('../../routes/comment')
const { Comment, CommentLike, Profile } = require('../../models')
const { TEST_COMMENT, TEST_PROFILE } = require('../constants')

const app = express()
app.use(express.json())
app.use('/', commentRoutes())

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

describe('POST /comments', () => {
  it('should create a new comment', async () => {
    const user = new Profile(TEST_PROFILE)
    await user.save()

    const res = await request(app).post('/comments').send({
      userId: user._id.toString(),
      text: 'This is a test comment',
      title: 'Some title',
      mbtiPersonality: 'INFP',
      enneagramPersonality: '3w4'
    })

    expect(res.status).to.equal(201)
    expect(res.body).to.have.property('user').to.equal(user._id.toString())
    expect(res.body)
      .to.have.property('text')
      .to.equal('This is a test comment')

    const comment = await Comment.findById(res.body._id)
    const personalitiesObject = Object.fromEntries(comment.personalities)

    expect(personalitiesObject).to.be.an('object')
    expect(personalitiesObject).to.have.property('mbti').to.equal('INFP')
    expect(personalitiesObject).to.have.property('enneagram').to.equal('3w4')
    expect(personalitiesObject).to.have.property('zodiac').to.equal(null)
  })

  it('should return 400 if user does not exist', async () => {
    const res = await request(app).post('/comments').send({
      userId: '65c26a6417ca1866761ee007',
      text: 'This is a test comment',
      title: 'Some title',
      mbti_personality: 'INFP',
      enneagram_personality: '3w4'
    })

    expect(res.status).to.equal(400)
  })
})

describe('PUT /comments/:id/like', function () {
  it('should create comment like', async function () {
    const user = new Profile(TEST_PROFILE)
    await user.save()

    const comment = new Comment({
      ...TEST_COMMENT,
      user: user._id
    })
    await comment.save()

    const res = await request(app)
      .put(`/comments/${comment._id}/like`)
      .send({ userId: user._id })

    const commentLike = await CommentLike.find({})
    expect(commentLike).to.be.an('array')
    expect(commentLike.length).to.equal(1)
    const likeId = commentLike[0]._id.toString()

    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('_id').to.equal(likeId)
  })

  it('should return 400 if comment not found', async function () {
    const user = new Profile(TEST_PROFILE)
    await user.save()

    const res = await request(app)
      .put('/comments/60d6c47e03320b3534b15a99/like')
      .send({ userId: user._id })

    expect(res.status).to.equal(400)
  })

  it('should return 400 if user not found', async function () {
    const user = new Profile(TEST_PROFILE)
    await user.save()

    const comment = new Comment({
      ...TEST_COMMENT,
      user: user._id
    })
    await comment.save()

    const res = await request(app)
      .put(`/comments/${comment._id}/like`)
      .send({ userId: '60d6c47e03320b3534b15a99' })

    expect(res.status).to.equal(400)
  })

  it('should return 400 if like already exists', async function () {
    const user = new Profile(TEST_PROFILE)
    await user.save()

    const comment = new Comment({
      ...TEST_COMMENT,
      user: user._id
    })
    await comment.save()

    const like = new CommentLike({
      user: user._id,
      comment: comment._id
    })
    await like.save()

    const res = await request(app)
      .put(`/comments/${comment._id}/like`)
      .send({ userId: user._id })

    expect(res.status).to.equal(400)
  })
})

describe('PUT /comments/:id/unlike', function () {
  it('should unlike comment', async function () {
    const user = new Profile(TEST_PROFILE)
    await user.save()

    const comment = new Comment({
      ...TEST_COMMENT,
      user: user._id
    })
    await comment.save()

    const like = new CommentLike({
      user: user._id,
      comment: comment._id
    })
    await like.save()

    const res = await request(app)
      .put(`/comments/${comment._id}/unlike`)
      .send({ userId: user._id })

    const commentLike = await CommentLike.find({})
    expect(commentLike).to.be.an('array')
    expect(commentLike.length).to.equal(0)

    expect(res.status).to.equal(204)
  })

  it('should return 400 if comment not found', async function () {
    const user = new Profile(TEST_PROFILE)
    await user.save()

    const comment = new Comment({
      ...TEST_COMMENT,
      user: user._id
    })
    await comment.save()

    const like = new CommentLike({
      user: user._id,
      comment: comment._id
    })
    await like.save()

    const res = await request(app)
      .put('/comments/60d6c47e03320b3534b15a99/unlike')
      .send({ userId: user._id })

    expect(res.status).to.equal(400)
  })

  it('should return 400 if user not found', async function () {
    const user = new Profile(TEST_PROFILE)
    await user.save()

    const comment = new Comment({
      ...TEST_COMMENT,
      user: user._id
    })
    await comment.save()

    const like = new CommentLike({
      user: user._id,
      comment: comment._id
    })
    await like.save()

    const res = await request(app)
      .put(`/comments/${comment._id}/unlike`)
      .send({ userId: '60d6c47e03320b3534b15a99' })

    expect(res.status).to.equal(400)
  })

  it('should return 400 if like does not exist', async function () {
    const user = new Profile(TEST_PROFILE)
    await user.save()

    const comment = new Comment({
      ...TEST_COMMENT,
      user: user._id
    })
    await comment.save()

    const res = await request(app)
      .put(`/comments/${comment._id}/unlike`)
      .send({ userId: user._id })

    expect(res.status).to.equal(400)
  })
})

describe('GET /comments', () => {
  it('should return comments with likes num sorted by likes by default', async function () {
    // Create 2 users, 2 comments - 1 with 1 like, 1 with 2 likes
    const [user1, user2] = await Profile.insertMany([
      TEST_PROFILE,
      TEST_PROFILE
    ])
    const [comment1, comment2] = await Comment.insertMany([
      { ...TEST_COMMENT, user: user1._id },
      { ...TEST_COMMENT, user: user2._id }
    ])
    await CommentLike.insertMany([
      { user: user1._id, comment: comment2._id },
      { user: user2._id, comment: comment2._id }
    ])
    await CommentLike.create({ user: user1._id, comment: comment1._id })

    const res = await request(app).get('/comments')

    expect(res.statusCode).to.equal(200)
    expect(res.body).to.be.an('array')
    res.body.forEach((comment, index) => {
      if (index === 0) {
        expect(comment.likesCount).to.equal(2)
      } else if (index === 1) {
        expect(comment.likesCount).to.equal(1)
      }
    })
  })
  it('should return comments sorted by most recent', async function () {
    const [user1, user2] = await Profile.insertMany([
      TEST_PROFILE,
      TEST_PROFILE
    ])
    const [comment1, comment2] = await Comment.insertMany([
      { ...TEST_COMMENT, user: user1._id },
      { ...TEST_COMMENT, user: user2._id }
    ])
    await CommentLike.insertMany([
      { user: user1._id, comment: comment2._id },
      { user: user2._id, comment: comment2._id }
    ])
    await CommentLike.create({ user: user1._id, comment: comment1._id })

    const res = await request(app).get('/comments?sort=recent')

    expect(res.statusCode).to.equal(200)
    expect(res.body).to.be.an('array')
    res.body.forEach((comment, index) => {
      if (index === 0) {
        expect(comment.likesCount).to.equal(1)
      } else if (index === 1) {
        expect(comment.likesCount).to.equal(2)
      }
    })
  })
  it('should return comments filtered by personalities', async function () {
    const [user1, user2] = await Profile.insertMany([
      TEST_PROFILE,
      TEST_PROFILE
    ])
    const [, comment2] = await Comment.insertMany([
      {
        ...TEST_COMMENT,
        user: user1._id,
        personalities: { mbti: 'INFP', zodiac: null, enneagram: null }
      },
      {
        ...TEST_COMMENT,
        user: user2._id,
        personalities: { mbti: 'INFP', zodiac: 'Aries', enneagram: null }
      }
    ])

    const res = await request(app).get('/comments?personalities=zodiac,mbti')

    expect(res.statusCode).to.equal(200)
    expect(res.body).to.be.an('array')
    expect(res.body.length).to.equal(1)
    expect(res.body[0]._id).to.equal(comment2._id.toString())
  })
})
