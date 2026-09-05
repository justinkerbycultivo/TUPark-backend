
const mongoose = require('mongoose');

const parkingSpotSchema = new mongoose.Schema(
  {
    spotNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['regular', 'motorcycle', 'disabled'],
      default: 'regular',
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'occupied'],
      default: 'available',
    },
    pricePerHour: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ParkingSpot', parkingSpotSchema);
