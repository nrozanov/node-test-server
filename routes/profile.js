'use strict'

const express = require('express')
const router = express.Router()

const dbSchema = require('../models')

module.exports = function () {
  router.get('/profiles', async function (req, res, next) {
    const profiles = await dbSchema.Profile.find({})
    res.json(profiles)
  })

  router.get('/profiles/:id', async function (req, res, next) {
    const profile = await dbSchema.Profile.findOne({ _id: req.params.id })
    if (!profile) {
      return res.status(404).send('Profile not found');
    }

    if (process.env.NODE_ENV === 'test') {
      return res.json(profile);
    }
    return res.render('profile_template', { profile })
  })

  router.post('/profiles', async function (req, res, next) {
    const newProfile = new dbSchema.Profile(req.body)
    await newProfile.save()
    res.status(201).json(newProfile)
  })

  return router
}
