# Gas Cylinder Manager

A modern React application for managing gas cylinder transactions, customers, and inventory. Built with React, Vite, Tailwind CSS, and Zustand for state management.

## Features

- 🏢 **Customer Management**: Add, edit, and manage customer information
- 📊 **Transaction Tracking**: Record and track gas cylinder transactions
- 💰 **Payment Management**: Handle payments and outstanding balances
- 📈 **Analytics Dashboard**: View business insights and reports
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 💾 **Local Storage**: All data persists locally in the browser
- 🎨 **Modern UI**: Beautiful gradient design with professional styling

## Technology Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **File Operations**: XLSX for Excel export/import

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/gas-cylinder-manager.git
cd gas-cylinder-manager
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

\`\`\`
gas-cylinder-manager/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── ui/           # Reusable UI components
│   │   ├── *.jsx         # Feature components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and store
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # Application entry point
│   └── index.css         # Global styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
\`\`\`

## Features Overview

### Customer Management
- Add new customers with contact information
- Edit existing customer details
- View customer transaction history
- Track outstanding balances

### Transaction Management
- Record gas cylinder transactions
- Support for different cylinder sizes (6kg, 13kg, 50kg)
- Handle returns, outright sales, and swipes
- Flexible pricing per transaction

### Payment Tracking
- Record partial and full payments
- Bulk payment functionality
- Outstanding balance calculations
- Payment history

### Analytics
- Transaction summaries
- Revenue tracking
- Customer insights
- Export capabilities

## Data Storage

This application uses browser local storage to persist data. All information is stored locally and does not require a backend server.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
