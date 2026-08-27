
# Digital Innovation Hub for MinT 🇪🇹


A digital platform designed to connect Ethiopian startup founders, investors, citizens, and innovation stakeholders with opportunities, resources, and a trusted startup ecosystem.


The platform supports startup onboarding and MinT verification, investor–startup connections, secure document sharing, and moderated innovation opportunities.


## 🌐 Live Platform


| Service | URL |
|---|---|
| **Frontend** | https://digital-innovation-hub-for-mint.vercel.app |
| **Backend API** | https://digital-innovation-hub-for-mint.onrender.com |


---


## ✨ Key Features


### 🔐 Authentication & Role-Based Access Control


- JWT-based authentication
- Secure user registration and login
- Role-based authorization
- Protected routes and API endpoints
- User profile management


### 🚀 Startup Management


- Founder startup registration
- Startup profile creation and management
- Startup submission for MinT verification
- Admin review and approval/rejection
- Verified startup status
- Public directory of verified startups
- Startup statistics and dashboard


### 🏢 MinT Verification Workflow


The platform provides a structured verification process:


```text
Founder creates startup
        ↓
Startup submitted
        ↓
MinT Admin reviews
        ↓
   ┌────┴────┐
   ↓         ↓
Approve    Reject
   ↓         ↓
Verified   Rejected
   ↓
Public Directory

When a startup is approved, the founder receives an email notification.

📁 Secure Data Room

Founders can securely manage startup documents and control investor access.

Upload startup documents
View uploaded documents
Delete documents
Investor access requests
Founder approval/denial of requests
Controlled document access
Secure document downloads
💼 Investor Features
Browse verified startups
Request access to startup Data Rooms
Track access requests
Receive access notifications
Post job and internship opportunities
📢 Opportunities

The platform supports moderated opportunities such as:

Jobs
Internships
Innovation opportunities

Opportunities submitted by users require administrator approval before becoming visible.

👨‍💼 Admin Dashboard

Administrators can:

Review startups
Approve startups
Reject startups
Delete startups
Manage users
Moderate opportunities
View platform statistics
👥 User Roles
Role	Capabilities
Founder	Create and manage startups, upload Data Room documents, manage investor access
Investor	Browse verified startups, request Data Room access, post opportunities
Admin	Verify/reject startups, manage users, moderate opportunities, view statistics
Citizen	Browse verified startups and approved opportunities
🏗️ System Architecture
                    Digital Innovation Hub
                             │
             ┌───────────────┴───────────────┐
             │                               │
        React Frontend                  Express API
           Vercel                         Render
             │                               │
             │                         ┌─────┴─────┐
             │                         │           │
             │                    MongoDB Atlas  Cloudinary
             │
             └──────────── API ────────────────┘
                             
                         Brevo Email API
🛠️ Technology Stack
Frontend
React 19
Vite
Tailwind CSS
React Router
Axios
Backend
Node.js
Express 5
Mongoose
JWT
bcrypt
Multer
Database
MongoDB Atlas
File Storage
Cloudinary
Email
Brevo API
HTTPS API integration
SMTP is not used for production email delivery
Deployment
Vercel — Frontend
Render — Backend
MongoDB Atlas — Database
Cloudinary — File storage
Brevo — Transactional email
📂 Project Structure
Digital-Innovation-Hub-For-MINT/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── utils/
│   │   └── ...
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   ├── server.js
│   └── package.json
│
└── README.md
🔌 API Overview

Base URL:

/api

Authentication:

Authorization: Bearer <JWT_TOKEN>
Authentication — /api/auth
Method	Endpoint	Access	Description
POST	/register	Public	Register a new user
POST	/login	Public	Login and receive JWT
GET	/me	Private	Get current user
PUT	/profile	Private	Update user profile
Startups — /api/startups
Method	Endpoint	Access	Description
GET	/public	Public	List verified startups
GET	/public-stats	Public	Get public startup statistics
POST	/	Founder	Create startup
GET	/my	Founder	Get founder's startup
PUT	/my	Founder	Update founder's startup
GET	/admin	Admin	List startups with filters
GET	/stats	Admin	Get admin dashboard statistics
PATCH	/:id/approve	Admin	Approve and verify startup
PATCH	/:id/reject	Admin	Reject startup
DELETE	/:id	Admin	Delete startup
GET	/:id	Conditional	Get startup by ID
Access Requests — /api/access-requests
Method	Endpoint	Access	Description
POST	/	Investor	Request Data Room access
GET	/my	Investor	Get own requests
GET	/incoming	Founder	Get incoming requests
PATCH	/:id/approve	Founder	Approve investor access
PATCH	/:id/deny	Founder	Deny investor access
Documents — /api/documents
Method	Endpoint	Access	Description
POST	/	Founder	Upload document
GET	/my	Founder	List own documents
DELETE	/:id	Founder	Delete document
GET	/startup/:startupId	Authorized	List startup documents
GET	/:id/download	Authorized	Download document
Opportunities — /api/opportunities
Method	Endpoint	Access	Description
GET	/	Authenticated	List approved opportunities
GET	/my	Investor/Admin	List own opportunities
POST	/	Investor/Admin	Create opportunity
PATCH	/:id/approve	Admin	Approve opportunity
PATCH	/:id/reject	Admin	Reject opportunity
PUT	/:id	Admin	Update opportunity
DELETE	/:id	Admin	Delete opportunity
Users — /api/users
Method	Endpoint	Access	Description
GET	/	Admin	List users
DELETE	/:id	Admin	Delete user
💻 Local Development
1. Clone the repository
git clone https://github.com/abelixir/Digital-Innovation-Hub-For-MINT.git
cd Digital-Innovation-Hub-For-MINT
2. Install backend dependencies
cd server
npm install

Create:

server/.env

Add the required environment variables.

3. Start the backend
npm run dev

Backend:

http://localhost:5000
4. Install frontend dependencies

Open another terminal:

cd client
npm install

Create:

client/.env

Add:

VITE_API_URL=http://localhost:5000/api
5. Start the frontend
npm run dev

Frontend:

http://localhost:5173
🔑 Environment Variables
Backend — server/.env
PORT=5000


MONGO_URI=your_mongodb_uri


JWT_SECRET=your_secure_secret
JWT_EXPIRES_IN=7d


CLIENT_URL=http://localhost:5173


BREVO_API_KEY=your_brevo_api_key
EMAIL_USER=your_verified_sender@email.com
EMAIL_FROM=Digital Innovation Hub <your_verified_sender@email.com>


CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
Frontend — client/.env
VITE_API_URL=http://localhost:5000/api
⚠️ Security

Never commit environment files containing secrets.

Do not commit:

.env
.env.local

Production environment variables should be configured through the Vercel and Render dashboards.

🚀 Deployment
Frontend — Vercel

The frontend is deployed using Vercel.

Root Directory: client

Environment variable:

VITE_API_URL=https://digital-innovation-hub-for-mint.onrender.com/api
SPA Routing

React Router requires all frontend routes to resolve to index.html.

This is handled by:

client/vercel.json

with the appropriate SPA rewrite configuration.

Backend — Render

The Express API is deployed using Render.

Root Directory: server

Configure all required backend environment variables in the Render dashboard.

The production API is available at:

https://digital-innovation-hub-for-mint.onrender.com
Render Free Tier

The Render free instance may sleep after periods of inactivity, which can result in a cold-start delay when the API is accessed again.

Database — MongoDB Atlas

The production database uses MongoDB Atlas.

Configure the required network access and database credentials in MongoDB Atlas.

☁️ Cloudinary

Cloudinary is used for startup and Data Room file storage.

Required environment variables:

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
📧 Transactional Email

The platform uses Brevo for transactional email notifications.

Emails are triggered for important platform events, including:

Startup approved
        ↓
Founder receives notification


Investor requests Data Room access
        ↓
Founder receives notification


Founder approves investor access
        ↓
Investor receives notification

The production application communicates with Brevo through its HTTPS API.

The current Brevo free tier provides approximately 300 emails per day. Check Brevo's current plan limits before relying on a specific quota.

🔄 Core Platform Workflows
Startup Verification
Founder
   │
   ├── Create startup
   │
   └── Submit startup
          │
          ▼
      MinT Admin
          │
     ┌────┴────┐
     │         │
  Approve    Reject
     │         │
     ▼         ▼
 Verified   Rejected
     │
     ▼
Public Directory
Investor Data Room Access
Investor
    │
    ▼
Request Access
    │
    ▼
Founder
    │
 ┌──┴──┐
 │     │
Approve Deny
 │
 ▼
Documents Accessible
Opportunity Moderation
Investor
    │
    ▼
Create Job/Internship
    │
    ▼
Admin Review
    │
 ┌──┴──┐
 │     │
Approve Reject
 │
 ▼
Visible to Users
🔒 Security

The application implements:

JWT authentication
Password hashing
Role-based authorization
Protected API routes
Founder ownership checks
Admin-only moderation endpoints
Controlled Data Room access
Environment-based secret management
Cloudinary-backed file storage

Sensitive credentials should never be committed to source control.

📈 Future Improvements

Potential future improvements include:

Advanced startup search and filtering
Mentor matching
Investor–startup recommendation system
Multilingual AI assistant
Innovation competitions
Advanced analytics
Notification center
Enhanced startup verification workflow
Audit logs for administrative actions
Improved document security
Production monitoring and observability
👨‍💻 Development Workflow

This project uses Git and GitHub for collaborative development.

Recommended workflow:

git pull origin main


# Make changes


git add .
git commit -m "Describe your changes"
git push origin main

The deployment platforms automatically build and deploy new changes pushed to the configured branch.

📄 License

This project is licensed under the MIT License.



## What you should do now


Since **your fork is the one you're developing/deploying**, do this from your project in VS Code:


### 1. Open the project


```bash
cd ~/Digital-Innovation-Hub-For-MINT
code .