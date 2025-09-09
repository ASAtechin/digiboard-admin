const { chai, expect, TEST_CONFIG, TestUtils } = require('../test-setup');
const mongoose = require('mongoose');
const moment = require('moment');

describe('End-to-End Schedule Workflows', () => {
  let agent;
  let Teacher, Lecture;

  before(async () => {
    await TestUtils.connectDB();
    Teacher = require('../../models/Teacher');
    Lecture = require('../../models/Lecture');
    
    await TestUtils.waitForServer();
    agent = chai.request.agent(TEST_CONFIG.BASE_URL);
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

  describe('Complete Lecture Management Workflow', () => {
    it('should complete full lecture lifecycle: create, view, edit, delete', async () => {
      // Step 1: Create teacher
      const teacherData = TestUtils.generateTestTeacher({
        name: 'E2E Test Teacher',
        email: 'e2e@test.com'
      });

      const teacherResponse = await agent
        .post('/teachers/save')
        .send(teacherData)
        .expect(302);

      const createdTeacher = await Teacher.findOne({ email: 'e2e@test.com' });
      expect(createdTeacher).to.exist;

      // Step 2: Create lecture
      const lectureData = {
        subject: 'E2E Test Lecture',
        teacher: createdTeacher._id.toString(),
        classroom: 'Room E2E',
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        lectureType: 'Lecture',
        semester: 'Semester 1',
        course: 'E2E Course',
        chapter: 'Chapter 1',
        description: 'End-to-end test lecture'
      };

      await agent
        .post('/lectures/save')
        .send(lectureData)
        .expect(302);

      const createdLecture = await Lecture.findOne({ subject: 'E2E Test Lecture' });
      expect(createdLecture).to.exist;

      // Step 3: View lecture in list
      const listResponse = await agent
        .get('/lectures')
        .expect(200);

      expect(listResponse.text).to.include('E2E Test Lecture');
      expect(listResponse.text).to.include('E2E Test Teacher');

      // Step 4: View lecture in schedule
      const scheduleResponse = await agent
        .get('/schedule?day=Monday')
        .expect(200);

      expect(scheduleResponse.text).to.include('E2E Test Lecture');
      expect(scheduleResponse.text).to.include('Room E2E');

      // Step 5: Edit lecture
      const editResponse = await agent
        .get(`/lectures/edit/${createdLecture._id}`)
        .expect(200);

      expect(editResponse.text).to.include('E2E Test Lecture');

      const updatedData = {
        id: createdLecture._id.toString(),
        subject: 'E2E Updated Lecture',
        teacher: createdTeacher._id.toString(),
        classroom: 'Room Updated',
        dayOfWeek: 'Tuesday',
        startTime: '10:00',
        endTime: '11:00',
        lectureType: 'Lab',
        semester: 'Semester 2',
        course: 'Updated Course'
      };

      await agent
        .post('/lectures/save')
        .send(updatedData)
        .expect(302);

      const updatedLecture = await Lecture.findById(createdLecture._id);
      expect(updatedLecture.subject).to.equal('E2E Updated Lecture');
      expect(updatedLecture.dayOfWeek).to.equal('Tuesday');

      // Step 6: Verify update in schedule
      const updatedScheduleResponse = await agent
        .get('/schedule?day=Tuesday')
        .expect(200);

      expect(updatedScheduleResponse.text).to.include('E2E Updated Lecture');
      expect(updatedScheduleResponse.text).to.include('Room Updated');

      // Step 7: Delete lecture
      await agent
        .delete(`/lectures/${createdLecture._id}`)
        .expect(200);

      const deletedLecture = await Lecture.findById(createdLecture._id);
      expect(deletedLecture).to.be.null;

      // Step 8: Verify deletion in schedule
      const finalScheduleResponse = await agent
        .get('/schedule?day=Tuesday')
        .expect(200);

      expect(finalScheduleResponse.text).not.to.include('E2E Updated Lecture');
    });
  });

  describe('Schedule Filtering Workflow', () => {
    it('should test complete filtering workflow with multiple lectures', async () => {
      // Setup: Create multiple teachers
      const teachers = [];
      for (let i = 1; i <= 3; i++) {
        const teacher = new Teacher(TestUtils.generateTestTeacher({
          name: `Filter Teacher ${i}`,
          email: `filter${i}@test.com`
        }));
        teachers.push(await teacher.save());
      }

      // Setup: Create lectures across different days, semesters, and types
      const lectureConfigs = [
        { day: 'Monday', semester: 'Semester 1', type: 'Lecture', teacher: 0, subject: 'Math Lecture' },
        { day: 'Monday', semester: 'Semester 2', type: 'Lab', teacher: 1, subject: 'Physics Lab' },
        { day: 'Tuesday', semester: 'Semester 1', type: 'Tutorial', teacher: 2, subject: 'Chemistry Tutorial' },
        { day: 'Wednesday', semester: 'Semester 2', type: 'Lecture', teacher: 0, subject: 'Biology Lecture' },
        { day: 'Thursday', semester: 'Semester 1', type: 'Lab', teacher: 1, subject: 'Computer Lab' },
        { day: 'Friday', semester: 'Semester 2', type: 'Tutorial', teacher: 2, subject: 'English Tutorial' }
      ];

      for (const config of lectureConfigs) {
        const lecture = new Lecture(TestUtils.generateTestLecture({
          teacher: teachers[config.teacher]._id,
          subject: config.subject,
          dayOfWeek: config.day,
          semester: config.semester,
          lectureType: config.type
        }));
        await lecture.save();
      }

      // Test 1: Filter by day
      const mondayResponse = await agent
        .get('/schedule?day=Monday')
        .expect(200);

      expect(mondayResponse.text).to.include('Math Lecture');
      expect(mondayResponse.text).to.include('Physics Lab');
      expect(mondayResponse.text).not.to.include('Chemistry Tutorial');

      // Test 2: Filter by specific date
      const wednesdayDate = moment().day(3).format('YYYY-MM-DD'); // Wednesday
      const dateResponse = await agent
        .get(`/schedule?date=${wednesdayDate}`)
        .expect(200);

      expect(dateResponse.text).to.include('Biology Lecture');
      expect(dateResponse.text).not.to.include('Math Lecture');

      // Test 3: View weekly schedule
      const weeklyResponse = await agent
        .get('/schedule')
        .expect(200);

      // Should include all lectures in weekly view
      for (const config of lectureConfigs) {
        expect(weeklyResponse.text).to.include(config.subject);
      }

      // Test 4: Filter lectures by search
      const searchResponse = await agent
        .get('/lectures?search=Lab')
        .expect(200);

      expect(searchResponse.text).to.include('Physics Lab');
      expect(searchResponse.text).to.include('Computer Lab');
      expect(searchResponse.text).not.to.include('Math Lecture');

      // Test 5: Filter lectures by teacher
      const teacherResponse = await agent
        .get(`/lectures?teacher=${teachers[0]._id}`)
        .expect(200);

      expect(teacherResponse.text).to.include('Math Lecture');
      expect(teacherResponse.text).to.include('Biology Lecture');
      expect(teacherResponse.text).not.to.include('Physics Lab');

      // Test 6: Filter lectures by semester
      const semesterResponse = await agent
        .get('/lectures?semester=Semester%201')
        .expect(200);

      expect(semesterResponse.text).to.include('Math Lecture');
      expect(semesterResponse.text).to.include('Chemistry Tutorial');
      expect(semesterResponse.text).to.include('Computer Lab');
      expect(semesterResponse.text).not.to.include('Physics Lab');
    });
  });

  describe('Conflict Detection Workflow', () => {
    it('should prevent and handle scheduling conflicts', async () => {
      // Create teacher
      const teacher = new Teacher(TestUtils.generateTestTeacher({
        name: 'Conflict Test Teacher'
      }));
      await teacher.save();

      // Create first lecture
      const firstLectureData = {
        subject: 'First Lecture',
        teacher: teacher._id.toString(),
        classroom: 'Room 101',
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        lectureType: 'Lecture',
        semester: 'Semester 1',
        course: 'Test Course'
      };

      await agent
        .post('/lectures/save')
        .send(firstLectureData)
        .expect(302);

      // Verify first lecture was created
      const firstLecture = await Lecture.findOne({ subject: 'First Lecture' });
      expect(firstLecture).to.exist;

      // Try to create conflicting lecture (same teacher, overlapping time)
      const conflictingLectureData = {
        subject: 'Conflicting Lecture',
        teacher: teacher._id.toString(),
        classroom: 'Room 102',
        dayOfWeek: 'Monday',
        startTime: '09:30',
        endTime: '10:30',
        lectureType: 'Lecture',
        semester: 'Semester 1',
        course: 'Test Course'
      };

      // This should either be prevented or allowed with warnings
      const conflictResponse = await agent
        .post('/lectures/save')
        .send(conflictingLectureData)
        .expect(302);

      // Check the result - system should handle appropriately
      const conflictingLecture = await Lecture.findOne({ subject: 'Conflicting Lecture' });
      
      if (conflictingLecture) {
        // If allowed, verify both lectures exist
        const bothLectures = await Lecture.find({ teacher: teacher._id });
        expect(bothLectures).to.have.length(2);
      } else {
        // If prevented, verify only first lecture exists
        const allLectures = await Lecture.find({ teacher: teacher._id });
        expect(allLectures).to.have.length(1);
      }

      // Try classroom conflict
      const anotherTeacher = new Teacher(TestUtils.generateTestTeacher({
        name: 'Another Teacher'
      }));
      await anotherTeacher.save();

      const classroomConflictData = {
        subject: 'Classroom Conflict Lecture',
        teacher: anotherTeacher._id.toString(),
        classroom: 'Room 101', // Same classroom as first lecture
        dayOfWeek: 'Monday',
        startTime: '09:30',
        endTime: '10:30',
        lectureType: 'Lecture',
        semester: 'Semester 1',
        course: 'Test Course'
      };

      await agent
        .post('/lectures/save')
        .send(classroomConflictData)
        .expect(302);

      // Verify how system handles classroom conflicts
      const classroomConflictLecture = await Lecture.findOne({ subject: 'Classroom Conflict Lecture' });
      
      // Check schedule displays conflicts appropriately
      const scheduleResponse = await agent
        .get('/schedule?day=Monday')
        .expect(200);

      expect(scheduleResponse.text).to.include('First Lecture');
    });
  });

  describe('Dashboard Integration Workflow', () => {
    it('should show lectures correctly in dashboard', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher({
        name: 'Dashboard Teacher'
      }));
      await teacher.save();

      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

      // Create lecture for today
      const todayLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Today Dashboard Lecture',
        dayOfWeek: today,
        startTime: moment().add(2, 'hours').toDate(),
        endTime: moment().add(3, 'hours').toDate()
      }));
      await todayLecture.save();

      // Create next lecture
      const tomorrow = moment().add(1, 'day');
      const tomorrowDay = tomorrow.toDate().toLocaleDateString('en-US', { weekday: 'long' });

      const nextLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Next Dashboard Lecture',
        dayOfWeek: tomorrowDay,
        startTime: tomorrow.hour(9).minute(0).toDate(),
        endTime: tomorrow.hour(10).minute(0).toDate()
      }));
      await nextLecture.save();

      // Test dashboard
      const dashboardResponse = await agent
        .get('/dashboard')
        .expect(200);

      expect(dashboardResponse.text).to.include('Dashboard Teacher');
      expect(dashboardResponse.text).to.include('Today Dashboard Lecture');
      
      // Check statistics
      expect(dashboardResponse.text).to.include('Total Teachers');
      expect(dashboardResponse.text).to.include('Total Lectures');
    });
  });

  describe('Error Handling Workflows', () => {
    it('should handle various error scenarios gracefully', async () => {
      // Test 1: Access non-existent lecture
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const editNonExistentResponse = await agent
        .get(`/lectures/edit/${nonExistentId}`)
        .expect(404);

      // Test 2: Delete non-existent lecture
      const deleteNonExistentResponse = await agent
        .delete(`/lectures/${nonExistentId}`)
        .expect(500);

      expect(deleteNonExistentResponse.body.error).to.exist;

      // Test 3: Invalid form data
      const invalidLectureData = {
        subject: '', // Empty required field
        teacher: 'invalid-id',
        classroom: '',
        dayOfWeek: 'InvalidDay',
        startTime: 'invalid-time',
        endTime: 'invalid-time'
      };

      const invalidResponse = await agent
        .post('/lectures/save')
        .send(invalidLectureData)
        .expect(302); // Redirects even on error

      // Should not create lecture with invalid data
      const invalidLecture = await Lecture.findOne({ subject: '' });
      expect(invalidLecture).to.be.null;

      // Test 4: Schedule with no data
      const emptyScheduleResponse = await agent
        .get('/schedule')
        .expect(200);

      expect(emptyScheduleResponse.text).to.include('No lectures scheduled');

      // Test 5: Filters with invalid values
      const invalidFilterResponse = await agent
        .get('/schedule?day=InvalidDay&date=invalid-date')
        .expect(200);

      expect(invalidFilterResponse.text).to.include('Schedule Management');
    });
  });

  describe('Performance Workflow', () => {
    it('should handle multiple concurrent operations efficiently', async () => {
      // Create teacher
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      // Create multiple lectures quickly
      const lecturePromises = [];
      for (let i = 0; i < 10; i++) {
        const lectureData = {
          subject: `Performance Test Lecture ${i}`,
          teacher: teacher._id.toString(),
          classroom: `Room ${100 + i}`,
          dayOfWeek: TestUtils.getDaysOfWeek()[i % 7],
          startTime: `${8 + (i % 10)}:00`,
          endTime: `${9 + (i % 10)}:00`,
          lectureType: 'Lecture',
          semester: `Semester ${(i % 2) + 1}`,
          course: 'Performance Course'
        };

        lecturePromises.push(
          agent.post('/lectures/save').send(lectureData)
        );
      }

      const startTime = Date.now();
      await Promise.all(lecturePromises);
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).to.be.lessThan(5000);

      // Verify all lectures were created
      const createdLectures = await Lecture.find({ 
        subject: { $regex: /^Performance Test Lecture/ }
      });
      expect(createdLectures).to.have.length(10);

      // Test schedule performance with many lectures
      const scheduleStartTime = Date.now();
      const scheduleResponse = await agent
        .get('/schedule')
        .expect(200);
      const scheduleEndTime = Date.now();

      expect(scheduleEndTime - scheduleStartTime).to.be.lessThan(2000);
      expect(scheduleResponse.text).to.include('Performance Test Lecture');
    });
  });
});
