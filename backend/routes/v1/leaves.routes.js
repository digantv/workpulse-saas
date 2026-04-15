'use strict';

const express = require('express');
const leaveController = require('../../controllers/leave.controller');
const { protectAuth } = require('../../middlewares/protect-auth');

const router = express.Router();

router.use(protectAuth);

router.post('/', leaveController.create);
router.get('/', leaveController.list);
router.get('/:id', leaveController.getById);

module.exports = router;
