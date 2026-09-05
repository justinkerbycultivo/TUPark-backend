const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const ParkingSpot = require('../models/ParkingSpot');

// POST /api/reservations -> create a reservation for a spot
router.post('/', async (req, res) => {
  try {
    const { spotId, driverName, plateNumber, vehicleType, startTime, endTime } = req.body;

    if (!spotId || !driverName || !plateNumber || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const spot = await ParkingSpot.findById(spotId);
    if (!spot) return res.status(404).json({ message: 'Spot not found' });
    if (spot.status !== 'available') {
      return res.status(400).json({ message: 'Spot is not available' });
    }

    const reservation = await Reservation.create({
      spot: spot._id,
      driverName,
      plateNumber,
      vehicleType: vehicleType || 'regular',
      startTime,
      endTime,
    });

    spot.status = 'reserved';
    await spot.save();

    const populated = await reservation.populate('spot');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/reservations -> list all reservations (newest first)
router.get('/', async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('spot')
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reservations/plate/:plateNumber -> "my reservations" lookup, no login needed
router.get('/plate/:plateNumber', async (req, res) => {
  try {
    const reservations = await Reservation.find({
      plateNumber: req.params.plateNumber.toUpperCase(),
    })
      .populate('spot')
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/reservations/:id/cancel -> cancel a reservation and free up the spot
router.put('/:id/cancel', async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    reservation.status = 'cancelled';
    await reservation.save();

    await ParkingSpot.findByIdAndUpdate(reservation.spot, { status: 'available' });

    res.json(reservation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
