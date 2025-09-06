const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  classroom: {
    type: String,
    required: true,
    trim: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  dayOfWeek: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  lectureType: {
    type: String,
    enum: ['Lecture', 'Lab', 'Tutorial', 'Seminar'],
    default: 'Lecture'
  },
  chapter: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  semester: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lecture', lectureSchema);
