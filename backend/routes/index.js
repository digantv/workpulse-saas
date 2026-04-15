/**
 * API router — mounted at /api. Add versioned sub-routers here.
 */

const express = require('express');
const v1 = require('./v1');

const router = express.Router();

router.use('/v1', v1);

module.exports = router;
