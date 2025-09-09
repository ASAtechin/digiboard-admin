# 🔧 Development Guide - DigiBoard Admin

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Git for version control

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/ASAtechin/digiboard-admin.git
cd digiboard-admin

# Install dependencies
npm install

# Set up environment
cp config/.env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

## 📁 Working with the New Structure

### Configuration Management
```bash
# Environment files location
config/
├── .env.example          # Template for environment variables
├── .env.production       # Production environment settings
├── railway.toml          # Railway deployment configuration
└── vercel.json           # Vercel deployment configuration

# Copy and customize for development
cp config/.env.example .env
```

### Development Scripts
```bash
# Development server with hot reload
npm run dev

# Production server
npm start

# Run tests
npm test                  # All tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only

# View project structure
npm run structure         # Shows directory tree
```

### Testing Framework
```bash
# Navigate to tests directory
cd tests

# Install test dependencies
npm install

# Run specific test suites
npm run test:unit         # Model and component tests
npm run test:integration  # API endpoint tests
npm run test:schedule     # Schedule logic tests
npm run test:coverage     # Tests with coverage report
```

### Utility Scripts
```bash
# Database diagnostic
node scripts/check-db-config.js

# System monitoring
node scripts/monitor-updates.js

# Form simulation (for testing)
node scripts/simulate-form.js

# Deployment
./scripts/deploy.sh
```

## 🗂️ File Organization Guidelines

### Adding New Features

#### 1. Database Models
```bash
# Add new models to:
models/
├── YourModel.js          # Follow existing pattern
```

#### 2. Views/Templates
```bash
# Add new EJS templates to:
views/
├── your-view.ejs         # Follow existing naming
```

#### 3. Static Assets
```bash
# Add CSS, JS, images to:
public/
├── css/your-styles.css
├── js/your-script.js
└── images/your-image.jpg
```

#### 4. Utility Functions
```bash
# Add reusable utilities to:
utils/
├── your-utility.js       # Create as needed
```

#### 5. Scripts and Tools
```bash
# Add development scripts to:
scripts/
├── your-script.js        # For development/maintenance
```

#### 6. Tests
```bash
# Add tests following the hierarchy:
tests/
├── unit/your-unit.test.js
├── integration/your-api.test.js
├── schedule/your-logic.test.js
└── e2e/your-workflow.test.js
```

#### 7. Documentation
```bash
# Add documentation to:
docs/
├── YOUR_FEATURE.md       # Feature documentation
```

### Configuration Updates

#### Environment Variables
```bash
# Add new variables to:
config/.env.example       # Template
config/.env.production    # Production values
.env                      # Local development (gitignored)
```

#### Deployment Configuration
```bash
# Update deployment configs:
config/vercel.json        # Vercel settings
config/railway.toml       # Railway settings
```

## 🔧 Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/your-feature

# Develop in appropriate directories
# - Models in /models/
# - Views in /views/
# - Tests in /tests/
# - Scripts in /scripts/

# Test your changes
npm test

# Commit and push
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature
```

### 2. Testing Workflow
```bash
# Write tests first (TDD approach)
# 1. Add unit tests in tests/unit/
# 2. Add integration tests in tests/integration/
# 3. Add workflow tests in tests/e2e/

# Run tests during development
cd tests
npm run test:watch        # Continuous testing
```

### 3. Documentation Workflow
```bash
# Update relevant documentation
# - README.md for user-facing changes
# - docs/ for technical documentation
# - PROJECT_STRUCTURE.md for structural changes
```

### 4. Deployment Workflow
```bash
# Test deployment locally
./scripts/deploy.sh

# Production deployment
npm run deploy            # Vercel
npm run deploy-railway    # Railway
```

## 📋 Best Practices

### Code Organization
- ✅ **Single Responsibility**: Each file has one clear purpose
- ✅ **Logical Grouping**: Related files in same directory
- ✅ **Clear Naming**: Descriptive file and directory names
- ✅ **Documentation**: README files in complex directories

### Configuration Management
- ✅ **Environment Separation**: Different configs for dev/prod
- ✅ **Template Files**: .example files for easy setup
- ✅ **Secure Defaults**: No sensitive data in templates
- ✅ **Platform Specific**: Separate configs for each platform

### Testing Strategy
- ✅ **Test Hierarchy**: Unit → Integration → E2E
- ✅ **Comprehensive Coverage**: All features tested
- ✅ **Isolated Tests**: Each test independent
- ✅ **Fast Feedback**: Quick test execution

### Documentation
- ✅ **Up-to-date**: Documentation matches code
- ✅ **Clear Examples**: Code examples for complex features
- ✅ **Process Documentation**: How to contribute and deploy
- ✅ **Troubleshooting**: Common issues and solutions

## 🔍 Troubleshooting

### Common Issues

#### "Cannot find module" errors
```bash
# Check if you're in the right directory
pwd

# Install dependencies
npm install

# For test modules
cd tests && npm install
```

#### Environment variable issues
```bash
# Check if .env file exists
ls -la .env

# Copy from template if missing
cp config/.env.example .env
```

#### Database connection issues
```bash
# Test database connection
node scripts/check-db-config.js

# Verify MongoDB URI format
echo $MONGODB_URI
```

#### Deployment failures
```bash
# Check configuration files
ls -la config/

# Verify all required files exist
./scripts/deploy.sh
```

### Getting Help

1. **Check Documentation**: Review files in `/docs/`
2. **Run Diagnostics**: Use scripts in `/scripts/`
3. **Test Environment**: Run tests in `/tests/`
4. **Review Structure**: Check `PROJECT_STRUCTURE.md`

## 🎯 Next Steps

After setting up the development environment:

1. **Explore the Structure**: Familiarize yourself with the new organization
2. **Run Tests**: Ensure everything works with `npm test`
3. **Start Development**: Begin with `npm run dev`
4. **Read Documentation**: Review guides in `/docs/`
5. **Deploy**: Test deployment with `./scripts/deploy.sh`

---

**Happy Coding! 🚀**

The organized structure makes development more efficient and maintainable.
