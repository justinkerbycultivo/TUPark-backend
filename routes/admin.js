const express = require('express');
const router = express.Router();

const User = require('../models/User');
const ParkingSpot = require('../models/ParkingSpot');
const Reservation = require('../models/Reservation');

// GET /api/admin/overview -> counts for a dashboard summary
router.get('/overview', async (req, res) => {
  try {
    const [totalSpots, availableSpots, reservedSpots, occupiedSpots, totalUsers, totalReservations, activeReservations] =
      await Promise.all([
        ParkingSpot.countDocuments({}),
        ParkingSpot.countDocuments({ status: 'available' }),
        ParkingSpot.countDocuments({ status: 'reserved' }),
        ParkingSpot.countDocuments({ status: 'occupied' }),
        User.countDocuments({}),
        Reservation.countDocuments({}),
        Reservation.countDocuments({ status: 'active' }),
      ]);

    res.json({
      totalSpots,
      availableSpots,
      reservedSpots,
      occupiedSpots,
      totalUsers,
      totalReservations,
      activeReservations,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users -> every registered user (never send passwordHash back)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id -> remove a user account
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
