const mongoose = require('mongoose');
const express = require('express');
require('dotenv').config();

async function simulateFormSubmission() {
  try {
    console.log('🧪 SIMULATING ADMIN PANEL FORM SUBMISSION');
    console.log('==========================================');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Teacher = require('./models/Teacher');
    const Lecture = require('./models/Lecture');
    
    // Get initial count
    const initialCount = await Lecture.countDocuments();
    console.log('📊 Initial lecture count:', initialCount);
    
    // Get a teacher
    const teacher = await Teacher.findOne();
    console.log('👨‍🏫 Using teacher:', teacher.name);
    
    // Simulate the exact form data that would be submitted
    const formData = {
      subject: 'ADMIN PANEL FORM TEST',
      teacher: teacher._id.toString(),
      classroom: 'FORM TEST ROOM',
      dayOfWeek: 'Wednesday',
      startTime: '2024-01-01T15:00',
      endTime: '2024-01-01T16:00',
      semester: 'XII',
      course: 'Form Test Course',
      lectureType: 'Lecture',
      chapter: 'Form Test Chapter',
      description: 'Testing form submission process',
      isActive: 'true'
    };
    
    console.log('📝 Form data to be submitted:', formData);
    
    // Process the data exactly like the server does
    console.log('\n🔄 Processing form data...');
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
    
    console.log('✅ Processed lecture data:', lectureData);
    
    // Save to database (like the server does)
    console.log('\n💾 Saving to database...');
    const lecture = new Lecture(lectureData);
    const saved = await lecture.save();
    console.log('✅ Lecture saved with ID:', saved._id);
    
    // Check the count after save
    const afterSaveCount = await Lecture.countDocuments();
    console.log('📊 Lecture count after save:', afterSaveCount);
    console.log('📈 Count increased by:', afterSaveCount - initialCount);
    
    // Simulate what the admin panel lectures page would query
    console.log('\n🔍 Simulating admin panel lectures page query...');
    const lecturesPageQuery = await Lecture.find().populate('teacher').sort({ dayOfWeek: 1, startTime: 1 });
    console.log('📚 Total lectures in admin panel view:', lecturesPageQuery.length);
    
    // Find our test lecture in the results
    const ourLecture = lecturesPageQuery.find(l => l._id.toString() === saved._id.toString());
    if (ourLecture) {
      console.log('✅ Our test lecture appears in admin panel query');
      console.log('   Subject:', ourLecture.subject);
      console.log('   Teacher:', ourLecture.teacher.name);
      console.log('   Day:', ourLecture.dayOfWeek);
    } else {
      console.log('❌ Our test lecture does NOT appear in admin panel query!');
    }
    
    // Test the cache-busting redirect simulation
    console.log('\n🔄 Simulating redirect with cache-busting...');
    const timestamp = Date.now();
    console.log('   Redirect URL would be: /lectures?updated=' + timestamp);
    
    // Wait a moment and query again (simulate page reload)
    await new Promise(resolve => setTimeout(resolve, 1000));
    const afterRedirectQuery = await Lecture.find().populate('teacher').sort({ dayOfWeek: 1, startTime: 1 });
    console.log('📚 Lectures after simulated redirect:', afterRedirectQuery.length);
    
    // Clean up
    await Lecture.findByIdAndDelete(saved._id);
    const finalCount = await Lecture.countDocuments();
    console.log('\n🧹 Cleaned up test lecture');
    console.log('📊 Final count:', finalCount, '(should be', initialCount + ')');
    
    await mongoose.connection.close();
    
    console.log('\n🎯 CONCLUSION:');
    console.log('If this test works but your admin panel does not:');
    console.log('1. Check browser cache (hard refresh: Ctrl+F5)');
    console.log('2. Check if form actually submits (network tab in browser)');
    console.log('3. Check Vercel function logs for errors');
    console.log('4. Verify you are looking at the right admin panel URL');
    
  } catch (error) {
    console.error('❌ Error in simulation:', error.message);
    console.error('Stack:', error.stack);
  }
}

simulateFormSubmission();
