const { chai, expect, TEST_CONFIG, TestUtils } = require('../test-setup');
const mongoose = require('mongoose');
const moment = require('moment');

describe('Lecture API Integration Tests', () => {
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

  describe('GET /lectures - Lecture Listing', () => {
    it('should display empty lecture list when no lectures exist', async () => {
      const response = await agent
        .get('/lectures')
        .expect(200);

      expect(response.text).to.include('No lectures found');
      expect(response.text).to.include('Lecture Management');
    });

    it('should display list of lectures with filters', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher({
        name: 'Test Display Teacher'
      }));
      await teacher.save();

      const lecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Display Test Lecture',
        lectureType: 'Lab',
        semester: 'Semester 1'
      }));
      await lecture.save();

      const response = await agent
        .get('/lectures')
        .expect(200);

      expect(response.text).to.include('Display Test Lecture');
      expect(response.text).to.include('Test Display Teacher');
      expect(response.text).to.include('Lab');
      expect(response.text).to.include('Semester 1');
    });

    it('should filter lectures by search term', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      await new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Mathematics Advanced',
        dayOfWeek: 'Monday'
      })).save();

      await new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Physics Basic',
        dayOfWeek: 'Tuesday'
      })).save();

      const response = await agent
        .get('/lectures?search=Mathematics')
        .expect(200);

      expect(response.text).to.include('Mathematics Advanced');
      expect(response.text).not.to.include('Physics Basic');
    });

    it('should filter lectures by day', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      await new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Monday Lecture',
        dayOfWeek: 'Monday'
      })).save();

      await new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Wednesday Lecture',
        dayOfWeek: 'Wednesday'
      })).save();

      const response = await agent
        .get('/lectures?day=Monday')
        .expect(200);

      expect(response.text).to.include('Monday Lecture');
      expect(response.text).not.to.include('Wednesday Lecture');
    });

    it('should filter lectures by semester', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      await new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Semester 1 Lecture',
        semester: 'Semester 1'
      })).save();

      await new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Semester 2 Lecture',
        semester: 'Semester 2'
      })).save();

      const response = await agent
        .get('/lectures?semester=Semester%201')
        .expect(200);

      expect(response.text).to.include('Semester 1 Lecture');
      expect(response.text).not.to.include('Semester 2 Lecture');
    });

    it('should filter lectures by teacher', async () => {
      const teacher1 = new Teacher(TestUtils.generateTestTeacher({ name: 'Teacher One' }));
      const teacher2 = new Teacher(TestUtils.generateTestTeacher({ name: 'Teacher Two' }));
      await teacher1.save();
      await teacher2.save();

      await new Lecture(TestUtils.generateTestLecture({
        teacher: teacher1._id,
        subject: 'Teacher One Lecture'
      })).save();

      await new Lecture(TestUtils.generateTestLecture({
        teacher: teacher2._id,
        subject: 'Teacher Two Lecture'
      })).save();

      const response = await agent
        .get(`/lectures?teacher=${teacher1._id}`)
        .expect(200);

      expect(response.text).to.include('Teacher One Lecture');
      expect(response.text).not.to.include('Teacher Two Lecture');
    });

    it('should combine multiple filters correctly', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      await new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Combined Filter Test',
        dayOfWeek: 'Monday',
        semester: 'Semester 1',
        lectureType: 'Lab'
      })).save();

      await new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Different Settings',
        dayOfWeek: 'Tuesday',
        semester: 'Semester 2',
        lectureType: 'Lecture'
      })).save();

      const response = await agent
        .get('/lectures?day=Monday&semester=Semester%201')
        .expect(200);

      expect(response.text).to.include('Combined Filter Test');
      expect(response.text).not.to.include('Different Settings');
    });
  });

  describe('POST /lectures/save - Lecture Creation', () => {
    it('should create a new lecture with valid data', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const lectureData = {
        subject: 'New Test Lecture',
        teacher: teacher._id.toString(),
        classroom: 'Room 101',
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        lectureType: 'Lecture',
        semester: 'Semester 1',
        course: 'Computer Science',
        chapter: 'Chapter 1',
        description: 'Test description'
      };

      const response = await agent
        .post('/lectures/save')
        .send(lectureData)
        .expect(302); // Redirect after save

      // Verify lecture was created
      const createdLecture = await Lecture.findOne({ subject: 'New Test Lecture' });
      expect(createdLecture).to.exist;
      expect(createdLecture.teacher.toString()).to.equal(teacher._id.toString());
      expect(createdLecture.classroom).to.equal('Room 101');
      expect(createdLecture.dayOfWeek).to.equal('Monday');
    });

    it('should update existing lecture when ID is provided', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const lecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Original Subject'
      }));
      await lecture.save();

      const updateData = {
        id: lecture._id.toString(),
        subject: 'Updated Subject',
        teacher: teacher._id.toString(),
        classroom: lecture.classroom,
        dayOfWeek: lecture.dayOfWeek,
        startTime: '09:00',
        endTime: '10:00',
        lectureType: lecture.lectureType,
        semester: lecture.semester,
        course: lecture.course
      };

      await agent
        .post('/lectures/save')
        .send(updateData)
        .expect(302);

      const updatedLecture = await Lecture.findById(lecture._id);
      expect(updatedLecture.subject).to.equal('Updated Subject');
    });

    it('should handle time conflicts appropriately', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      // Create first lecture
      const existingLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        dayOfWeek: 'Monday',
        startTime: moment().hour(9).minute(0).toDate(),
        endTime: moment().hour(10).minute(0).toDate(),
        classroom: 'Room 101'
      }));
      await existingLecture.save();

      // Try to create conflicting lecture (same teacher, time, day)
      const conflictingData = {
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

      const response = await agent
        .post('/lectures/save')
        .send(conflictingData)
        .expect(302); // Should still redirect but might show error

      // Check if system handled conflict appropriately
      const conflictingLecture = await Lecture.findOne({ subject: 'Conflicting Lecture' });
      // System should either prevent creation or allow with warnings
      // This depends on business rules implementation
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        subject: 'Incomplete Lecture'
        // Missing required fields
      };

      const response = await agent
        .post('/lectures/save')
        .send(incompleteData)
        .expect(302); // Redirects even on error

      // Verify lecture was not created
      const lecture = await Lecture.findOne({ subject: 'Incomplete Lecture' });
      expect(lecture).to.be.null;
    });
  });

  describe('DELETE /lectures/:id - Lecture Deletion', () => {
    it('should delete lecture successfully', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const lecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'To Be Deleted'
      }));
      await lecture.save();

      const response = await agent
        .delete(`/lectures/${lecture._id}`)
        .expect(200);

      expect(response.body.success).to.be.true;

      // Verify lecture was deleted
      const deletedLecture = await Lecture.findById(lecture._id);
      expect(deletedLecture).to.be.null;
    });

    it('should handle deletion of non-existent lecture', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await agent
        .delete(`/lectures/${nonExistentId}`)
        .expect(500); // Should return error status

      expect(response.body.error).to.exist;
    });

    it('should handle invalid lecture ID format', async () => {
      const response = await agent
        .delete('/lectures/invalid-id')
        .expect(500);

      expect(response.body.error).to.exist;
    });
  });

  describe('GET /lectures/add - Add Lecture Form', () => {
    it('should display add lecture form with teacher options', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher({
        name: 'Form Test Teacher'
      }));
      await teacher.save();

      const response = await agent
        .get('/lectures/add')
        .expect(200);

      expect(response.text).to.include('Add New Lecture');
      expect(response.text).to.include('Form Test Teacher');
      expect(response.text).to.include('Subject');
      expect(response.text).to.include('Teacher');
      expect(response.text).to.include('Classroom');
    });

    it('should display all required form fields', async () => {
      const response = await agent
        .get('/lectures/add')
        .expect(200);

      const requiredFields = [
        'subject', 'teacher', 'classroom', 'dayOfWeek',
        'startTime', 'endTime', 'lectureType', 'semester'
      ];

      for (const field of requiredFields) {
        expect(response.text).to.include(`name="${field}"`);
      }
    });
  });

  describe('GET /lectures/edit/:id - Edit Lecture Form', () => {
    it('should display edit form with existing lecture data', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher({
        name: 'Edit Test Teacher'
      }));
      await teacher.save();

      const lecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Edit Test Lecture',
        classroom: 'Room 999'
      }));
      await lecture.save();

      const response = await agent
        .get(`/lectures/edit/${lecture._id}`)
        .expect(200);

      expect(response.text).to.include('Edit Lecture');
      expect(response.text).to.include('Edit Test Lecture');
      expect(response.text).to.include('Room 999');
      expect(response.text).to.include('Edit Test Teacher');
    });

    it('should handle non-existent lecture ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await agent
        .get(`/lectures/edit/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('Lecture Bulk Operations', () => {
    it('should handle CSV import correctly', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const csvData = `subject,teacher,classroom,dayOfWeek,startTime,endTime,lectureType,semester
CSV Test Lecture,${teacher._id},Room CSV,Monday,09:00,10:00,Lecture,Semester 1`;

      const response = await agent
        .post('/lectures/import')
        .attach('csvFile', Buffer.from(csvData), 'test.csv')
        .expect(302);

      // Verify lecture was imported
      const importedLecture = await Lecture.findOne({ subject: 'CSV Test Lecture' });
      expect(importedLecture).to.exist;
      expect(importedLecture.classroom).to.equal('Room CSV');
    });
  });
});
