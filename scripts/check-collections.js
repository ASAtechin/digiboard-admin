const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // List all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 All collections in database:');
    collections.forEach(collection => {
      console.log('  -', collection.name);
    });
    
    // Check each collection's count
    console.log('\n📊 Document counts:');
    for (let collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`  ${collection.name}: ${count} documents`);
    }
    
    // Check if our models are pointing to the right collections
    const Teacher = require('./models/Teacher');
    const Lecture = require('./models/Lecture');
    
    console.log('\n🔍 Model collection names:');
    console.log('  Teacher model uses collection:', Teacher.collection.name);
    console.log('  Lecture model uses collection:', Lecture.collection.name);
    
    // Check actual data in the lecture collection
    console.log('\n📚 Recent lectures in collection:');
    const recentLectures = await Lecture.find().sort({ createdAt: -1 }).limit(5);
    console.log('  Total lectures found:', recentLectures.length);
    recentLectures.forEach((lecture, index) => {
      console.log(`  ${index + 1}. ${lecture.subject} (Created: ${lecture.createdAt || 'No timestamp'})`);
    });
    
    // Test if we can create a lecture and see it immediately
    console.log('\n🧪 Testing real-time lecture creation...');
    const teacher = await Teacher.findOne();
    if (teacher) {
      const testLecture = new Lecture({
        subject: 'REAL-TIME TEST ' + Date.now(),
        teacher: teacher._id,
        classroom: 'TEST ROOM',
        dayOfWeek: 'Monday',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        semester: 'XII',
        course: 'Test Course'
      });
      
      const saved = await testLecture.save();
      console.log('✅ Test lecture created:', saved._id);
      
      // Check if it appears in queries immediately
      const allLectures = await Lecture.find();
      const foundTest = allLectures.find(l => l._id.toString() === saved._id.toString());
      
      if (foundTest) {
        console.log('✅ Test lecture found in query immediately');
      } else {
        console.log('❌ Test lecture NOT found in query!');
      }
      
      // Check total count
      const totalCount = await Lecture.countDocuments();
      console.log('📊 Total lecture count after creation:', totalCount);
      
      // Clean up
      await Lecture.findByIdAndDelete(saved._id);
      const finalCount = await Lecture.countDocuments();
      console.log('📊 Final count after cleanup:', finalCount);
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkCollections();
