// Quick database test script
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Teacher = require('./models/Teacher');
const Lecture = require('./models/Lecture');

const testDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/digiboard';
    console.log('Connecting to:', mongoUri.split('@')[1].split('/')[0] + '/digiboard');
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Count documents
    const teacherCount = await Teacher.countDocuments();
    const lectureCount = await Lecture.countDocuments();
    
    console.log(`\n📊 Database Statistics:`);
    console.log(`Teachers: ${teacherCount}`);
    console.log(`Lectures: ${lectureCount}`);
    
    // Get sample data
    console.log('\n👨‍🏫 Teachers:');
    const teachers = await Teacher.find({}).limit(5);
    teachers.forEach(teacher => {
      console.log(`- ${teacher.name} (${teacher.subject}) - ${teacher.email}`);
    });
    
    console.log('\n📚 Lectures:');
    const lectures = await Lecture.find({}).populate('teacher').limit(5);
    lectures.forEach(lecture => {
      const teacherName = lecture.teacher ? lecture.teacher.name : 'No teacher assigned';
      console.log(`- ${lecture.subject} | ${lecture.dayOfWeek} ${lecture.startTime} | ${teacherName}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Database test completed');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
};

testDatabase();
