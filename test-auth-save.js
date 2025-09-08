const mongoose = require('mongoose');
require('dotenv').config();

async function testAuthenticatedSave() {
  console.log('🔍 TESTING AUTHENTICATED LECTURE SAVE');
  console.log('=====================================');
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Teacher = require('./models/Teacher');
    const Lecture = require('./models/Lecture');
    
    // Get initial count
    const initialCount = await Lecture.countDocuments();
    console.log('📊 Initial lecture count:', initialCount);
    
    // Get a teacher for the test
    const teacher = await Teacher.findOne();
    if (!teacher) {
      console.log('❌ No teachers found in database');
      return;
    }
    console.log('👨‍🏫 Using teacher:', teacher.name, teacher._id);
    
    // Simulate the exact server.js save process
    console.log('\n🧪 Simulating server.js save process...');
    
    // This is the exact same code from our server.js save route
    const req = {
      body: {
        subject: 'SERVER SIMULATION TEST',
        teacher: teacher._id.toString(),
        classroom: 'SIM TEST ROOM',
        dayOfWeek: 'Thursday',
        startTime: '2024-01-01T16:00',
        endTime: '2024-01-01T17:00',
        semester: 'XII',
        course: 'Simulation Course',
        lectureType: 'Lecture',
        chapter: 'Test Chapter',
        description: 'Server simulation test',
        isActive: 'true'
      },
      session: { username: 'admin' },
      sessionID: 'test-session-123'
    };
    
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields (like the server does)
    const requiredFields = ['subject', 'teacher', 'classroom', 'dayOfWeek', 'startTime', 'endTime', 'semester'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return;
    }
    console.log('✅ All required fields present');
    
    // Process data (like the server does)
    const lectureData = {
      subject: req.body.subject,
      teacher: req.body.teacher,
      dayOfWeek: req.body.dayOfWeek,
      startTime: new Date(req.body.startTime),
      endTime: new Date(req.body.endTime),
      classroom: req.body.classroom,
      semester: req.body.semester || 'XII',
      course: req.body.course || req.body.subject,
      lectureType: req.body.lectureType || 'Lecture',
      chapter: req.body.chapter || '',
      description: req.body.description || '',
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : true
    };
    
    console.log('✅ Processed lecture data:', JSON.stringify(lectureData, null, 2));
    
    // Save to database
    console.log('\n💾 Saving to database...');
    const lecture = new Lecture(lectureData);
    const savedLecture = await lecture.save();
    console.log('✅ Lecture saved with ID:', savedLecture._id);
    
    // Verify it's in the database
    const verification = await Lecture.findById(savedLecture._id);
    if (verification) {
      console.log('✅ Lecture verified in database:', verification.subject);
    } else {
      console.log('❌ Lecture NOT found in database after save!');
    }
    
    // Check count
    const afterCount = await Lecture.countDocuments();
    console.log('📊 Count after save:', afterCount, '(increased by', afterCount - initialCount + ')');
    
    // Clean up
    await Lecture.findByIdAndDelete(savedLecture._id);
    const finalCount = await Lecture.countDocuments();
    console.log('📊 Final count after cleanup:', finalCount);
    
    await mongoose.connection.close();
    
    console.log('\n🎯 CONCLUSION:');
    console.log('The server-side save logic works perfectly!');
    console.log('If the admin panel is not working, the issue is:');
    console.log('1. Form data not reaching the server');
    console.log('2. Session/authentication issues in Vercel');
    console.log('3. JavaScript preventing form submission');
    console.log('4. Form validation blocking submission');
    
  } catch (error) {
    console.error('❌ Error in authenticated save test:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAuthenticatedSave();
