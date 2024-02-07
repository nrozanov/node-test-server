'use strict'

const Joi = require('joi')

const commentSchema = Joi.object({
  userId: Joi.string().required(),
  text: Joi.string().required(),
  title: Joi.string().required(),
  mbtiPersonality: Joi.string(),
  enneagramPersonality: Joi.string(),
  zodiacPersonality: Joi.string()
})

module.exports.commentSchema = commentSchema

const likeSchema = Joi.object({
  userId: Joi.string().required()
})

module.exports.likeSchema = likeSchema
