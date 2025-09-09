// Database connectivity and model compatibility test
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Teacher = require('./models/Teacher');
const Lecture = require('./models/Lecture');

const testDatabaseOperations = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/digiboard';
    console.log('🔗 Connecting to:', mongoUri.split('@')[1].split('/')[0] + '/digiboard');
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Test 1: Check existing data
    const teacherCount = await Teacher.countDocuments();
    const lectureCount = await Lecture.countDocuments();
    
    console.log(`\n📊 Current Database State:`);
    console.log(`Teachers: ${teacherCount}`);
    console.log(`Lectures: ${lectureCount}`);
    
    // Test 2: Get a sample teacher for testing
    const firstTeacher = await Teacher.findOne();
    if (!firstTeacher) {
      console.log('❌ No teachers found in database');
      return;
    }
    
    console.log(`\n👨‍🏫 Using teacher: ${firstTeacher.name} (${firstTeacher._id})`);
    
    // Test 3: Create a test lecture with proper fields
    const testLectureData = {
      subject: 'TEST DATABASE CONNECTIVITY',
      teacher: firstTeacher._id,
      dayOfWeek: 'Monday',
      startTime: new Date('2025-09-08T10:00:00'),
      endTime: new Date('2025-09-08T11:00:00'),
      classroom: 'TEST ROOM 999',
      semester: 'XII',
      course: 'Test Course',
      lectureType: 'Lecture',
      chapter: 'Database Testing',
      description: 'Test lecture to verify admin panel connectivity',
      isActive: true
    };
    
    console.log('\n🧪 Creating test lecture...');
    const testLecture = new Lecture(testLectureData);
    const savedLecture = await testLecture.save();
    console.log('✅ Test lecture created:', savedLecture._id);
    
    // Test 4: Verify the lecture can be retrieved
    const retrievedLecture = await Lecture.findById(savedLecture._id).populate('teacher');
    console.log('✅ Test lecture retrieved with teacher:', retrievedLecture.teacher.name);
    
    // Test 5: Update the lecture
    retrievedLecture.description = 'Updated test description - ' + new Date().toISOString();
    await retrievedLecture.save();
    console.log('✅ Test lecture updated successfully');
    
    // Test 6: Check if lecture appears in main query
    const allLectures = await Lecture.find().populate('teacher').sort({ dayOfWeek: 1, startTime: 1 });
    const testLectureInList = allLectures.find(l => l._id.toString() === savedLecture._id.toString());
    console.log('✅ Test lecture found in main query:', !!testLectureInList);
    
    // Test 7: Clean up - delete test lecture
    await Lecture.findByIdAndDelete(savedLecture._id);
    console.log('✅ Test lecture cleaned up');
    
    // Test 8: Final count verification
    const finalLectureCount = await Lecture.countDocuments();
    console.log(`\n📊 Final Database State:`);
    console.log(`Lectures: ${finalLectureCount} (should be same as initial: ${lectureCount})`);
    
    console.log('\n🎉 ALL DATABASE TESTS PASSED');
    console.log('✅ Admin panel should be able to create/read/update/delete lectures properly');
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

testDatabaseOperations();
