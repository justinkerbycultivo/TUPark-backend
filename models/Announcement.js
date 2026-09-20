const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    area: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    requiredAction: {
      type: String,
      required: true,
      trim: true,
    },

    affectedPlateNumbers: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Announcement', announcementSchema);