# 🎓 DigiBoard Admin Dashboard

> **Production-Ready Admin Dashboard for DigiBoard Schedule Management**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ASAtechin/digiboard-admin)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/)

## 🚀 **Live Demo**
**Production URL:** [https://digiboard-admin.vercel.app](https://digiboard-admin-706w9h1hc-adityas-projects-dbc75222.vercel.app)

**Login Credentials:**
- Username: `admin`
- Password: `admin123`

---

## 📋 **Features**

### 🎯 **Core Management**
- ✅ **Teacher Management** - Add, edit, delete teacher profiles with complete information
- ✅ **Lecture Scheduling** - Comprehensive lecture planning and organization
- ✅ **Schedule Overview** - Daily and weekly schedule visualization
- ✅ **Quick Updates** - Rapid schedule modifications and emergency changes

### 📊 **Dashboard Analytics**
- ✅ **Real-time Statistics** - Teacher count, lecture metrics, active schedules
- ✅ **Next Lecture Display** - Immediate upcoming lecture information
- ✅ **Status Monitoring** - Active/inactive lecture tracking

### ⚡ **Quick Actions**
- ✅ **Bulk Operations** - Mass lecture activation/deactivation
- ✅ **Substitute Assignment** - Quick teacher substitution
- ✅ **Lecture Rescheduling** - Time and room changes
- ✅ **Emergency Announcements** - Instant broadcast capability

---

## 🛠️ **Technology Stack**

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - ODM for MongoDB
- **EJS** - Templating engine

### **Frontend**
- **Bootstrap 5** - Responsive UI framework
- **Font Awesome** - Icon library
- **Vanilla JavaScript** - Interactive functionality

### **Deployment**
- **Vercel** - Serverless deployment platform
- **GitHub** - Version control and CI/CD

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18 or higher
- MongoDB Atlas account
- Git

### **Local Development**
```bash
# Clone the repository
git clone https://github.com/ASAtechin/digiboard-admin.git
cd digiboard-admin

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and session secret

# Start development server
npm run dev

# Access at http://localhost:3001
```

### **Environment Variables**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
SESSION_SECRET=your-super-secure-session-secret
PORT=3001
NODE_ENV=development
```

---

## 🌐 **Deployment**

### **Deploy to Vercel**
1. **Fork this repository**
2. **Connect to Vercel** - Import your GitHub repository
3. **Set Environment Variables:**
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `SESSION_SECRET`: Secure session secret key
4. **Deploy** - Vercel handles the rest automatically

### **Manual Deployment**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

---

## 📁 **Project Structure**

```
digiboard-admin/
├── 📄 server.js              # Main Express application
├── 📄 vercel.json            # Vercel deployment configuration
├── 📄 package.json           # Dependencies and scripts
├── 📁 models/                # MongoDB schemas
│   ├── Teacher.js            # Teacher model
│   └── Lecture.js            # Lecture model
├── 📁 views/                 # EJS templates
│   ├── login.ejs             # Login page
│   ├── dashboard.ejs         # Main dashboard
│   ├── teachers.ejs          # Teacher management
│   ├── lectures.ejs          # Lecture management
│   └── quick-update.ejs      # Quick actions
├── 📁 public/                # Static assets
│   ├── css/                  # Stylesheets
│   ├── js/                   # JavaScript files
│   └── index.html            # Landing page
└── 📁 models/                # Database models
```

---

## 🔐 **Security Features**

- ✅ **Session-based Authentication**
- ✅ **Secure Environment Variables**
- ✅ **Input Validation & Sanitization**
- ✅ **CSRF Protection Headers**
- ✅ **Production-ready Security Headers**

---

## 🎯 **Usage Guide**

### **Login**
1. Navigate to the deployed URL
2. Click "Access Dashboard"
3. Enter credentials: `admin` / `admin123`

### **Teacher Management**
1. Go to **Teachers** section
2. Add new teachers with complete profiles
3. Edit existing teacher information
4. Manage teacher assignments

### **Lecture Scheduling**
1. Navigate to **Lectures**
2. Create new lecture schedules
3. Assign teachers to lectures
4. Set time slots and classrooms

### **Quick Updates**
1. Use **Quick Update** for rapid changes
2. Cancel/activate lectures instantly
3. Assign substitute teachers
4. Reschedule lectures on-the-fly

---

## 🤝 **Contributing**

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 📞 **Support**

- **Issues:** [GitHub Issues](https://github.com/ASAtechin/digiboard-admin/issues)
- **Documentation:** [Wiki](https://github.com/ASAtechin/digiboard-admin/wiki)
- **Email:** support@asatechin.com

---

## 🙏 **Acknowledgments**

- **Bootstrap Team** for the excellent UI framework
- **MongoDB** for reliable cloud database services
- **Vercel** for seamless deployment platform
- **Express.js Community** for the robust backend framework

---

<div align="center">

**Made with ❤️ by [ASA Techin](https://github.com/ASAtechin)**

⭐ **Star this repository if you find it helpful!**

</div>
