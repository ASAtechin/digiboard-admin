const mongoose = require('mongoose');
require('dotenv').config();

async function testRealTimeUpdates() {
  try {
    console.log('🔄 REAL-TIME UPDATE TEST');
    console.log('========================');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Teacher = require('./models/Teacher');
    const Lecture = require('./models/Lecture');
    
    console.log('\n📊 Current Status:');
    
    // Function to get current lecture count and list recent lectures
    async function getCurrentStatus() {
      const count = await Lecture.countDocuments();
      const recent = await Lecture.find().sort({ createdAt: -1 }).limit(3).populate('teacher');
      
      console.log(`   Total lectures: ${count}`);
      console.log('   Recent lectures:');
      recent.forEach((lecture, i) => {
        console.log(`     ${i+1}. ${lecture.subject} (${lecture.createdAt ? lecture.createdAt.toISOString().slice(0,19) : 'No date'})`);
      });
      
      return { count, recent };
    }
    
    // Get initial status
    const initial = await getCurrentStatus();
    
    console.log('\n⏱️  Monitoring for changes...');
    console.log('   (This will check every 2 seconds for 30 seconds)');
    console.log('   Now try adding a lecture in your admin panel!');
    
    let previousCount = initial.count;
    let checks = 0;
    const maxChecks = 15; // 30 seconds of monitoring
    
    const monitor = setInterval(async () => {
      checks++;
      
      try {
        const current = await Lecture.countDocuments();
        
        if (current !== previousCount) {
          console.log(`\n🎉 CHANGE DETECTED! Count changed from ${previousCount} to ${current}`);
          
          // Get the new lectures
          const newLectures = await Lecture.find().sort({ createdAt: -1 }).limit(3).populate('teacher');
          console.log('   New recent lectures:');
          newLectures.forEach((lecture, i) => {
            console.log(`     ${i+1}. ${lecture.subject} by ${lecture.teacher ? lecture.teacher.name : 'Unknown'}`);
          });
          
          previousCount = current;
        } else {
          process.stdout.write('.');
        }
        
        if (checks >= maxChecks) {
          clearInterval(monitor);
          console.log(`\n\n📋 Final Status after ${maxChecks * 2} seconds:`);
          await getCurrentStatus();
          
          if (previousCount === initial.count) {
            console.log('\n⚠️  No changes detected during monitoring period.');
            console.log('   This could mean:');
            console.log('   1. Form submission is not reaching the server');
            console.log('   2. There are authentication/session issues');
            console.log('   3. JavaScript errors preventing form submission');
            console.log('   4. Form validation errors');
          } else {
            console.log('\n✅ Changes were detected! The admin panel IS updating the database.');
          }
          
          await mongoose.connection.close();
        }
      } catch (error) {
        console.error('\\nError during monitoring:', error.message);
        clearInterval(monitor);
        await mongoose.connection.close();
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRealTimeUpdates();
