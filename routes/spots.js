const express = require('express');
const router = express.Router();
const ParkingSpot = require('../models/ParkingSpot');

// GET /api/spots?status=available  -> list spots, optional status filter
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const spots = await ParkingSpot.find(filter).sort({ spotNumber: 1 });
    res.json(spots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/spots/:id -> single spot
router.get('/:id', async (req, res) => {
  try {
    const spot = await ParkingSpot.findById(req.params.id);
    if (!spot) return res.status(404).json({ message: 'Spot not found' });
    res.json(spot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/spots -> create a new spot (used for seeding / adding spots)
router.post('/', async (req, res) => {
  try {
    const spot = await ParkingSpot.create(req.body);
    res.status(201).json(spot);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/spots/:id -> update a spot (e.g. change status/price)
router.put('/:id', async (req, res) => {
  try {
    const spot = await ParkingSpot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!spot) return res.status(404).json({ message: 'Spot not found' });
    res.json(spot);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/spots/:id -> remove a spot
router.delete('/:id', async (req, res) => {
  try {
    const spot = await ParkingSpot.findByIdAndDelete(req.params.id);
    if (!spot) return res.status(404).json({ message: 'Spot not found' });
    res.json({ message: 'Spot deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
