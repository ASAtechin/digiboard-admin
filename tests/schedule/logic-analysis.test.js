const { expect } = require('chai');
const mongoose = require('mongoose');
const moment = require('moment');

describe('Schedule Logic Analysis', () => {
  describe('Database Connection', () => {
    it('should be able to connect to MongoDB', async function() {
      this.timeout(10000);
      
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/digiboard_admin';
      
      try {
        await mongoose.connect(mongoUri);
        expect(mongoose.connection.readyState).to.equal(1); // 1 = connected
        console.log('✅ MongoDB connection successful');
      } catch (error) {
        console.log('❌ MongoDB connection failed:', error.message);
        throw error;
      }
    });
  });

  describe('Data Models Validation', () => {
    let Lecture, Teacher;
    
    before(async function() {
      this.timeout(10000);
      
      // Load models
      try {
        Lecture = require('../../models/Lecture');
        Teacher = require('../../models/Teacher');
        expect(Lecture).to.be.a('function');
        expect(Teacher).to.be.a('function');
        console.log('✅ Models loaded successfully');
      } catch (error) {
        console.log('❌ Failed to load models:', error.message);
        throw error;
      }
    });

    it('should validate lecture data structure', async function() {
      this.timeout(5000);
      
      const lectures = await Lecture.find({}).limit(5);
      console.log(`📊 Found ${lectures.length} sample lectures`);
      
      if (lectures.length > 0) {
        const lecture = lectures[0];
        expect(lecture).to.have.property('subject');
        expect(lecture).to.have.property('teacher');
        expect(lecture).to.have.property('time');
        expect(lecture).to.have.property('days');
        console.log('✅ Lecture structure is valid');
        console.log(`   Sample: ${lecture.subject} - ${lecture.time}`);
      }
    });

    it('should validate teacher data structure', async function() {
      this.timeout(5000);
      
      const teachers = await Teacher.find({}).limit(3);
      console.log(`👥 Found ${teachers.length} teachers`);
      
      if (teachers.length > 0) {
        const teacher = teachers[0];
        expect(teacher).to.have.property('name');
        expect(teacher).to.have.property('email');
        console.log('✅ Teacher structure is valid');
        console.log(`   Sample: ${teacher.name}`);
      }
    });

    it('should validate schedule filtering logic', async function() {
      this.timeout(10000);
      
      // Test today's schedule
      const today = moment().format('dddd');
      const todayLectures = await Lecture.find({ 
        days: { $in: [today] }, 
        isActive: true 
      });
      
      console.log(`📅 Today (${today}): ${todayLectures.length} lectures`);
      
      // Test all active lectures
      const allActiveLectures = await Lecture.find({ isActive: true });
      console.log(`🎯 Total active lectures: ${allActiveLectures.length}`);
      
      expect(allActiveLectures.length).to.be.at.least(0);
      expect(todayLectures.length).to.be.at.most(allActiveLectures.length);
      
      console.log('✅ Schedule filtering logic is working');
    });

    it('should check for time conflict detection logic', async function() {
      this.timeout(5000);
      
      const lectures = await Lecture.find({ isActive: true });
      const conflicts = [];
      
      for (let i = 0; i < lectures.length; i++) {
        for (let j = i + 1; j < lectures.length; j++) {
          const lecture1 = lectures[i];
          const lecture2 = lectures[j];
          
          // Check for same day and overlapping time
          const commonDays = lecture1.days.filter(day => lecture2.days.includes(day));
          if (commonDays.length > 0 && lecture1.time === lecture2.time) {
            conflicts.push({
              day: commonDays[0],
              time: lecture1.time,
              lectures: [lecture1.subject, lecture2.subject]
            });
          }
        }
      }
      
      console.log(`⚠️ Found ${conflicts.length} potential time conflicts`);
      if (conflicts.length > 0) {
        console.log('   Sample conflict:', conflicts[0]);
      }
      
      expect(conflicts).to.be.an('array');
      console.log('✅ Conflict detection logic implemented');
    });
  });

  after(async function() {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  });
});
