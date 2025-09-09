# DigiBoard Admin - Project Structure

## 📁 Directory Organization

```
digiboard-admin/
├── 📂 config/                    # Configuration files
│   ├── .env.example             # Environment template
│   ├── .env.production          # Production environment
│   ├── railway.toml             # Railway deployment config
│   └── vercel.json              # Vercel deployment config
│
├── 📂 docs/                      # Documentation
│   ├── CONVERSATION_LOG.md      # Technical development log
│   ├── IMPROVEMENTS_SUMMARY.md  # Project improvements summary
│   ├── PRODUCTION_DEPLOYMENT.md # Deployment guide
│   └── PROMPTS_HISTORY.md       # Development conversation history
│
├── 📂 models/                    # Database models
│   ├── Lecture.js               # Lecture model schema
│   └── Teacher.js               # Teacher model schema
│
├── 📂 public/                    # Static assets
│   ├── css/                     # Stylesheets
│   ├── js/                      # Client-side JavaScript
│   └── images/                  # Images and icons
│
├── 📂 scripts/                   # Utility scripts
│   ├── check-collections.js     # Database collection checker
│   ├── check-db-config.js       # Database configuration validator
│   ├── deploy.sh                # Automated deployment script
│   ├── diagnostic-test.js       # System diagnostic tests
│   ├── monitor-updates.js       # System monitoring utility
│   ├── simulate-form.js         # Form simulation for testing
│   ├── test-*.js               # Various testing utilities
│   └── cookies.txt              # Session cookies for testing
│
├── 📂 tests/                     # Testing framework
│   ├── 📂 unit/                 # Unit tests
│   │   ├── basic.test.js        # Basic environment tests
│   │   ├── lecture.test.js      # Lecture model tests
│   │   └── teacher.test.js      # Teacher model tests
│   ├── 📂 integration/          # Integration tests
│   │   ├── lectures.test.js     # Lecture API tests
│   │   ├── schedule.test.js     # Schedule API tests
│   │   └── schedule-simple.test.js # Basic schedule tests
│   ├── 📂 schedule/             # Schedule-specific tests
│   │   ├── logic-analysis.test.js   # Schedule logic tests
│   │   └── schedule-logic.test.js   # Conflict detection tests
│   ├── 📂 e2e/                 # End-to-end tests
│   │   └── complete-workflows.test.js # Full workflow tests
│   ├── COMPREHENSIVE_REPORT.md  # Test results report
│   ├── diagnostic.test.js       # Diagnostic test suite
│   ├── final-analysis.test.js   # Final system analysis
│   ├── package.json             # Test dependencies
│   └── test-setup.js            # Test utilities and setup
│
├── 📂 utils/                     # Utility functions
│   └── (future utility modules)
│
├── 📂 views/                     # EJS templates
│   ├── dashboard.ejs            # Main dashboard view
│   ├── lectures.ejs             # Lectures management view
│   ├── login.ejs                # Login page
│   ├── quick-update.ejs         # Quick update form
│   ├── schedule.ejs             # Main schedule view (enhanced)
│   ├── schedule_new.ejs         # Development version
│   ├── schedule_old.ejs         # Backup of original
│   └── teachers.ejs             # Teachers management view
│
├── 📄 .env                      # Local environment variables (gitignored)
├── 📄 .gitignore               # Git ignore rules
├── 📄 LICENSE                  # Project license
├── 📄 package.json             # Node.js dependencies and scripts
├── 📄 package-lock.json        # Dependency lock file
├── 📄 README.md                # Project overview and setup
└── 📄 server.js                # Main application server
```

## 🎯 Directory Purposes

### `/config/` - Configuration Management
- **Environment files**: Development, production, and example configurations
- **Deployment configs**: Platform-specific deployment settings
- **Purpose**: Centralized configuration management

### `/docs/` - Documentation Hub
- **Development logs**: Conversation history and technical logs
- **Deployment guides**: Production deployment instructions
- **Project summaries**: Improvements and feature documentation
- **Purpose**: Complete project documentation

### `/models/` - Data Models
- **Database schemas**: Mongoose models for MongoDB
- **Business logic**: Data validation and relationships
- **Purpose**: Data structure definitions

### `/public/` - Static Assets
- **Frontend resources**: CSS, JavaScript, images
- **Client-side files**: User interface assets
- **Purpose**: Static file serving

### `/scripts/` - Utility Scripts
- **Development tools**: Testing and diagnostic utilities
- **Deployment automation**: Build and deploy scripts
- **Database utilities**: Connection and validation tools
- **Purpose**: Development and maintenance automation

### `/tests/` - Testing Framework
- **Unit tests**: Individual component testing
- **Integration tests**: API and workflow testing
- **End-to-end tests**: Complete user journey testing
- **Purpose**: Quality assurance and validation

### `/utils/` - Shared Utilities
- **Helper functions**: Reusable utility modules
- **Common tools**: Shared functionality across the app
- **Purpose**: Code reusability and organization

### `/views/` - Frontend Templates
- **EJS templates**: Server-side rendered views
- **User interface**: Admin dashboard interfaces
- **Purpose**: Frontend presentation layer

## 🔧 File Organization Principles

### 1. **Separation of Concerns**
- Configuration files separated from source code
- Documentation isolated from implementation
- Testing framework in dedicated directory

### 2. **Environment Management**
- Development vs. production configurations
- Platform-specific deployment settings
- Environment variable templates

### 3. **Testing Structure**
- Hierarchical test organization (unit → integration → e2e)
- Comprehensive coverage across all components
- Dedicated test utilities and setup

### 4. **Documentation Strategy**
- Development process documentation
- Technical implementation guides
- Deployment and maintenance instructions

### 5. **Script Organization**
- Development utilities separated
- Deployment automation centralized
- Testing tools organized by purpose

## 📋 Best Practices Applied

✅ **Clear Directory Structure**: Logical organization of files  
✅ **Configuration Management**: Centralized environment settings  
✅ **Documentation Strategy**: Comprehensive project documentation  
✅ **Testing Framework**: Well-organized test suites  
✅ **Utility Scripts**: Development and maintenance automation  
✅ **Asset Management**: Static files properly organized  
✅ **Template Organization**: Frontend views structured logically  

## 🚀 Development Workflow

1. **Development**: Work in source files (`server.js`, `/models/`, `/views/`)
2. **Configuration**: Manage settings in `/config/`
3. **Testing**: Run tests from `/tests/` directory
4. **Documentation**: Update docs in `/docs/`
5. **Deployment**: Use scripts from `/scripts/`
6. **Utilities**: Leverage tools in `/utils/`

This structure promotes maintainability, scalability, and team collaboration while following Node.js project best practices.
