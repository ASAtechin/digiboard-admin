const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  office: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  subjects: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number,
    default: 0
  },
  qualifications: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Teacher', teacherSchema);
