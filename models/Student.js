const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },
    sport: {
      type: String,
      enum: ['Football', "Women's Football", 'Basketball', 'Volleyball', 'Table Tennis'],
      required: true,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      default: 'active',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
