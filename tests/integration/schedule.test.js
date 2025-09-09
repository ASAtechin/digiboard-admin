const { chai, expect, TEST_CONFIG, TestUtils } = require('../test-setup');
const app = require('../../server');
const mongoose = require('mongoose');
const moment = require('moment');

describe('Schedule API Integration Tests', () => {
  let agent;
  let Teacher, Lecture;

  before(async () => {
    await TestUtils.connectDB();
    Teacher = require('../../models/Teacher');
    Lecture = require('../../models/Lecture');
    
    // Wait for server to be ready
    await TestUtils.waitForServer();
    agent = chai.request.agent(TEST_CONFIG.BASE_URL);
    
    // Login once for all tests
    await TestUtils.loginAdmin(agent);
  });

  after(async () => {
    await TestUtils.cleanupTestData();
    agent.close();
    await TestUtils.disconnectDB();
  });

  beforeEach(async () => {
    await TestUtils.cleanupTestData();
  });

  describe('GET /schedule - Schedule Display', () => {
    it('should display empty schedule when no lectures exist', async () => {
      const response = await agent
        .get('/schedule')
        .expect(200);

      expect(response.text).to.include('No lectures scheduled');
      expect(response.text).to.include('Schedule Management');
    });

    it('should display lectures for current day', async () => {
      // Create test teacher and lecture
      const teacher = new Teacher(TestUtils.generateTestTeacher({
        name: 'Integration Test Teacher'
      }));
      await teacher.save();

      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const lecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Integration Test Lecture',
        dayOfWeek: today,
        startTime: moment().hour(9).minute(0).toDate(),
        endTime: moment().hour(10).minute(0).toDate()
      }));
      await lecture.save();

      const response = await agent
        .get('/schedule')
        .expect(200);

      expect(response.text).to.include('Integration Test Lecture');
      expect(response.text).to.include('Integration Test Teacher');
      expect(response.text).to.include('9:00 AM');
    });

    it('should filter lectures by specific date', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      // Create lectures for different days
      const mondayLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Monday Lecture',
        dayOfWeek: 'Monday'
      }));

      const tuesdayLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Tuesday Lecture',
        dayOfWeek: 'Tuesday'
      }));

      await mondayLecture.save();
      await tuesdayLecture.save();

      // Test filtering by Monday
      const mondayDate = moment().day(1).format('YYYY-MM-DD'); // Monday
      const response = await agent
        .get(`/schedule?date=${mondayDate}`)
        .expect(200);

      expect(response.text).to.include('Monday Lecture');
      expect(response.text).not.to.include('Tuesday Lecture');
    });

    it('should filter lectures by day of week', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const wednesdayLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Wednesday Special Lecture',
        dayOfWeek: 'Wednesday'
      }));
      await wednesdayLecture.save();

      const response = await agent
        .get('/schedule?day=Wednesday')
        .expect(200);

      expect(response.text).to.include('Wednesday Special Lecture');
      expect(response.text).to.include('Wednesday');
    });

    it('should display weekly schedule grid', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      // Create lectures for each day of the week
      const days = TestUtils.getDaysOfWeek();
      for (const day of days) {
        const lecture = new Lecture(TestUtils.generateTestLecture({
          teacher: teacher._id,
          subject: `${day} Lecture`,
          dayOfWeek: day
        }));
        await lecture.save();
      }

      const response = await agent
        .get('/schedule')
        .expect(200);

      // Check that all days are present in weekly view
      for (const day of days) {
        expect(response.text).to.include(`${day} Lecture`);
      }
    });
  });

  describe('Schedule Filtering Logic', () => {
    it('should handle multiple filter combinations', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const fridayLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Friday Combined Filter Test',
        dayOfWeek: 'Friday'
      }));
      await fridayLecture.save();

      // Test date filter overriding day filter
      const fridayDate = moment().day(5).format('YYYY-MM-DD'); // Friday
      const response = await agent
        .get(`/schedule?date=${fridayDate}&day=Monday`)
        .expect(200);

      // Should show Friday lecture because date filter takes precedence
      expect(response.text).to.include('Friday Combined Filter Test');
    });

    it('should handle invalid date formats gracefully', async () => {
      const response = await agent
        .get('/schedule?date=invalid-date')
        .expect(200);

      // Should still render page without errors
      expect(response.text).to.include('Schedule Management');
    });

    it('should handle invalid day values gracefully', async () => {
      const response = await agent
        .get('/schedule?day=InvalidDay')
        .expect(200);

      // Should still render page without errors
      expect(response.text).to.include('Schedule Management');
    });
  });

  describe('Next Lecture Logic', () => {
    it('should find next lecture correctly', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const now = new Date();
      const today = now.toLocaleDateString('en-US', { weekday: 'long' });

      // Create a lecture later today
      const nextLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Next Lecture Test',
        dayOfWeek: today,
        startTime: moment().add(2, 'hours').toDate(),
        endTime: moment().add(3, 'hours').toDate()
      }));
      await nextLecture.save();

      const response = await agent
        .get('/schedule')
        .expect(200);

      expect(response.text).to.include('Next Lecture Test');
    });

    it('should find next lecture in upcoming days when none today', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      // Create lecture for tomorrow
      const tomorrow = moment().add(1, 'day').toDate();
      const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });

      const tomorrowLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Tomorrow Lecture Test',
        dayOfWeek: tomorrowDay,
        startTime: moment().add(1, 'day').hour(9).minute(0).toDate(),
        endTime: moment().add(1, 'day').hour(10).minute(0).toDate()
      }));
      await tomorrowLecture.save();

      const response = await agent
        .get('/schedule')
        .expect(200);

      // Should show next lecture info
      expect(response.text).to.include('Next Lecture');
    });
  });

  describe('Schedule Data Integrity', () => {
    it('should handle lectures with missing teacher references', async () => {
      // Create lecture with invalid teacher ID
      const lecture = new Lecture(TestUtils.generateTestLecture({
        teacher: new mongoose.Types.ObjectId(), // Non-existent teacher
        subject: 'Orphaned Lecture'
      }));
      await lecture.save();

      const response = await agent
        .get('/schedule')
        .expect(200);

      expect(response.text).to.include('Orphaned Lecture');
      expect(response.text).to.include('TBA'); // Should show TBA for missing teacher
    });

    it('should handle lectures with null teacher references', async () => {
      const lecture = new Lecture(TestUtils.generateTestLecture({
        teacher: null,
        subject: 'No Teacher Lecture'
      }));
      await lecture.save();

      const response = await agent
        .get('/schedule')
        .expect(200);

      expect(response.text).to.include('No Teacher Lecture');
      expect(response.text).to.include('TBA');
    });

    it('should display lectures sorted by time', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

      // Create lectures in reverse time order
      const lecture1 = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Late Lecture',
        dayOfWeek: today,
        startTime: moment().hour(15).minute(0).toDate(),
        endTime: moment().hour(16).minute(0).toDate()
      }));

      const lecture2 = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Early Lecture',
        dayOfWeek: today,
        startTime: moment().hour(9).minute(0).toDate(),
        endTime: moment().hour(10).minute(0).toDate()
      }));

      await lecture1.save();
      await lecture2.save();

      const response = await agent
        .get('/schedule')
        .expect(200);

      const earlyIndex = response.text.indexOf('Early Lecture');
      const lateIndex = response.text.indexOf('Late Lecture');

      // Early lecture should appear before late lecture
      expect(earlyIndex).to.be.lessThan(lateIndex);
    });
  });

  describe('Schedule Performance', () => {
    it('should handle large number of lectures efficiently', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      // Create 50 lectures
      const lectures = [];
      for (let i = 0; i < 50; i++) {
        const lecture = new Lecture(TestUtils.generateTestLecture({
          teacher: teacher._id,
          subject: `Performance Test Lecture ${i}`,
          dayOfWeek: TestUtils.getDaysOfWeek()[i % 7],
          startTime: moment().hour(8 + (i % 10)).minute(0).toDate(),
          endTime: moment().hour(9 + (i % 10)).minute(0).toDate()
        }));
        lectures.push(lecture);
      }

      await Lecture.insertMany(lectures);

      const startTime = Date.now();
      const response = await agent
        .get('/schedule')
        .expect(200);
      const endTime = Date.now();

      // Should respond within reasonable time (< 2 seconds)
      expect(endTime - startTime).to.be.lessThan(2000);
      expect(response.text).to.include('Schedule Management');
    });
  });
});
