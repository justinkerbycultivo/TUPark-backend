const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    spot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSpot',
      required: true,
    },
    // Linked when the entry came from a QR scan (Week 3). Self-service
    // bookings made from the Reserve screen won't have this set.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    plateNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    vehicleType: {
      type: String,
      enum: ['regular', 'motorcycle', 'disabled'],
      default: 'regular',
    },
    // How this reservation was created.
    entryMethod: {
      type: String,
      enum: ['self_booking', 'qr_scan'],
      default: 'self_booking',
    },
    startTime: {
      type: Date,
      required: true,
    },
    // Optional now: QR entries don't know the exit time up front —
    // it gets filled in when the guard scans the vehicle out.
    endTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reservation', reservationSchema);
