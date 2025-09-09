const { expect, TestUtils } = require('../test-setup');
const mongoose = require('mongoose');

describe('Teacher Model Unit Tests', () => {
  let Teacher, Lecture;

  before(async () => {
    await TestUtils.connectDB();
    Teacher = require('../../models/Teacher');
    Lecture = require('../../models/Lecture');
  });

  after(async () => {
    await TestUtils.cleanupTestData();
    await TestUtils.disconnectDB();
  });

  beforeEach(async () => {
    await TestUtils.cleanupTestData();
  });

  describe('Teacher Creation', () => {
    it('should create a valid teacher with all required fields', async () => {
      const teacherData = TestUtils.generateTestTeacher();
      const teacher = new Teacher(teacherData);
      const savedTeacher = await teacher.save();

      expect(savedTeacher._id).to.exist;
      expect(savedTeacher.name).to.equal(teacherData.name);
      expect(savedTeacher.email).to.equal(teacherData.email);
      expect(savedTeacher.department).to.equal(teacherData.department);
      expect(savedTeacher.subjects).to.deep.equal(teacherData.subjects);
      expect(savedTeacher.qualifications).to.deep.equal(teacherData.qualifications);
    });

    it('should fail to create teacher without required fields', async () => {
      const teacher = new Teacher({});
      
      try {
        await teacher.save();
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
        expect(error.errors.name).to.exist;
        expect(error.errors.email).to.exist;
      }
    });

    it('should validate email format', async () => {
      const teacherData = TestUtils.generateTestTeacher({
        email: 'invalid-email'
      });

      const teacher = new Teacher(teacherData);

      try {
        await teacher.save();
        expect.fail('Should have thrown validation error for invalid email');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
        expect(error.errors.email).to.exist;
      }
    });

    it('should enforce unique email addresses', async () => {
      const email = 'unique@test.com';
      
      const teacher1 = new Teacher(TestUtils.generateTestTeacher({ email }));
      await teacher1.save();

      const teacher2 = new Teacher(TestUtils.generateTestTeacher({ email }));

      try {
        await teacher2.save();
        expect.fail('Should have thrown duplicate key error');
      } catch (error) {
        expect(error.code).to.equal(11000); // MongoDB duplicate key error
      }
    });

    it('should validate phone number format', async () => {
      const teacherData = TestUtils.generateTestTeacher({
        phone: 'invalid-phone'
      });

      const teacher = new Teacher(teacherData);

      try {
        await teacher.save();
        expect.fail('Should have thrown validation error for invalid phone');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
        expect(error.errors.phone).to.exist;
      }
    });

    it('should accept valid phone number formats', async () => {
      const validPhones = [
        '+1234567890',
        '+91-9876543210',
        '(555) 123-4567',
        '555-123-4567'
      ];

      for (const phone of validPhones) {
        const teacher = new Teacher(TestUtils.generateTestTeacher({
          email: `test${Date.now()}@example.com`,
          phone
        }));
        
        const savedTeacher = await teacher.save();
        expect(savedTeacher.phone).to.equal(phone);
      }
    });
  });

  describe('Teacher Data Validation', () => {
    it('should validate experience as positive number', async () => {
      const teacherData = TestUtils.generateTestTeacher({
        experience: -1
      });

      const teacher = new Teacher(teacherData);

      try {
        await teacher.save();
        expect.fail('Should have thrown validation error for negative experience');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
        expect(error.errors.experience).to.exist;
      }
    });

    it('should handle subjects array correctly', async () => {
      const subjects = ['Mathematics', 'Physics', 'Computer Science'];
      const teacher = new Teacher(TestUtils.generateTestTeacher({
        subjects
      }));

      const savedTeacher = await teacher.save();
      expect(savedTeacher.subjects).to.deep.equal(subjects);
      expect(savedTeacher.subjects).to.be.an('array');
    });

    it('should handle qualifications array correctly', async () => {
      const qualifications = ['PhD Mathematics', 'MSc Physics', 'BSc Computer Science'];
      const teacher = new Teacher(TestUtils.generateTestTeacher({
        qualifications
      }));

      const savedTeacher = await teacher.save();
      expect(savedTeacher.qualifications).to.deep.equal(qualifications);
      expect(savedTeacher.qualifications).to.be.an('array');
    });

    it('should set default values correctly', async () => {
      const minimalData = {
        name: 'Test Teacher',
        email: 'test@example.com',
        department: 'Test Department'
      };

      const teacher = new Teacher(minimalData);
      const savedTeacher = await teacher.save();

      expect(savedTeacher.subjects).to.be.an('array').that.is.empty;
      expect(savedTeacher.qualifications).to.be.an('array').that.is.empty;
      expect(savedTeacher.experience).to.equal(0);
    });
  });

  describe('Teacher Queries', () => {
    it('should find teachers by department', async () => {
      const departments = ['Computer Science', 'Mathematics', 'Physics'];
      
      for (const dept of departments) {
        const teacher = new Teacher(TestUtils.generateTestTeacher({
          department: dept,
          name: `${dept} Teacher`
        }));
        await teacher.save();
      }

      const csTeachers = await Teacher.find({ department: 'Computer Science' });
      const csTestTeachers = csTeachers.filter(t => t.name.includes('Computer Science Teacher'));
      
      expect(csTestTeachers).to.have.length(1);
      expect(csTestTeachers[0].department).to.equal('Computer Science');
    });

    it('should find teachers by subjects', async () => {
      const teacher1 = new Teacher(TestUtils.generateTestTeacher({
        subjects: ['Mathematics', 'Physics'],
        name: 'Math Physics Teacher'
      }));

      const teacher2 = new Teacher(TestUtils.generateTestTeacher({
        subjects: ['Computer Science', 'Programming'],
        name: 'CS Programming Teacher'
      }));

      await teacher1.save();
      await teacher2.save();

      const mathTeachers = await Teacher.find({ subjects: 'Mathematics' });
      const mathTestTeachers = mathTeachers.filter(t => t.name.includes('Math Physics Teacher'));
      
      expect(mathTestTeachers).to.have.length(1);
      expect(mathTestTeachers[0].subjects).to.include('Mathematics');
    });

    it('should search teachers by experience range', async () => {
      const teachers = [
        { experience: 2, name: 'Junior Teacher' },
        { experience: 8, name: 'Senior Teacher' },
        { experience: 15, name: 'Expert Teacher' }
      ];

      for (const teacherData of teachers) {
        const teacher = new Teacher(TestUtils.generateTestTeacher(teacherData));
        await teacher.save();
      }

      const experiencedTeachers = await Teacher.find({ experience: { $gte: 5 } });
      const experiencedTestTeachers = experiencedTeachers.filter(t => 
        t.name.includes('Senior Teacher') || t.name.includes('Expert Teacher')
      );

      expect(experiencedTestTeachers).to.have.length(2);
    });
  });

  describe('Teacher-Lecture Relationships', () => {
    it('should maintain referential integrity with lectures', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      const savedTeacher = await teacher.save();

      const lecture = new Lecture(TestUtils.generateTestLecture({
        teacher: savedTeacher._id
      }));
      await lecture.save();

      // Find teacher with their lectures
      const teacherLectures = await Lecture.find({ teacher: savedTeacher._id });
      expect(teacherLectures).to.have.length(1);
      expect(teacherLectures[0].teacher.toString()).to.equal(savedTeacher._id.toString());
    });

    it('should handle teacher deletion with lecture references', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      const savedTeacher = await teacher.save();

      const lecture = new Lecture(TestUtils.generateTestLecture({
        teacher: savedTeacher._id
      }));
      await lecture.save();

      // Delete teacher
      await Teacher.findByIdAndDelete(savedTeacher._id);

      // Check if lecture still exists but with null teacher reference
      const orphanedLecture = await Lecture.findById(lecture._id);
      expect(orphanedLecture).to.exist;
      
      // Try to populate teacher (should handle null reference gracefully)
      const populatedLecture = await Lecture.findById(lecture._id).populate('teacher');
      expect(populatedLecture.teacher).to.be.null;
    });
  });

  describe('Teacher Updates', () => {
    it('should update teacher information correctly', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher({
        name: 'Original Name',
        department: 'Original Department'
      }));
      const savedTeacher = await teacher.save();

      // Update teacher
      savedTeacher.name = 'Updated Name';
      savedTeacher.department = 'Updated Department';
      savedTeacher.experience = 10;

      const updatedTeacher = await savedTeacher.save();

      expect(updatedTeacher.name).to.equal('Updated Name');
      expect(updatedTeacher.department).to.equal('Updated Department');
      expect(updatedTeacher.experience).to.equal(10);
    });

    it('should maintain data integrity during updates', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      const savedTeacher = await teacher.save();

      const originalId = savedTeacher._id;
      const originalEmail = savedTeacher.email;
      const originalCreatedAt = savedTeacher.createdAt;

      // Update and save
      savedTeacher.name = 'Updated Name';
      const updatedTeacher = await savedTeacher.save();

      expect(updatedTeacher._id.toString()).to.equal(originalId.toString());
      expect(updatedTeacher.email).to.equal(originalEmail);
      expect(updatedTeacher.createdAt).to.deep.equal(originalCreatedAt);
      expect(updatedTeacher.updatedAt).to.be.greaterThan(originalCreatedAt);
    });

    it('should handle array field updates correctly', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher({
        subjects: ['Math', 'Physics'],
        qualifications: ['BSc Math']
      }));
      const savedTeacher = await teacher.save();

      // Update arrays
      savedTeacher.subjects.push('Chemistry');
      savedTeacher.qualifications.push('MSc Physics');
      const updatedTeacher = await savedTeacher.save();

      expect(updatedTeacher.subjects).to.include('Chemistry');
      expect(updatedTeacher.qualifications).to.include('MSc Physics');
      expect(updatedTeacher.subjects).to.have.length(3);
      expect(updatedTeacher.qualifications).to.have.length(2);
    });
  });
});
