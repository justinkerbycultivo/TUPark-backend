const express = require('express');
const router = express.Router();

const User = require('../models/User');
const ParkingSpot = require('../models/ParkingSpot');
const Reservation = require('../models/Reservation');

// Map a student's vehicle type to the ParkingSpot "type" it should fill.
const VEHICLE_TO_SPOT_TYPE = {
  car: 'regular',
  motorcycle: 'motorcycle',
};

// POST /api/guard/scan -> Week 3: guard scans a student's QR code on entry
router.post('/scan', async (req, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) {
      return res.status(400).json({ message: 'No QR code data received' });
    }

    // 3.3 / 4.3-4.4 - look up the registered student by their QR token
    const user = await User.findOne({ qrToken });
    if (!user) {
      // 4.7 - QR code not registered
      return res.status(404).json({ message: 'This QR code is not registered in TUPark.' });
    }

    // Prevent double entry: is this vehicle already parked (active, no exit yet)?
    const existing = await Reservation.findOne({ user: user._id, status: 'active', endTime: null });
    if (existing) {
      const spot = await ParkingSpot.findById(existing.spot);
      return res.status(409).json({
        message: `${user.fullName}'s vehicle is already checked in at spot ${spot?.spotNumber || '—'}.`,
        alreadyParked: true,
        student: {
          fullName: user.fullName,
          studentId: user.studentId,
          plateNumber: user.vehicle.plateNumber,
          vehicleType: user.vehicle.vehicleType,
        },
        assignedSpot: spot,
      });
    }

    // 3.4 - check current availability
    const spotType = VEHICLE_TO_SPOT_TYPE[user.vehicle.vehicleType] || 'regular';
    const spot = await ParkingSpot.findOne({ type: spotType, status: 'available' }).sort({ spotNumber: 1 });

    if (!spot) {
      // 3.8 - notify guard/student that parking is unavailable
      return res.status(409).json({
        message: `No available ${spotType} parking spots right now.`,
        noSpaceAvailable: true,
        student: {
          fullName: user.fullName,
          studentId: user.studentId,
          plateNumber: user.vehicle.plateNumber,
          vehicleType: user.vehicle.vehicleType,
        },
      });
    }

    // 3.5/3.7 - auto-assign the spot and record the entry transaction
    const reservation = await Reservation.create({
      spot: spot._id,
      user: user._id,
      driverName: user.fullName,
      plateNumber: user.vehicle.plateNumber,
      vehicleType: spotType,
      entryMethod: 'qr_scan',
      startTime: new Date(),
      status: 'active',
    });

    spot.status = 'occupied';
    await spot.save();

    res.status(201).json({
      message: `Welcome, ${user.fullName}! Assigned to spot ${spot.spotNumber}.`,
      student: {
        fullName: user.fullName,
        studentId: user.studentId,
        plateNumber: user.vehicle.plateNumber,
        vehicleType: user.vehicle.vehicleType,
      },
      assignedSpot: spot,
      reservation,
    });
  } catch (error) {
    console.error('Guard scan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/guard/exit -> vehicle exit: release the spot (preview of Week 12)
router.post('/exit', async (req, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) {
      return res.status(400).json({ message: 'No QR code data received' });
    }

    const user = await User.findOne({ qrToken });
    if (!user) {
      return res.status(404).json({ message: 'This QR code is not registered in TUPark.' });
    }

    const reservation = await Reservation.findOne({ user: user._id, status: 'active', endTime: null });
    if (!reservation) {
      return res.status(404).json({ message: `${user.fullName} has no active parking session.` });
    }

    reservation.endTime = new Date();
    reservation.status = 'completed';
    await reservation.save();

    await ParkingSpot.findByIdAndUpdate(reservation.spot, { status: 'available' });

    res.json({
      message: `${user.fullName}'s vehicle has exited. Spot released.`,
      reservation,
    });
  } catch (error) {
    console.error('Guard exit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
