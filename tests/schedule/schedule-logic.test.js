const { expect, TestUtils } = require('../test-setup');
const mongoose = require('mongoose');
const moment = require('moment');

describe('Schedule Logic Tests', () => {
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

  describe('Time Conflict Detection', () => {
    it('should detect teacher time conflicts', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      // Create first lecture: Monday 9:00-10:00
      const lecture1 = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        dayOfWeek: 'Monday',
        startTime: moment().hour(9).minute(0).toDate(),
        endTime: moment().hour(10).minute(0).toDate(),
        subject: 'First Lecture'
      }));
      await lecture1.save();

      // Create overlapping lecture: Monday 9:30-10:30
      const lecture2Data = TestUtils.generateTestLecture({
        teacher: teacher._id,
        dayOfWeek: 'Monday',
        startTime: moment().hour(9).minute(30).toDate(),
        endTime: moment().hour(10).minute(30).toDate(),
        subject: 'Overlapping Lecture'
      });

      // Check for conflicts
      const conflicts = await Lecture.find({
        teacher: teacher._id,
        dayOfWeek: 'Monday',
        isActive: true,
        _id: { $ne: lecture2Data._id },
        $or: [
          {
            startTime: { $lte: lecture2Data.endTime },
            endTime: { $gte: lecture2Data.startTime }
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

      // First lecture in room
      const lecture1 = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher1._id,
        classroom,
        dayOfWeek: 'Monday',
        startTime,
        endTime
      }));
      await lecture1.save();

      // Check for classroom conflicts
      const newLectureData = {
        classroom,
        dayOfWeek: 'Monday',
        startTime: moment().hour(9).minute(30).toDate(),
        endTime: moment().hour(10).minute(30).toDate()
      };

      const classroomConflicts = await Lecture.find({
        classroom,
        dayOfWeek: 'Monday',
        isActive: true,
        $or: [
          {
            startTime: { $lte: newLectureData.endTime },
            endTime: { $gte: newLectureData.startTime }
          }
        ]
      });

      expect(classroomConflicts).to.have.length(1);
    });

    it('should allow non-overlapping time slots', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      // Create lecture: Monday 9:00-10:00
      const lecture1 = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        dayOfWeek: 'Monday',
        startTime: moment().hour(9).minute(0).toDate(),
        endTime: moment().hour(10).minute(0).toDate()
      }));
      await lecture1.save();

      // Create non-overlapping lecture: Monday 10:00-11:00
      const lecture2 = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        dayOfWeek: 'Monday',
        startTime: moment().hour(10).minute(0).toDate(),
        endTime: moment().hour(11).minute(0).toDate()
      }));
      await lecture2.save();

      // Should not find conflicts
      const conflicts = await Lecture.find({
        teacher: teacher._id,
        dayOfWeek: 'Monday',
        isActive: true,
        _id: { $ne: lecture2._id },
        $or: [
          {
            startTime: { $lte: lecture2.endTime },
            endTime: { $gte: lecture2.startTime }
          }
        ]
      });

      expect(conflicts).to.have.length(0);
    });

    it('should allow same time on different days', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const timeSlot = {
        startTime: moment().hour(9).minute(0).toDate(),
        endTime: moment().hour(10).minute(0).toDate()
      };

      // Create lectures on different days at same time
      const mondayLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        dayOfWeek: 'Monday',
        ...timeSlot
      }));

      const tuesdayLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        dayOfWeek: 'Tuesday',
        ...timeSlot
      }));

      await mondayLecture.save();
      await tuesdayLecture.save();

      // Should not find conflicts across different days
      const conflicts = await Lecture.find({
        teacher: teacher._id,
        dayOfWeek: 'Tuesday',
        isActive: true,
        _id: { $ne: tuesdayLecture._id }
      });

      expect(conflicts).to.have.length(0);
    });
  });

  describe('Schedule Generation', () => {
    it('should generate weekly schedule correctly', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const days = TestUtils.getDaysOfWeek();
      const lectures = [];

      // Create one lecture per day
      for (let i = 0; i < days.length; i++) {
        const lecture = new Lecture(TestUtils.generateTestLecture({
          teacher: teacher._id,
          dayOfWeek: days[i],
          subject: `${days[i]} Lecture`,
          startTime: moment().hour(9 + i).minute(0).toDate(),
          endTime: moment().hour(10 + i).minute(0).toDate()
        }));
        lectures.push(await lecture.save());
      }

      // Generate weekly schedule
      const allLectures = await Lecture.find({ isActive: true })
        .populate('teacher')
        .sort({ dayOfWeek: 1, startTime: 1 });

      const weeklySchedule = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: []
      };

      allLectures.forEach(lecture => {
        if (weeklySchedule[lecture.dayOfWeek]) {
          weeklySchedule[lecture.dayOfWeek].push(lecture);
        }
      });

      // Verify each day has exactly one lecture
      for (const day of days) {
        expect(weeklySchedule[day]).to.have.length(1);
        expect(weeklySchedule[day][0].subject).to.equal(`${day} Lecture`);
      }
    });

    it('should handle multiple lectures per day', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      // Create multiple lectures for Monday
      const mondayLectures = [];
      for (let i = 0; i < 3; i++) {
        const lecture = new Lecture(TestUtils.generateTestLecture({
          teacher: teacher._id,
          dayOfWeek: 'Monday',
          subject: `Monday Lecture ${i + 1}`,
          startTime: moment().hour(9 + i).minute(0).toDate(),
          endTime: moment().hour(10 + i).minute(0).toDate()
        }));
        mondayLectures.push(await lecture.save());
      }

      const mondaySchedule = await Lecture.find({ 
        dayOfWeek: 'Monday', 
        isActive: true 
      }).sort({ startTime: 1 });

      expect(mondaySchedule).to.have.length(3);
      expect(mondaySchedule[0].subject).to.equal('Monday Lecture 1');
      expect(mondaySchedule[2].subject).to.equal('Monday Lecture 3');
    });

    it('should sort lectures by time within each day', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      // Create lectures in reverse time order
      const lateLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        dayOfWeek: 'Wednesday',
        subject: 'Late Lecture',
        startTime: moment().hour(15).minute(0).toDate(),
        endTime: moment().hour(16).minute(0).toDate()
      }));

      const earlyLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        dayOfWeek: 'Wednesday',
        subject: 'Early Lecture',
        startTime: moment().hour(9).minute(0).toDate(),
        endTime: moment().hour(10).minute(0).toDate()
      }));

      await lateLecture.save();
      await earlyLecture.save();

      const sortedLectures = await Lecture.find({ 
        dayOfWeek: 'Wednesday', 
        isActive: true 
      }).sort({ startTime: 1 });

      expect(sortedLectures[0].subject).to.equal('Early Lecture');
      expect(sortedLectures[1].subject).to.equal('Late Lecture');
    });
  });

  describe('Next Lecture Calculation', () => {
    it('should find next lecture today', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      const now = new Date();
      const today = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentTime = now.toTimeString().slice(0, 8);

      // Create lecture later today
      const nextLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        dayOfWeek: today,
        subject: 'Next Today Lecture',
        startTime: moment().add(2, 'hours').toDate(),
        endTime: moment().add(3, 'hours').toDate()
      }));
      await nextLecture.save();

      // Find next lecture
      const foundNextLecture = await Lecture.findOne({
        dayOfWeek: today,
        isActive: true,
        $expr: {
          $gt: [
            { $dateToString: { format: "%H:%M:%S", date: "$startTime" } },
            currentTime
          ]
        }
      })
      .populate('teacher')
      .sort({ startTime: 1 });

      expect(foundNextLecture).to.exist;
      expect(foundNextLecture.subject).to.equal('Next Today Lecture');
    });

    it('should find next lecture in upcoming days', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      // Create lecture for tomorrow
      const tomorrow = moment().add(1, 'day');
      const tomorrowDay = tomorrow.toDate().toLocaleDateString('en-US', { weekday: 'long' });

      const tomorrowLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        dayOfWeek: tomorrowDay,
        subject: 'Tomorrow Lecture',
        startTime: tomorrow.hour(9).minute(0).toDate(),
        endTime: tomorrow.hour(10).minute(0).toDate()
      }));
      await tomorrowLecture.save();

      // Simulate no lectures today - find next lecture this week
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const currentDayIndex = daysOfWeek.indexOf(currentDay);
      const nextDays = daysOfWeek.slice(currentDayIndex + 1).concat(daysOfWeek.slice(0, currentDayIndex + 1));

      let nextLecture = null;
      for (const day of nextDays) {
        nextLecture = await Lecture.findOne({
          dayOfWeek: day,
          isActive: true
        })
        .populate('teacher')
        .sort({ startTime: 1 });

        if (nextLecture) break;
      }

      if (tomorrowDay !== currentDay) {
        expect(nextLecture).to.exist;
        expect(nextLecture.subject).to.equal('Tomorrow Lecture');
      }
    });

    it('should handle no upcoming lectures', async () => {
      // No lectures in database
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentTime = now.toTimeString().slice(0, 8);

      const nextLecture = await Lecture.findOne({
        dayOfWeek: currentDay,
        isActive: true,
        $expr: {
          $gt: [
            { $dateToString: { format: "%H:%M:%S", date: "$startTime" } },
            currentTime
          ]
        }
      })
      .populate('teacher')
      .sort({ startTime: 1 });

      expect(nextLecture).to.be.null;
    });
  });

  describe('Schedule Filtering Edge Cases', () => {
    it('should handle lectures with inactive status', async () => {
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

      // Query should only return active lectures
      const activeLectures = await Lecture.find({ isActive: true });
      const testActiveLectures = activeLectures.filter(l => 
        l.subject.includes('Active') || l.subject.includes('Inactive')
      );

      expect(testActiveLectures).to.have.length(1);
      expect(testActiveLectures[0].subject).to.equal('Active Lecture');
    });

    it('should handle date filtering across weeks', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      // Create lectures for this week and next week
      const thisWeekLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'This Week Lecture',
        dayOfWeek: 'Monday'
      }));

      const nextWeekLecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Next Week Lecture',
        dayOfWeek: 'Monday'
      }));

      await thisWeekLecture.save();
      await nextWeekLecture.save();

      // Filter by specific Monday (this week)
      const thisMonday = moment().day(1); // This Monday
      const thisMondayDay = thisMonday.toDate().toLocaleDateString('en-US', { weekday: 'long' });

      const mondayLectures = await Lecture.find({ 
        dayOfWeek: thisMondayDay,
        isActive: true 
      });

      // Both lectures should be found as they're both on Monday
      expect(mondayLectures).to.have.length(2);
    });

    it('should handle timezone considerations', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      // Create lecture with specific time
      const lectureTime = moment().hour(14).minute(30).toDate(); // 2:30 PM
      const lecture = new Lecture(TestUtils.generateTestLecture({
        teacher: teacher._id,
        subject: 'Timezone Test Lecture',
        startTime: lectureTime,
        endTime: moment().hour(15).minute(30).toDate()
      }));
      await lecture.save();

      // Retrieve and verify time is preserved
      const retrievedLecture = await Lecture.findById(lecture._id);
      expect(retrievedLecture.startTime).to.deep.equal(lectureTime);
      
      // Format time for display
      const formattedTime = moment(retrievedLecture.startTime).format('h:mm A');
      expect(formattedTime).to.equal('2:30 PM');
    });
  });

  describe('Schedule Performance Edge Cases', () => {
    it('should handle large time ranges efficiently', async () => {
      const teacher = new Teacher(TestUtils.generateTestTeacher());
      await teacher.save();

      // Create lectures spanning entire day
      const timeSlots = TestUtils.generateTimeSlots();
      const lectures = [];

      for (let i = 0; i < timeSlots.length; i++) {
        const lecture = new Lecture(TestUtils.generateTestLecture({
          teacher: teacher._id,
          subject: `Hour ${i + 8} Lecture`,
          dayOfWeek: 'Monday',
          startTime: timeSlots[i].start,
          endTime: timeSlots[i].end
        }));
        lectures.push(lecture);
      }

      await Lecture.insertMany(lectures);

      const startTime = Date.now();
      const mondaySchedule = await Lecture.find({ 
        dayOfWeek: 'Monday',
        isActive: true 
      }).sort({ startTime: 1 });
      const endTime = Date.now();

      expect(endTime - startTime).to.be.lessThan(1000); // Should be fast
      expect(mondaySchedule).to.have.length(timeSlots.length);
    });

    it('should handle complex conflict detection efficiently', async () => {
      const teachers = [];
      for (let i = 0; i < 5; i++) {
        const teacher = new Teacher(TestUtils.generateTestTeacher({
          name: `Teacher ${i + 1}`
        }));
        teachers.push(await teacher.save());
      }

      // Create many lectures for conflict testing
      const lectures = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 8; hour < 18; hour++) {
          for (let teacherIndex = 0; teacherIndex < teachers.length; teacherIndex++) {
            const lecture = new Lecture(TestUtils.generateTestLecture({
              teacher: teachers[teacherIndex]._id,
              dayOfWeek: TestUtils.getDaysOfWeek()[day],
              subject: `T${teacherIndex + 1} D${day + 1} H${hour}`,
              startTime: moment().day(day + 1).hour(hour).minute(0).toDate(),
              endTime: moment().day(day + 1).hour(hour + 1).minute(0).toDate()
            }));
            lectures.push(lecture);
          }
        }
      }

      await Lecture.insertMany(lectures);

      // Test conflict detection performance
      const testTeacher = teachers[0];
      const testTime = {
        dayOfWeek: 'Monday',
        startTime: moment().hour(10).minute(30).toDate(),
        endTime: moment().hour(11).minute(30).toDate()
      };

      const startTime = Date.now();
      const conflicts = await Lecture.find({
        teacher: testTeacher._id,
        dayOfWeek: testTime.dayOfWeek,
        isActive: true,
        $or: [
          {
            startTime: { $lte: testTime.endTime },
            endTime: { $gte: testTime.startTime }
          }
        ]
      });
      const endTime = Date.now();

      expect(endTime - startTime).to.be.lessThan(500); // Should be very fast
      expect(conflicts).to.have.length.greaterThan(0); // Should find conflicts
    });
  });
});
