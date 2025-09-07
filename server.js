const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const moment = require('moment');
require('dotenv').config();

// Import models
const Teacher = require('./models/Teacher');
const Lecture = require('./models/Lecture');

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB connection for Vercel serverless
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/digiboard';
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0,
    });
    
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Connect to database immediately for local development
if (process.env.NODE_ENV !== 'production') {
  connectDB();
}

// Middleware for Vercel serverless
app.use(async (req, res, next) => {
  if (!isConnected) {
    await connectDB();
  }
  next();
});

// Basic middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware - optimized for Vercel deployment
app.use(session({
  secret: process.env.SESSION_SECRET || 'digiboard-admin-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to false for Vercel compatibility
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'digiboard.sid' // Custom session name
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make moment available in all templates
app.locals.moment = moment;

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Routes

// Login page
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Login POST
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, hasPassword: !!password });
  
  // Simple authentication (in production, use proper authentication)
  if (username === 'admin' && password === 'admin123') {
    req.session.isAuthenticated = true;
    req.session.username = username;
    console.log('Login successful for:', username);
    res.redirect('/dashboard');
  } else {
    console.log('Login failed for:', username);
    res.render('login', { error: 'Invalid credentials. Use username: admin, password: admin123' });
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Dashboard home
app.get('/', requireAuth, (req, res) => {
  res.redirect('/dashboard');
});

app.get('/dashboard', requireAuth, async (req, res) => {
  try {
    // Get data directly from database
    const [teachers, lectures] = await Promise.all([
      Teacher.find({}),
      Lecture.find({}).populate('teacher')
    ]);

    // Get next lecture
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 8);

    let nextLecture = await Lecture.findOne({
      dayOfWeek: currentDay,
      isActive: true,
      $expr: {
        $gt: [
          { $dateToString: { format: "%H:%M:%S", date: "$startTime" } },
          currentTime
        ]
      }
    })
    .populate('teacher', 'name email department office profileImage phone qualifications experience')
    .sort({ startTime: 1 });

    // If no lecture today, find next lecture this week
    if (!nextLecture) {
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDayIndex = daysOfWeek.indexOf(currentDay);
      const nextDays = daysOfWeek.slice(currentDayIndex + 1).concat(daysOfWeek.slice(0, currentDayIndex + 1));

      for (const day of nextDays) {
        nextLecture = await Lecture.findOne({
          dayOfWeek: day,
          isActive: true
        })
        .populate('teacher', 'name email department office profileImage phone qualifications experience')
        .sort({ startTime: 1 });

        if (nextLecture) break;
      }
    }

    const stats = {
      totalTeachers: teachers.length,
      totalLectures: lectures.length,
      activeLectures: lectures.filter(l => l.isActive).length,
      nextLecture: nextLecture
    };

    res.render('dashboard', { 
      stats,
      user: req.session.username 
    });
  } catch (error) {
    console.error('Dashboard error:', error.message);
    res.render('dashboard', { 
      stats: {
        totalTeachers: 0,
        totalLectures: 0,
        activeLectures: 0,
        nextLecture: null
      },
      user: req.session.username,
      error: 'Failed to load dashboard data'
    });
  }
});

// Teachers management
app.get('/teachers', requireAuth, async (req, res) => {
  try {
    const teachers = await Teacher.find({}).sort({ name: 1 });
    res.render('teachers', { 
      teachers: teachers,
      user: req.session.username 
    });
  } catch (error) {
    console.error('Teachers error:', error.message);
    res.render('teachers', { 
      teachers: [],
      user: req.session.username,
      error: 'Failed to load teachers'
    });
  }
});

// Add teacher page
app.get('/teachers/add', requireAuth, (req, res) => {
  res.render('teacher-form', { 
    teacher: null,
    user: req.session.username,
    action: 'Add'
  });
});

// Edit teacher page
app.get('/teachers/edit/:id', requireAuth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.redirect('/teachers');
    }
    res.render('teacher-form', { 
      teacher: teacher,
      user: req.session.username,
      action: 'Edit'
    });
  } catch (error) {
    console.error('Edit teacher error:', error.message);
    res.redirect('/teachers');
  }
});

// Save teacher
app.post('/teachers/save', requireAuth, async (req, res) => {
  try {
    const teacherData = {
      name: req.body.name,
      email: req.body.email,
      department: req.body.department,
      phone: req.body.phone,
      office: req.body.office,
      profileImage: req.body.profileImage,
      subjects: req.body.subjects ? req.body.subjects.split(',').map(s => s.trim()) : [],
      experience: parseInt(req.body.experience) || 0,
      qualifications: req.body.qualifications ? req.body.qualifications.split(',').map(q => q.trim()) : []
    };

    if (req.body.id) {
      // Update existing teacher
      await Teacher.findByIdAndUpdate(req.body.id, teacherData);
    } else {
      // Create new teacher
      const teacher = new Teacher(teacherData);
      await teacher.save();
    }

    res.redirect('/teachers');
  } catch (error) {
    console.error('Save teacher error:', error.message);
    res.redirect('/teachers');
  }
});

