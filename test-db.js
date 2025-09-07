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
    
    // Get detailed teacher data
    console.log('\n👨‍🏫 Teachers (Detailed):');
    const teachers = await Teacher.find({}).limit(5);
    teachers.forEach((teacher, index) => {
      console.log(`${index + 1}. ${teacher.name}`);
      console.log(`   Email: ${teacher.email}`);
      console.log(`   Department: ${teacher.department}`);
      console.log(`   Subjects: ${teacher.subjects || 'None'}`);
      console.log(`   Phone: ${teacher.phone || 'Not provided'}`);
      console.log(`   Office: ${teacher.office || 'Not provided'}`);
      console.log(`   Experience: ${teacher.experience || 0} years`);
      console.log('   ---');
    });
    
    // Get detailed lecture data
    console.log('\n📚 Lectures (Detailed):');
    const lectures = await Lecture.find({}).populate('teacher').limit(5);
    lectures.forEach((lecture, index) => {
      const teacherName = lecture.teacher ? lecture.teacher.name : 'No teacher assigned';
      console.log(`${index + 1}. ${lecture.subject}`);
      console.log(`   Day: ${lecture.dayOfWeek}`);
      console.log(`   Time: ${lecture.startTime} - ${lecture.endTime}`);
      console.log(`   Teacher: ${teacherName}`);
      console.log(`   Room: ${lecture.room || 'Not specified'}`);
      console.log(`   Active: ${lecture.isActive}`);
      console.log('   ---');
    });
    
    // Test specific queries that the dashboard uses
    console.log('\n🔍 Testing Dashboard Queries:');
    
    // Test teacher query
    const dashboardTeachers = await Teacher.find({}).sort({ name: 1 });
    console.log(`Dashboard Teachers Query: ${dashboardTeachers.length} teachers found`);
    
    // Test lecture query
    const dashboardLectures = await Lecture.find({}).populate('teacher');
    console.log(`Dashboard Lectures Query: ${dashboardLectures.length} lectures found`);
    
    // Test next lecture logic
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    console.log(`Current day: ${currentDay}`);
    
    const todayLectures = await Lecture.find({ dayOfWeek: currentDay });
    console.log(`Lectures today (${currentDay}): ${todayLectures.length}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Database test completed');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

testDatabase();
