const express = require('express');
const router = express.Router();

const Announcement = require('../models/Announcement');
const Area = require('../models/Area');
const ParkingSpot = require('../models/ParkingSpot');

// GET all announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('area', 'name location capacity')
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      message: 'Failed to get announcements',
    });
  }
});

// CREATE announcement
router.post('/', async (req, res) => {
  try {
    const {
      title,
      area,
      reason,
      requiredAction,
    } = req.body;

    if (!title || !area || !reason || !requiredAction) {
      return res.status(400).json({
        message: 'Title, area, reason, and required action are required',
      });
    }

    const selectedArea = await Area.findById(area);

    if (!selectedArea) {
      return res.status(404).json({
        message: 'Parking area not found',
      });
    }

    // Find currently occupied spots in the selected area.
    const occupiedSpots = await ParkingSpot.find({
      section: selectedArea.name,
      status: 'occupied',
    }).select('spotNumber');

    const occupiedSpotNumbers = occupiedSpots.map(
      (spot) => spot.spotNumber
    );

    const announcement = await Announcement.create({
      title: title.trim(),
      area: selectedArea._id,
      reason: reason.trim(),
      requiredAction: requiredAction.trim(),
      affectedPlateNumbers: occupiedSpotNumbers,
    });

    const result = await Announcement.findById(announcement._id)
      .populate('area', 'name location capacity');

    res.status(201).json(result);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      message: 'Failed to create announcement',
    });
  }
});

module.exports = router;