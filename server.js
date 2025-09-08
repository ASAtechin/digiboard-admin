const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
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
      bufferCommands: false
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

// Session middleware - MongoDB backed for serverless compatibility
app.use(session({
  secret: process.env.SESSION_SECRET || 'digiboard-admin-secret-2024',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/digiboard',
    touchAfter: 24 * 3600, // lazy session update
    ttl: 24 * 60 * 60, // 24 hours in seconds
    collectionName: 'admin_sessions',
    autoRemove: 'native' // auto remove expired sessions
  }),
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

// Authentication middleware with session debugging
const requireAuth = (req, res, next) => {
  console.log('Auth check:', {
    sessionID: req.sessionID,
    isAuthenticated: req.session.isAuthenticated,
    username: req.session.username,
    url: req.url
  });
  
  if (req.session.isAuthenticated) {
    next();
  } else {
    console.log('Redirecting to login - not authenticated');
    res.redirect('/login');
  }
};

// Routes

// Simple public status endpoint (no DB required)
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'digiboard-admin'
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const Teacher = require('./models/Teacher');
    const teacherCount = await Teacher.countDocuments();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      teacherCount: teacherCount,
      service: 'digiboard-admin'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
      service: 'digiboard-admin'
    });
  }
});

// Login page
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Login POST
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { 
    username, 
    hasPassword: !!password,
    sessionID: req.sessionID 
  });
  
  // Simple authentication (in production, use proper authentication)
  if (username === 'admin' && password === 'admin123') {
    req.session.isAuthenticated = true;
    req.session.username = username;
    
    // Force session save before redirect
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        res.render('login', { error: 'Session error. Please try again.' });
      } else {
        console.log('Login successful for:', username, 'SessionID:', req.sessionID);
        res.redirect('/dashboard');
      }
    });
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
    console.log('Dashboard route accessed');
    
    // Get data directly from database
    const [teachers, lectures] = await Promise.all([
      Teacher.find({}),
      Lecture.find({}).populate('teacher')
    ]);

    console.log(`Dashboard data: ${teachers.length} teachers, ${lectures.length} lectures`);

    // Get next lecture
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 8);

    console.log(`Current day: ${currentDay}, Current time: ${currentTime}`);

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
    console.log('Teachers route accessed');
    const teachers = await Teacher.find({}).sort({ name: 1 });
    console.log(`Found ${teachers.length} teachers`);
    
    res.render('teachers', { 
      teachers: teachers,
      user: req.session.username 
    });
  } catch (error) {
    console.error('Teachers error:', error.message);
    console.error('Teachers error stack:', error.stack);
    res.render('teachers', { 
      teachers: [],
      user: req.session.username,
      error: 'Failed to load teachers: ' + error.message
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
    console.log('Lectures route accessed');
    
    // Prevent caching of this page
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    // Get all lectures with populated teacher data
    const lectures = await Lecture.find().populate('teacher').sort({ dayOfWeek: 1, startTime: 1 });
    console.log(`Found ${lectures.length} lectures`);
    
    // Get all teachers for the dropdown
    const teachers = await Teacher.find().sort({ name: 1 });
    console.log(`Found ${teachers.length} teachers`);
    
    res.render('lectures', {
      title: 'Manage Lectures',
      lectures,
      teachers,
      user: req.session.username,
      error: req.query.error,
      success: req.query.success
    });
  } catch (error) {
    console.error('Lectures error:', error.message);
    console.error('Lectures error stack:', error.stack);
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

// Save lecture with enhanced error handling and session verification
app.post('/lectures/save', async (req, res) => {
  const startTime = new Date();
  console.log('🔍 LECTURE SAVE ROUTE HIT at', startTime.toISOString());
  console.log('🔍 Request method:', req.method);
  console.log('🔍 Request URL:', req.url);
  console.log('🔍 Session exists:', !!req.session);
  console.log('🔍 Session ID:', req.sessionID);
  console.log('🔍 Session data:', JSON.stringify(req.session, null, 2));
  
  // Enhanced authentication check with detailed logging
  if (!req.session || !req.session.isAuthenticated) {
    console.log('❌ Authentication failed - redirecting to login');
    console.log('   Session object:', req.session);
    console.log('   IsAuthenticated:', req.session?.isAuthenticated);
    return res.redirect('/login?error=session_expired');
  }
  
  console.log('✅ Authentication passed - user:', req.session.username);
  console.log('🔍 Request body keys:', Object.keys(req.body));
  console.log('🔍 Request body size:', JSON.stringify(req.body).length, 'bytes');
  
  try {
    // Validate required fields first
    const requiredFields = ['subject', 'teacher', 'classroom', 'dayOfWeek', 'startTime', 'endTime', 'semester'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      console.log('   Available fields:', Object.keys(req.body));
      return res.redirect('/lectures?error=' + encodeURIComponent('Missing required fields: ' + missingFields.join(', ')));
    }
    
    console.log('✅ All required fields present');
    
    // Ensure database connection with retry logic
    console.log('🔍 Ensuring database connection...');
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        await connectDB();
        console.log('✅ Database connected successfully');
        break;
      } catch (dbError) {
        retryCount++;
        console.log(`⚠️ Database connection attempt ${retryCount} failed:`, dbError.message);
        if (retryCount >= maxRetries) {
          throw new Error(`Database connection failed after ${maxRetries} attempts: ${dbError.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
      }
    }
    
    // Helper function to create date from time string
    function createDateFromTime(timeString) {
      if (!timeString) return null;
      // If it's already a valid date string, use it
      if (timeString.includes('T') || timeString.includes(' ')) {
        return new Date(timeString);
      }
      // Otherwise, assume it's a time string like "14:00" and create today's date with that time
      const today = new Date();
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0, 0);
      return date;
    }
    
    const lectureData = {
      subject: req.body.subject,
      teacher: req.body.teacher,
      dayOfWeek: req.body.dayOfWeek,
      startTime: createDateFromTime(req.body.startTime),
      endTime: createDateFromTime(req.body.endTime),
      classroom: req.body.classroom,
      semester: req.body.semester || 'XII',
      course: req.body.course || req.body.subject,
      lectureType: req.body.lectureType || 'Lecture',
      chapter: req.body.chapter || '',
      description: req.body.description || '',
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : true
    };

    console.log('🔍 Processed lecture data:', JSON.stringify(lectureData, null, 2));

    let savedLecture;
    if (req.body.id) {
      // Update existing lecture
      console.log('🔍 Updating existing lecture with ID:', req.body.id);
      const result = await Lecture.findByIdAndUpdate(req.body.id, lectureData, { new: true });
      console.log('✅ Updated lecture:', result._id);
      savedLecture = result;
    } else {
      // Create new lecture
      console.log('🔍 Creating new lecture...');
      const lecture = new Lecture(lectureData);
      savedLecture = await lecture.save();
      console.log('✅ Created new lecture:', savedLecture._id, savedLecture.subject);
    }

    // Verify the lecture is actually in the database
    console.log('🔍 Verifying lecture in database...');
    const verification = await Lecture.findById(savedLecture._id);
    if (verification) {
      console.log('✅ Lecture verified in database:', verification.subject);
    } else {
      console.log('❌ Lecture NOT found in database after save!');
      throw new Error('Lecture save verification failed');
    }

    const endTime = new Date();
    console.log('🔍 Total processing time:', endTime - startTime, 'ms');
    console.log('🔍 Redirecting to /lectures with success message...');
    
    // Force a fresh page load with cache busting
    const timestamp = Date.now();
    res.redirect(`/lectures?success=lecture_saved&t=${timestamp}&id=${savedLecture._id}`);
  } catch (error) {
    console.error('❌ Save lecture error:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    
    // Send detailed error information
    const errorMsg = `${error.message} (${error.name}) at ${new Date().toISOString()}`;
    res.redirect('/lectures?error=' + encodeURIComponent(errorMsg));
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
