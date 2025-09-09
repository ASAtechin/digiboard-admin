const chai = require('chai');
const supertest = require('supertest');
const mongoose = require('mongoose');
const moment = require('moment');
require('dotenv').config({ path: '../.env' });

// Configure chai
const { expect } = chai;

// Test configuration
const TEST_CONFIG = {
  BASE_URL: 'http://localhost:3001',
  TIMEOUT: 10000,
  DB_URI: process.env.MONGODB_URI,
  ADMIN_CREDENTIALS: {
    username: 'admin',
    password: 'admin123'
  }
};

// Test utilities
class TestUtils {
  static async connectDB() {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_CONFIG.DB_URI);
    }
  }

  static async disconnectDB() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }

  static async loginAdmin(agent) {
    const response = await agent
      .post('/login')
      .send(TEST_CONFIG.ADMIN_CREDENTIALS);
    return response;
  }

  static generateTestLecture(overrides = {}) {
    const defaults = {
      subject: `Test Subject ${Date.now()}`,
      teacher: null, // Will be set to actual teacher ID
      classroom: `Room ${Math.floor(Math.random() * 100)}`,
      dayOfWeek: 'Monday',
      startTime: moment().hour(9).minute(0).toDate(),
      endTime: moment().hour(10).minute(0).toDate(),
      lectureType: 'Lecture',
      semester: 'Semester 1',
      course: 'Test Course',
      chapter: 'Chapter 1',
      description: 'Test lecture description',
      isActive: true
    };
    return { ...defaults, ...overrides };
  }

  static generateTestTeacher(overrides = {}) {
    const defaults = {
      name: `Test Teacher ${Date.now()}`,
      email: `teacher${Date.now()}@test.com`,
      department: 'Computer Science',
      phone: '+1234567890',
      office: 'Office 101',
      subjects: ['Computer Science', 'Programming'],
      experience: 5,
      qualifications: ['PhD Computer Science', 'MSc Programming'],
      profileImage: 'https://via.placeholder.com/150'
    };
    return { ...defaults, ...overrides };
  }

  static async cleanupTestData() {
    const Lecture = require('../models/Lecture');
    const Teacher = require('../models/Teacher');
    
    await Lecture.deleteMany({ 
      subject: { $regex: /^Test Subject/ }
    });
    
    await Teacher.deleteMany({ 
      name: { $regex: /^Test Teacher/ }
    });
  }

  static validateLectureData(lecture) {
    expect(lecture).to.have.property('subject');
    expect(lecture).to.have.property('teacher');
    expect(lecture).to.have.property('classroom');
    expect(lecture).to.have.property('dayOfWeek');
    expect(lecture).to.have.property('startTime');
    expect(lecture).to.have.property('endTime');
    expect(lecture).to.have.property('lectureType');
    expect(lecture).to.have.property('isActive');
  }

  static validateTeacherData(teacher) {
    expect(teacher).to.have.property('name');
    expect(teacher).to.have.property('email');
    expect(teacher).to.have.property('department');
    expect(teacher.subjects).to.be.an('array');
    expect(teacher.qualifications).to.be.an('array');
  }

  static generateTimeSlots() {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      slots.push({
        start: moment().hour(hour).minute(0).toDate(),
        end: moment().hour(hour + 1).minute(0).toDate()
      });
    }
    return slots;
  }

  static getDaysOfWeek() {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  }

  static async waitForServer(maxAttempts = 30) {
    const agent = chai.request(TEST_CONFIG.BASE_URL);
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await agent.get('/').timeout(1000);
        return true;
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return false;
  }
}

// Export for use in tests
module.exports = {
  chai,
  expect,
  TEST_CONFIG,
  TestUtils
};
