# KPI Performance Management System

A full-stack KPI Performance Management System built with React + TypeScript (frontend) and Express.js + PostgreSQL (backend).

## Features

- **Three User Roles**: Employee, Manager, and HR
- **KPI Setting Process**: Managers set KPIs, employees acknowledge them
- **KPI Review Process**: Employees self-rate, managers review and rate
- **Digital Signatures**: Secure signature fields for KPI acknowledgment and reviews
- **Email Notifications**: Automated reminders and notifications
- **PDF Generation**: Automatic PDF generation for completed reviews
- **Role-based Routing**: Secure access control based on user roles
- **Modern UI**: Clean, professional SaaS interface with TailwindCSS

## Tech Stack

### Frontend
- React 19 + TypeScript
- React Router for routing
- TailwindCSS for styling
- Axios for API calls
- React Signature Canvas for digital signatures
- React DatePicker for date selection

### Backend
- Node.js + Express.js
- PostgreSQL database
- JWT authentication
- Nodemailer for email notifications
- PDFKit for PDF generation
- Node-cron for scheduled reminders

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd kpi-process-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up PostgreSQL database:
   - Create a database named `kpi_management`
   - Run the schema: `psql -U postgres -d kpi_management -f database/schema.sql`
   - (Optional) Seed with sample data: `psql -U postgres -d kpi_management -f database/seed.sql`

4. Create `.env` file (copy from `.env.example`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kpi_management
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@kpimanager.com
FRONTEND_URL=http://localhost:5173
```

5. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd kpi-process-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

## Demo Credentials

### Manager
- Payroll Number: `MGR-2024-0089`
- National ID: `NAT-001`

### Employee
- Payroll Number: `EMP-2024-0145`
- National ID: `NAT-003`

### HR
- Payroll Number: `HR-2024-0001`
- National ID: `NAT-009`

## Project Structure

```
kpi-process-backend/
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── db.js
├── middleware/
│   └── auth.js
├── routes/
│   ├── auth.js
│   ├── employees.js
│   ├── kpis.js
│   ├── kpiAcknowledgement.js
│   ├── kpiReview.js
│   └── notifications.js
├── services/
│   ├── emailService.js
│   ├── pdfService.js
│   └── schedulerService.js
└── server.js

kpi-process-frontend/
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── SignatureField.tsx
│   │   └── DatePicker.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── manager/
│   │   ├── employee/
│   │   └── hr/
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with payroll number and national ID
- `GET /api/auth/me` - Get current user

### Employees
- `GET /api/employees` - Get all employees (manager/HR only)
- `GET /api/employees/:id` - Get employee by ID

### KPIs
- `GET /api/kpis` - Get all KPIs (role-based filtering)
- `GET /api/kpis/:id` - Get KPI by ID
- `POST /api/kpis` - Create new KPI (manager only)
- `PATCH /api/kpis/:id` - Update KPI (manager only)
- `GET /api/kpis/dashboard/stats` - Get dashboard statistics

### KPI Acknowledgement
- `POST /api/kpi-acknowledgement/:kpiId` - Acknowledge KPI (employee only)

### KPI Reviews
- `GET /api/kpi-review` - Get all reviews
- `GET /api/kpi-review/:id` - Get review by ID
- `POST /api/kpi-review/:kpiId/self-rating` - Submit self-rating (employee)
- `POST /api/kpi-review/:reviewId/manager-review` - Submit manager review

### Notifications
- `GET /api/notifications` - Get all notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/unread/count` - Get unread count

## Features in Detail

### KPI Setting Process
1. Manager sets KPIs in a table format
2. Manager signs digitally
3. Email notification sent to employee
4. Employee acknowledges KPIs
5. Notifications sent to manager and HR

### KPI Review Process
1. Automatic reminders sent (quarterly/yearly)
2. Employee completes self-rating
3. Manager reviews and rates
4. PDF generated automatically
5. Email notifications sent to employee and HR

## License

ISC
