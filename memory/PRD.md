# Naija LMS - Nigerian Learning Management System

## Project Overview
A fully functional MVP Learning Management System for Nigerian online schools with manual bank transfer payment verification.

## Original Problem Statement
Build a fully functional MVP LMS for a Nigerian online school where payments are handled manually via bank transfer/USSD with admin verification before access is granted. Mobile-first, secure, ready for automated payments upgrade.

## Tech Stack
- **Frontend**: React.js + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT
- **File Storage**: Cloudinary (configured)
- **Payments**: Manual Bank Transfer

## User Personas
1. **Students**: Nigerian learners seeking quality online education
2. **Administrators**: Academy staff managing courses, payments, and students

## Core Requirements (Implemented)
- [x] Public pages (Home, Courses, Course Details, About, Contact)
- [x] Student registration and login (JWT auth)
- [x] Manual payment workflow (bank details, proof upload, admin verification)
- [x] Student dashboard with enrolled courses and payment status
- [x] Course access with video lessons and progress tracking
- [x] Admin dashboard with stats overview
- [x] Admin course management (CRUD)
- [x] Admin lesson management with video upload
- [x] Admin payment approval/rejection
- [x] Admin student management
- [x] Admin settings (editable bank details)
- [x] Contact form with database storage
- [x] Nigerian Naira (₦) currency formatting
- [x] Warm orange/gold Nigerian-inspired design

## What's Been Implemented (January 2025)

### Backend Features
- User authentication (register, login, JWT)
- Course CRUD operations
- Lesson management
- Payment submission and verification
- Enrollment tracking with lesson progress
- Contact message storage
- Admin-editable bank settings
- Cloudinary file upload endpoints

### Frontend Pages
- HomePage with hero, stats, benefits, featured courses
- CoursesPage with search and filtering
- CourseDetailPage with learning outcomes
- AboutPage with mission/vision
- ContactPage with form
- LoginPage and RegisterPage
- PaymentPage with bank details and proof upload
- StudentDashboard, StudentCourses, StudentPayments
- CoursePlayer with video and progress tracking
- AdminDashboard with stats
- AdminCourses with CRUD
- AdminLessons with video upload
- AdminPayments with approval workflow
- AdminStudents list
- AdminMessages inbox
- AdminSettings for bank details

### Sample Data
- 3 sample courses (Web Dev, Digital Marketing, Data Analysis)
- 3 sample lessons for Web Dev course
- Bank settings configured
- Admin account: admin@naijalms.com / Admin123!

## Prioritized Backlog

### P0 (Critical - Not Blocking MVP)
- Email notifications (Nodemailer configured but needs SMTP keys)

### P1 (High Priority)
- Password reset functionality
- Student profile editing
- Certificate generation on course completion
- Mobile responsive sidebar (hamburger menu)

### P2 (Medium Priority)
- Course categories/tags
- Student reviews and ratings
- Quiz/assessment feature
- Bulk email to students
- Payment reminders

### P3 (Future Enhancements)
- Automated payment gateway (Paystack/Flutterwave)
- Course bundles/discounts
- Referral program
- Multi-language support
- Mobile app (React Native)

## Environment Variables Required
```
# Backend (.env)
MONGO_URL=mongodb://localhost:27017
DB_NAME=naija_lms
SECRET_KEY=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-app-password
```

## Next Action Items
1. Configure Cloudinary API keys for file uploads
2. Configure SMTP credentials for email notifications
3. Add real course content and videos
4. Deploy to production environment
5. Set up real bank account details in admin settings
