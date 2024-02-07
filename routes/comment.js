'use strict'

const express = require('express')
const router = express.Router()

const { commentSchema } = require('../schema')
const dbSchema = require('../models')

module.exports = function () {
  router.post('/comments', async function (req, res, next) {
    const { error } = commentSchema.validate(req.body)
    if (error) {
      res.status(400).send(error.details[0].message)
      return
    }

    const {
      userId,
      text,
      title,
      mbtiPersonality,
      enneagramPersonality,
      zodiacPersonality
    } = req.body
    if (!(mbtiPersonality || enneagramPersonality || zodiacPersonality)) {
      res.status(400).send('No personalities specified')
      return
    }

    // check this user exists
    const user = await dbSchema.Profile.findOne({ _id: userId })
    if (!user) {
      return res.status(400).send('User not found')
    }

    const personalities = {
      mbti: mbtiPersonality,
      enneagram: enneagramPersonality,
      zodiac: zodiacPersonality
    }

    const comment = new dbSchema.Comment({
      user: userId,
      text,
      title,
      personalities
    })

    // Save the comment to the database
    await comment.save()

    res.status(201).json(comment)
  })

  router.put('/comments/:id/like', async function (req, res) {
    const commentId = req.params.id

    const comment = await dbSchema.Comment.findOne({ _id: commentId })
    if (!comment) {
      return res.status(400).send('Comment not found')
    }

    const { userId } = req.body
    const user = await dbSchema.Profile.findOne({ _id: userId })
    if (!user) {
      return res.status(400).send('User not found')
    }

    const like = await dbSchema.CommentLike.findOne({
      user: userId,
      comment: commentId
    })
    if (like) {
      return res.status(400).send('User already liked this comment')
    }

    const newLike = new dbSchema.CommentLike({
      user: userId,
      comment: commentId
    })
    await newLike.save()

    res.status(200).json(newLike)
  })

  router.put('/comments/:id/unlike', async function (req, res) {
    const commentId = req.params.id

    const comment = await dbSchema.Comment.findOne({ _id: commentId })
    if (!comment) {
      return res.status(400).send('Comment not found')
    }

    const { userId } = req.body
    const user = await dbSchema.Profile.findOne({ _id: userId })
    if (!user) {
      return res.status(400).send('User not found')
    }

    const removedLike = await dbSchema.CommentLike.findOneAndDelete({
      user: userId,
      comment: commentId
    })
    if (!removedLike) {
      return res.status(400).send('User has not liked this comment')
    }

    res.status(204).send()
  })

  router.get('/comments', async (req, res) => {
    let sort = {}
    if (req.query.sort === 'recent') {
      sort = { createdAt: -1 }
    } else {
      sort = { likesCount: -1 }
    }

    let filter = {}
    if (req.query.personalities) {
      const personalities = req.query.personalities.split(',')
      filter = {
        $and: personalities.map((personality) => ({
          [`personalities.${personality}`]: { $ne: null }
        }))
      }
    }

    const comments = await dbSchema.Comment.aggregate([
      {
        $lookup: {
          from: 'commentlikes',
          localField: '_id',
          foreignField: 'comment',
          as: 'likes'
        }
      },
      {
        $addFields: {
          likesCount: { $size: '$likes' }
        }
      },
      {
        $match: filter
      },
      {
        $sort: sort
      },
      {
        $project: {
          likes: 0
        }
      }
    ])

    res.send(comments)
  })

  return router
}