// Delete teacher
app.delete('/teachers/:id', requireAuth, async (req, res) => {
  try {
    await Teacher.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete teacher error:', error.message);
    res.status(500).json({ error: 'Error deleting teacher' });
  }
});

// Lectures management
app.get('/lectures', requireAuth, async (req, res) => {
  try {
    // Get all lectures with populated teacher data
    const lectures = await Lecture.find().populate('teacher').sort({ day: 1, startTime: 1 });
    
    // Get all teachers for the dropdown
    const teachers = await Teacher.find().sort({ name: 1 });
    
    res.render('lectures', {
      title: 'Manage Lectures',
      lectures,
      teachers,
      user: req.session.username
    });
  } catch (error) {
    console.error('Lectures error:', error.message);
    res.render('lectures', {
      title: 'Manage Lectures',
      lectures: [],
      teachers: [],
      user: req.session.username
    });
  }
});

// Add lecture page
app.get('/lectures/add', requireAuth, async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ name: 1 });
    res.render('lecture-form', { 
      lecture: null,
      teachers,
      user: req.session.username,
      action: 'Add'
    });
  } catch (error) {
    console.error('Add lecture page error:', error.message);
    res.redirect('/lectures');
  }
});

// Edit lecture page
app.get('/lectures/edit/:id', requireAuth, async (req, res) => {
  try {
    const [lecture, teachers] = await Promise.all([
      Lecture.findById(req.params.id),
      Teacher.find().sort({ name: 1 })
    ]);

    res.render('lecture-form', { 
      lecture,
      teachers,
      user: req.session.username,
      action: 'Edit'
    });
  } catch (error) {
    res.redirect('/lectures');
  }
});

// Save lecture
app.post('/lectures/save', requireAuth, async (req, res) => {
  try {
    const lectureData = {
      subject: req.body.subject,
      teacher: req.body.teacher,
      day: req.body.day,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      room: req.body.room,
      semester: parseInt(req.body.semester) || 1
    };

    if (req.body.id) {
      // Update existing lecture
      await Lecture.findByIdAndUpdate(req.body.id, lectureData);
    } else {
      // Create new lecture
      const lecture = new Lecture(lectureData);
      await lecture.save();
    }

    res.redirect('/lectures');
  } catch (error) {
    console.error('Save lecture error:', error.message);
    res.redirect('/lectures');
  }
});

// Delete lecture
app.post('/lectures/delete/:id', requireAuth, async (req, res) => {
  try {
    await Lecture.findByIdAndDelete(req.params.id);
    res.redirect('/lectures');
  } catch (error) {
    res.redirect('/lectures');
  }
});

// Schedule management
app.get('/schedule', requireAuth, async (req, res) => {
  try {
    // Get all lectures with populated teacher data for today and this week
    const allLectures = await Lecture.find().populate('teacher').sort({ day: 1, startTime: 1 });
    
    // Get today's day name
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    // Filter today's lectures
    const todaySchedule = allLectures.filter(lecture => lecture.day === today);
    
    // Group weekly schedule by day
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
      if (weeklySchedule[lecture.day]) {
        weeklySchedule[lecture.day].push(lecture);
      }
    });

    res.render('schedule', { 
      weeklySchedule,
      todaySchedule,
      user: req.session.username 
    });
  } catch (error) {
    console.error('Schedule error:', error.message);
    res.render('schedule', { 
      weeklySchedule: {},
      todaySchedule: [],
      user: req.session.username,
      error: 'Failed to load schedule'
    });
  }
});

// Quick schedule update
app.get('/quick-update', requireAuth, async (req, res) => {
  try {
    // Get all teachers and lectures
    const [teachers, lectures] = await Promise.all([
      Teacher.find().sort({ name: 1 }),
      Lecture.find().populate('teacher').sort({ day: 1, startTime: 1 })
    ]);

    res.render('quick-update', { 
      teachers,
      lectures,
      user: req.session.username 
    });
  } catch (error) {
    console.error('Quick update error:', error.message);
    res.render('quick-update', { 
      teachers: [],
      lectures: [],
      user: req.session.username,
      error: 'Failed to load data'
    });
  }
});

// Bulk update lectures status
app.post('/lectures/bulk-update', requireAuth, async (req, res) => {
  try {
    const { lectureIds, action } = req.body;
    const ids = Array.isArray(lectureIds) ? lectureIds : [lectureIds];

    for (const id of ids) {
      if (action === 'activate') {
        await Lecture.findByIdAndUpdate(id, { isActive: true });
      } else if (action === 'deactivate') {
        await Lecture.findByIdAndUpdate(id, { isActive: false });
      }
    }

    res.redirect('/lectures');
  } catch (error) {
    console.error('Bulk update error:', error.message);
    res.redirect('/lectures');
  }
});

// API endpoints for lectures management
app.put('/lectures/:id', requireAuth, async (req, res) => {
  try {
    await Lecture.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Update lecture error:', error.message);
    res.status(500).json({ error: 'Error updating lecture' });
  }
});

// Start server for local development only
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`📊 Admin Dashboard running on http://localhost:${PORT}`);
    console.log(`🗄️  MongoDB connection ready`);
    console.log(`👤 Login with: admin / admin123`);
  });
}

// Export for Vercel
module.exports = app;
