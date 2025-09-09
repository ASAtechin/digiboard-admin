const mongoose = require('mongoose');
require('dotenv').config();

async function fullDiagnostic() {
  try {
    console.log('🔍 ADMIN PANEL DIAGNOSTIC TEST');
    console.log('================================');
    
    // Test 1: Database Connection
    console.log('\n1. Testing Database Connection...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    
    // Test 2: Models Loading
    console.log('\n2. Testing Models...');
    const Teacher = require('./models/Teacher');
    const Lecture = require('./models/Lecture');
    console.log('✅ Models loaded successfully');
    
    // Test 3: Data Existence
    console.log('\n3. Checking Existing Data...');
    const teacherCount = await Teacher.countDocuments();
    const lectureCount = await Lecture.countDocuments();
    console.log(`Teachers: ${teacherCount}`);
    console.log(`Lectures: ${lectureCount}`);
    
    if (teacherCount === 0) {
      console.log('❌ No teachers found! This could be the issue.');
      return;
    }
    
    // Test 4: Get a teacher for testing
    console.log('\n4. Testing Teacher Retrieval...');
    const teacher = await Teacher.findOne();
    console.log(`✅ Teacher found: ${teacher.name} (${teacher._id})`);
    
    // Test 5: Create lecture with exact form data structure
    console.log('\n5. Testing Lecture Creation (Form Data Simulation)...');
    
    // This simulates the exact data that would come from the form
    const formData = {
      subject: 'DIAGNOSTIC TEST LECTURE',
      teacher: teacher._id.toString(), // Form sends as string
      classroom: 'DIAGNOSTIC ROOM',
      dayOfWeek: 'Tuesday',
      startTime: '2024-01-01T14:00', // Form format
      endTime: '2024-01-01T15:00',   // Form format
      semester: 'XII',
      course: 'Diagnostic Course',
      lectureType: 'Lecture',
      chapter: 'Test Chapter',
      description: 'Diagnostic test lecture',
      isActive: 'true' // Form sends as string
    };
    
    console.log('Form data:', formData);
    
    // Process data like the server does
    const lectureData = {
      subject: formData.subject,
      teacher: formData.teacher,
      dayOfWeek: formData.dayOfWeek,
      startTime: new Date(formData.startTime),
      endTime: new Date(formData.endTime),
      classroom: formData.classroom,
      semester: formData.semester || 'XII',
      course: formData.course || formData.subject,
      lectureType: formData.lectureType || 'Lecture',
      chapter: formData.chapter || '',
      description: formData.description || '',
      isActive: formData.isActive !== undefined ? formData.isActive === 'true' : true
    };
    
    console.log('Processed data:', lectureData);
    
    // Create and save
    const lecture = new Lecture(lectureData);
    const saved = await lecture.save();
    console.log(`✅ Diagnostic lecture created: ${saved._id}`);
    
    // Test 6: Verify it's in the database
    console.log('\n6. Verifying Lecture in Database...');
    const found = await Lecture.findById(saved._id).populate('teacher');
    console.log(`✅ Found: ${found.subject} by ${found.teacher.name}`);
    
    // Test 7: Check if it appears in main query (like the lectures page)
    console.log('\n7. Testing Main Lectures Query...');
    const allLectures = await Lecture.find().populate('teacher').sort({ dayOfWeek: 1, startTime: 1 });
    const ourLecture = allLectures.find(l => l._id.toString() === saved._id.toString());
    
    if (ourLecture) {
      console.log(`✅ Lecture appears in main query: ${ourLecture.subject}`);
    } else {
      console.log('❌ Lecture NOT found in main query!');
    }
    
    // Test 8: Clean up
    await Lecture.findByIdAndDelete(saved._id);
    console.log('\n8. ✅ Test lecture cleaned up');
    
    // Final count
    const finalCount = await Lecture.countDocuments();
    console.log(`\n📊 Final lecture count: ${finalCount} (should be ${lectureCount})`);
    
    await mongoose.connection.close();
    
    console.log('\n🎉 DIAGNOSTIC COMPLETE - All database operations working!');
    console.log('\nIf admin panel is not working, the issue is likely:');
    console.log('1. Form submission not reaching the server');
    console.log('2. Authentication/session issues');
    console.log('3. JavaScript errors preventing form submission');
    console.log('4. Vercel deployment not updated with latest code');
    
  } catch (error) {
    console.error('\n❌ DIAGNOSTIC FAILED:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.errors) {
      console.error('\nValidation Errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  ${key}: ${error.errors[key].message}`);
      });
    }
  }
}

fullDiagnostic();
