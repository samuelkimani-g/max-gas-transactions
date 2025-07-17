# Max Gas Transactions

A comprehensive gas cylinder management dashboard with web and desktop applications for tracking transactions, customers, and business analytics.

## 🚀 Features

### Core Functionality
- **Customer Management**: Add, edit, and track customer information
- **Transaction Tracking**: Record gas cylinder sales and returns
- **Payment Processing**: Handle payments and credit management
- **Inventory Management**: Track cylinder stock levels
- **Reporting & Analytics**: Generate reports and business insights
- **Forecasting**: Predict future demand using ARIMA models

### User Roles & Access Control
- **Admin**: Full system access and user management
- **Manager**: Business operations and approval workflows
- **Operator**: Transaction processing and customer service

### Multi-Platform Support
- 🌐 **Web Application**: React-based dashboard accessible from any browser
- 🖥️ **Desktop Application**: Electron-based native app for Windows, Mac, and Linux
- 📱 **Mobile Responsive**: Optimized for tablet and mobile use

## 🛠️ Technology Stack

### Frontend
- **React 18** with Vite for fast development
- **Tailwind CSS** for modern, responsive design
- **Chart.js** and **Recharts** for data visualization
- **Zustand** for state management
- **Radix UI** for accessible components

### Backend
- **Node.js** with Express.js
- **SQLite** database (easily upgradable to PostgreSQL)
- **Sequelize ORM** for database management
- **JWT** for authentication
- **bcrypt** for password hashing

### Desktop App
- **Electron** for cross-platform desktop application
- **Electron Builder** for automated builds and distribution

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Git

### Quick Start
```bash
# Clone the repository
git clone https://github.com/samuelkimani-g/max-gas-transactions.git
cd max-gas-transactions

# Install all dependencies
npm run install:all

# Setup database and seed initial data
npm run db:setup-prod

# Start development servers
npm run dev:full
```

### Development Commands
```bash
# Install dependencies
npm run install:all

# Start frontend development server
npm run dev

# Start backend development server
npm run backend:dev

# Start both frontend and backend
npm run dev:full

# Build for production
npm run build

# Build desktop application
npm run desktop:dist:win
```

## 🔐 Default Login Credentials

⚠️ **Important**: Change these passwords after first login!

- **Admin**: `admin` / `admin123`
- **Manager**: `manager` / `manager123`
- **Operator**: `operator` / `operator123`

## 🚀 Deployment

### Web Application (Vercel)
```bash
# Deploy to Vercel
npm run deploy:vercel
```

### Desktop Application
```bash
# Build for Windows
npm run desktop:dist:win

# Build for macOS
npm run desktop:dist:mac

# Build for Linux
npm run desktop:dist:linux
```

### Automated Deployment
Use the provided deployment scripts:
- **Windows**: `deploy.bat`
- **Linux/Mac**: `deploy.sh`

## 📊 Key Features

### Dashboard Analytics
- Real-time transaction monitoring
- Revenue tracking and trends
- Customer activity insights
- Inventory status overview

### Customer Management
- Customer profiles with contact information
- Transaction history per customer
- Credit limit management
- Customer categorization

### Transaction Processing
- Gas cylinder sales and returns
- Payment processing
- Credit transactions
- Receipt generation

### Reporting System
- Sales reports
- Customer reports
- Inventory reports
- Financial summaries
- Export to Excel/PDF

### Approval Workflow
- Manager approval for certain operations
- Audit trail for all changes
- Role-based access control

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-jwt-key
DB_TYPE=sqlite
DB_PATH=./database.sqlite
```

### Database Setup
The application uses SQLite by default for simplicity. For production, consider:
- PostgreSQL for better performance
- Regular database backups
- Connection pooling

## 📱 Desktop Application

The desktop app provides:
- Offline capability
- Native system integration
- Automatic updates
- Local data storage

### Building Desktop App
```bash
cd electron
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the deployment guide in `DEPLOYMENT_GUIDE.md`

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
- Web and desktop applications
- Multi-role user system
- Complete transaction management
- Analytics and reporting

---

**Built with ❤️ for efficient gas cylinder business management**
