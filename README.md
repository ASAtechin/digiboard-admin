# 🎯 DigiBoard Admin Dashboard

A modern, serverless admin dashboard for managing DigiBoard schedules, teachers, and lectures.

## ✨ Features

- 🔐 **Secure Authentication** - Session-based login system
- 👨‍🏫 **Teacher Management** - Add, edit, delete teacher profiles
- 📚 **Lecture Scheduling** - Complete schedule management with time slots
- 📊 **Dashboard Overview** - Statistics and recent activity monitoring
- 🌐 **Serverless Architecture** - Deployed on Netlify Functions
- 📱 **Responsive Design** - Works perfectly on all devices
- 🗄️ **MongoDB Integration** - Direct database connection for reliability

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- Netlify account

### Local Development
```bash
# Clone the repository
git clone https://github.com/ASAtechin/digiboard-admin.git
cd digiboard-admin

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and session secret

# Start development server
npm run dev
```

Visit \`http://localhost:3001\` and login with:
- **Username**: \`admin\`
- **Password**: \`admin123\`

## 🌐 Deployment

### Netlify (Recommended)

1. **Fork this repository**
2. **Connect to Netlify**: 
   - Go to [Netlify](https://app.netlify.com)
   - Click "New site from Git"
   - Select your forked repository
3. **Configure build settings**:
   ```
   Build command: npm install
   Publish directory: public
   Functions directory: netlify/functions
   ```
4. **Set environment variables**:
   ```
   MONGODB_URI=your_mongodb_connection_string
   NODE_ENV=production
   SESSION_SECRET=your_secure_session_secret
   NETLIFY=true
   ```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| \`MONGODB_URI\` | MongoDB Atlas connection string | ✅ Yes |
| \`NODE_ENV\` | Environment (development/production) | ✅ Yes |
| \`SESSION_SECRET\` | Secret key for session encryption | ✅ Yes |
| \`NETLIFY\` | Set to "true" for Netlify deployment | ⚠️ Netlify only |

## 📁 Project Structure

```
digiboard-admin/
├── 📄 server.js              # Main Express server
├── 📁 models/                # MongoDB models
│   ├── Teacher.js
│   └── Lecture.js
├── 📁 views/                 # EJS templates
│   ├── dashboard.ejs
│   ├── teachers.ejs
│   └── lectures.ejs
├── 📁 public/                # Static files
├── 📁 netlify/functions/     # Serverless functions
│   └── server.js
├── 📄 netlify.toml           # Netlify configuration
└── 📄 package.json           # Dependencies
```

## 🎯 API Routes

- \`GET /\` - Dashboard overview
- \`GET /teachers\` - Teacher management
- \`GET /lectures\` - Lecture management
- \`POST /teachers/save\` - Save teacher data
- \`POST /lectures/save\` - Save lecture data
- \`DELETE /teachers/:id\` - Delete teacher
- \`POST /lectures/delete/:id\` - Delete lecture

## 🔒 Security Features

- Session-based authentication
- CSRF protection headers
- Environment variable security
- MongoDB connection encryption
- Secure session cookies

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Templates**: EJS
- **Styling**: Bootstrap 5
- **Deployment**: Netlify Functions
- **Authentication**: Express Session

## 📊 Admin Dashboard Features

### Dashboard Overview
- Total teachers count
- Total lectures count
- Recent activity feed
- Quick statistics

### Teacher Management
- Add new teachers with contact details
- Edit existing teacher information
- Delete teachers (with confirmation)
- Search and filter teachers

### Lecture Management
- Create lecture schedules
- Assign teachers to lectures
- Set time slots and rooms
- Manage lecture status (active/cancelled)

## �� Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- Built for DigiBoard digital classroom management system
- Designed for educational institutions
- Optimized for serverless deployment

---

**🚀 Ready to manage your digital classroom schedules efficiently!**
