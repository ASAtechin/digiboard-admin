const { expect, TestUtils } = require('../test-setup');
const mongoose = require('mongoose');
const moment = require('moment');

describe('Lecture Model Unit Tests', () => {
  let Lecture, Teacher;

  before(async () => {
    await TestUtils.connectDB();
    Lecture = require('../../models/Lecture');
    Teacher = require('../../models/Teacher');
  });

  after(async () => {
    await TestUtils.cleanupTestData();
    await TestUtils.disconnectDB();
  });

  beforeEach(async () => {
    await TestUtils.cleanupTestData();
  });

  describe('Lecture Creation', () => {
    it('should create a valid lecture with all required fields', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const lectureData = TestUtils.generateTestLecture({
        teacher: teacher._id
      });

      const lecture = new Lecture(lectureData);
      const savedLecture = await lecture.save();

      expect(savedLecture._id).to.exist;
      expect(savedLecture.subject).to.equal(lectureData.subject);
      expect(savedLecture.teacher.toString()).to.equal(teacher._id.toString());
      expect(savedLecture.dayOfWeek).to.equal(lectureData.dayOfWeek);
      expect(savedLecture.isActive).to.be.true;
    });

    it('should fail to create lecture without required fields', async () => {
      const lecture = new Lecture({});
      
      try {
        await lecture.save();
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
      }
    });

    it('should validate dayOfWeek enum values', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const lectureData = TestUtils.generateTestLecture({
        teacher: teacher._id,
        dayOfWeek: 'InvalidDay'
      });

      const lecture = new Lecture(lectureData);

      try {
        await lecture.save();
        expect.fail('Should have thrown validation error for invalid dayOfWeek');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
        expect(error.errors.dayOfWeek).to.exist;
      }
    });

    it('should validate lectureType enum values', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const lectureData = TestUtils.generateTestLecture({
        teacher: teacher._id,
        lectureType: 'InvalidType'
      });

      const lecture = new Lecture(lectureData);

      try {
        await lecture.save();
        expect.fail('Should have thrown validation error for invalid lectureType');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
        expect(error.errors.lectureType).to.exist;
      }
    });
  });

  describe('Time Validation', () => {
    it('should validate that endTime is after startTime', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const startTime = moment().hour(10).minute(0).toDate();
      const endTime = moment().hour(9).minute(0).toDate(); // Earlier than start

      const lectureData = TestUtils.generateTestLecture({
        teacher: teacher._id,
        startTime,
        endTime
      });

      const lecture = new Lecture(lectureData);

      try {
        await lecture.save();
        expect.fail('Should have thrown validation error for invalid time range');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
      }
    });

    it('should accept valid time ranges', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const startTime = moment().hour(9).minute(0).toDate();
      const endTime = moment().hour(10).minute(30).toDate();

      const lectureData = TestUtils.generateTestLecture({
        teacher: teacher._id,
        startTime,
        endTime
      });

      const lecture = new Lecture(lectureData);
      const savedLecture = await lecture.save();

      expect(savedLecture.startTime).to.deep.equal(startTime);
      expect(savedLecture.endTime).to.deep.equal(endTime);
    });
  });

  describe('Lecture Queries', () => {
    it('should find lectures by day of week', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      // Create lectures for different days
      const days = ['Monday', 'Tuesday', 'Wednesday'];
      const lectures = [];

      for (const day of days) {
        const lectureData = TestUtils.generateTestLecture({
          teacher: teacher._id,
          dayOfWeek: day,
          subject: `${day} Lecture`
        });
        const lecture = new Lecture(lectureData);
        lectures.push(await lecture.save());
      }

      const mondayLectures = await Lecture.find({ dayOfWeek: 'Monday' });
      expect(mondayLectures).to.have.length(1);
      expect(mondayLectures[0].subject).to.equal('Monday Lecture');
    });

    it('should find active lectures only', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      // Create active and inactive lectures
      const activeLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Active Lecture',
        isActive: true
      }));

      const inactiveLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Inactive Lecture',
        isActive: false
      }));

      await activeLecture.save();
      await inactiveLecture.save();

      const activeLectures = await Lecture.find({ isActive: true });
      const activeTestLectures = activeLectures.filter(l => 
        l.subject.includes('Active Lecture') || l.subject.includes('Inactive Lecture')
      );

      expect(activeTestLectures).to.have.length(1);
      expect(activeTestLectures[0].subject).to.equal('Active Lecture');
    });

    it('should populate teacher information', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher({
        name: 'Dr. Test Teacher'
      }));
      await teacher.save();

      const lecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id
      }));
      await lecture.save();

      const populatedLecture = await Lecture.findById(lecture._id).populate('teacher');
      
      expect(populatedLecture.teacher).to.exist;
      expect(populatedLecture.teacher.name).to.equal('Dr. Test Teacher');
    });
  });

  describe('Lecture Conflicts', () => {
    it('should detect time conflicts for same teacher', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const startTime = moment().hour(9).minute(0).toDate();
      const endTime = moment().hour(10).minute(0).toDate();

      // Create first lecture
      const lecture1 = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        dayOfWeek: 'Monday',
        startTime,
        endTime,
        subject: 'First Lecture'
      }));
      await lecture1.save();

      // Try to create overlapping lecture
      const lecture2 = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        dayOfWeek: 'Monday',
        startTime: moment().hour(9).minute(30).toDate(),
        endTime: moment().hour(10).minute(30).toDate(),
        subject: 'Overlapping Lecture'
      }));

      // Check for conflicts before saving
      const conflicts = await Lecture.find({
        teacher: teacher._id,
        dayOfWeek: 'Monday',
        isActive: true,
        $or: [
          {
            startTime: { $lte: lecture2.endTime },
            endTime: { $gte: lecture2.startTime }
          }
        ]
      });

      expect(conflicts).to.have.length(1);
      expect(conflicts[0].subject).to.equal('First Lecture');
    });

    it('should detect classroom conflicts', async () => {
      const teacher1 = new Teacher(TestUtils.generateTestTeacher({ name: 'Teacher 1' }));
      const teacher2 = new Teacher(TestUtils.generateTestTeacher({ name: 'Teacher 2' }));
      await teacher1.save();
      await teacher2.save();

      const classroom = 'Room 101';
      const startTime = moment().hour(9).minute(0).toDate();
      const endTime = moment().hour(10).minute(0).toDate();

      // Create first lecture
      const lecture1 = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher1._id,
        classroom,
        dayOfWeek: 'Monday',
        startTime,
        endTime
      }));
      await lecture1.save();

      // Check for classroom conflicts
      const classroomConflicts = await Lecture.find({
        classroom,
        dayOfWeek: 'Monday',
        isActive: true,
        $or: [
          {
            startTime: { $lte: endTime },
            endTime: { $gte: startTime }
          }
        ]
      });

      expect(classroomConflicts).to.have.length(1);
    });
  });

  describe('Lecture Updates', () => {
    it('should update lecture fields correctly', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const lecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Original Subject'
      }));
      await lecture.save();

      // Update the lecture
      lecture.subject = 'Updated Subject';
      lecture.classroom = 'Updated Room';
      const updatedLecture = await lecture.save();

      expect(updatedLecture.subject).to.equal('Updated Subject');
      expect(updatedLecture.classroom).to.equal('Updated Room');
    });

    it('should maintain data integrity during updates', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const lecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id
      }));
      const savedLecture = await lecture.save();

      const originalId = savedLecture._id;
      const originalCreatedAt = savedLecture.createdAt;

      // Update and save again
      savedLecture.subject = 'Updated Subject';
      const updatedLecture = await savedLecture.save();

      expect(updatedLecture._id.toString()).to.equal(originalId.toString());
      expect(updatedLecture.createdAt).to.deep.equal(originalCreatedAt);
      expect(updatedLecture.updatedAt).to.be.greaterThan(originalCreatedAt);
    });
  });
});
