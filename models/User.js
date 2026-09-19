const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    surname: {
  type: String,
  required: true,
  trim: true,
},

givenName: {
  type: String,
  required: true,
  trim: true,
},

middleName: {
  type: String,
  trim: true,
  default: '',
},

    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    // Week 2 - Student/User Registration: vehicle info
    vehicle: {
      plateNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
      },
      vehicleType: {
        type: String,
        enum: ['car', 'motorcycle'],
        required: true,
      },
    },

    // Week 1.10 - route users to the right dashboard by account type
    role: {
      type: String,
      enum: ['student', 'guard', 'admin'],
      default: 'student',
    },

    // Week 3.1 - unique QR code token linked to this account + vehicle
    qrToken: {
      type: String,
      unique: true,
      default: () => crypto.randomUUID(),
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    // Week 1.8/1.9 - login attempt limiting + temporary lockout
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
