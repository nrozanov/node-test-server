'use strict'

const mongoose = require('mongoose')

const ProfileSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  mbti: String,
  enneagram: String,
  variant: String,
  tritype: Number,
  socionics: String,
  sloan: String,
  psyche: String,
  image: String
})
const Profile = mongoose.model('Profile', ProfileSchema)

module.exports.Profile = Profile

const CommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true
    },
    personalities: {
      type: Map,
      of: String,
      default: {}
    },
    text: String,
    title: String
  },
  { timestamps: true }
)
const Comment = mongoose.model('Comment', CommentSchema)

module.exports.Comment = Comment

// add schema for CommentLike, it should have a user field that is a reference to the Profile model
// plus it should have a comment field that is a reference to the Comment model
const CommentLikeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      required: true
    }
  },
  { timestamps: true }
)
const CommentLike = mongoose.model('CommentLike', CommentLikeSchema)

module.exports.CommentLike = CommentLike
