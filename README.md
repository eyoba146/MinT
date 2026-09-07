# MinT Digital Innovation Hub

The MinT Digital Innovation Hub is a digital platform for Ethiopia's startup and innovation ecosystem. It connects founders, investors, ecosystem builders, reviewers, administrators, moderators, and citizens through workflows for startup designation, verification, investment discovery, opportunities, and secure document sharing.

## Live platform

| Service     | URL                                         |
| ----------- | ------------------------------------------- |
| Frontend    | https://mint-digital-innovation.vercel.app/ |
| Backend API | https://mint-3c4v.onrender.com              |

## Main capabilities

### Authentication and accounts

- JWT authentication with protected frontend routes and API endpoints.
- Role-based access for founders, investors, ecosystem builders, reviewers, moderators, administrators, and citizens.
- Email verification before a new account becomes active.
- Pending registrations allow users to correct an email before verification.
- Verification-code resend protection with a 60-second countdown.
- Password reset and profile editing.
- Profile settings grouped into account information, role preferences, and security.
- Role protection for restricted pages such as the verification workflow.

### Founder and startup designation

- Create, save, edit, and submit startup designation applications.
- Idea-stage ventures can use a startup or project working name; this does not imply legal registration.
- Application fields cover problem, solution, innovation, technology, scalability, market impact, ownership, economic value, legal information, and supporting documents.
- Live eligibility checklist with 14 requirements and a real-time progress bar.
- AI-assisted text polishing for selected application descriptions.
- Startup dashboard, application status, designation certificate, annual reports, and renewal workflow.
- Founder-controlled data room with document upload, deletion, and investor access management.

### Verification and review

- Structured startup review workflow for reviewers and administrators.
- Case details, review status, decisions, clarification requests, audit history, and designation actions.
- Reviewer dashboard for startup applications, builder reviews, and verification queues.
- Sidebar notification counters for pending builder reviews and verification cases.
- Administrator actions for approval, rejection, suspension, revocation, user management, and analytics.

### Investor discovery and AI matching

- Browse designated startups and ecosystem builders.
- Investor profiles include organization, investment range, and focus sectors such as FinTech, AgriTech, EdTech, HealthTech, LogisticsTech, and CleanTech.
- AI matching ranks the actual designated-startup registry using investor preferences.
- The directory can apply or clear the AI ranking filter without a separate recommendation section.
- Local fallback ranking keeps matching available when the AI provider is unavailable or quota-limited.
- Investor interest tracking, startup connections, deal-stage updates, and data-room access requests.

### Opportunities and ecosystem builders

- Create and moderate jobs, internships, and innovation opportunities.
- Admin and moderator approval before opportunities become publicly visible.
- Ecosystem builder applications, public builder directory, and reviewer/admin management.
- Public directory pages for startups, builders, and opportunities.

### User experience and accessibility

- Responsive dashboard shell with role-specific navigation.
- Consistent light interface with readable spacing, form controls, focus states, and clear status indicators.
- Accessible progress indicators and role-aware navigation.
- Typography adjustments for older users, including improved content sizing and textarea line spacing.
- Responsive authentication, registration, and email-verification screens.

## User roles

| Role              | Main capabilities                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Founder           | Manage a startup application, submit for designation, manage documents and investor access, view certificates and reports  |
| Investor          | Maintain preferences, browse startups, use AI matching, express interest, request data-room access, and post opportunities |
| Ecosystem builder | Create and manage a builder profile and participate in the innovation directory                                            |
| Reviewer          | Review startup designation cases, builder applications, and verification queues                                            |
| Moderator         | Moderate startups, ecosystem builders, and opportunity posts                                                               |
| Administrator     | Manage users, review cases, moderate content, view analytics, and manage designation decisions                             |
| Citizen           | Browse public startups, builders, and approved opportunities                                                               |

## System architecture

```text
React 19 + Vite + Tailwind CSS
              |
              | HTTPS REST API
              v
Node.js + Express + Mongoose
       |          |          |
       v          v          v
 MongoDB      Cloudinary   Brevo
  Atlas       file storage  email API
              |
              v
        Google Gemini API
        optional AI features
```

## Technology stack

### Frontend

- React 19, Vite, Tailwind CSS 4, React Router, Axios
- Lucide React, Recharts, Motion, and Three.js

### Backend

- Node.js, Express 5, Mongoose, JSON Web Tokens, bcryptjs, Multer
- Cloudinary SDK, Brevo email API, and Google Gemini REST API

### Services

- MongoDB Atlas for data
- Cloudinary for startup logos and data-room files
- Brevo for transactional email
- Google Gemini for text polishing and investor-startup ranking
- Vercel for the frontend and Render for the backend

## Project structure

```text
Digital-Innovation-Hub-For-MINT/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── data/
│   │   ├── pages/
│   │   └── utils/
│   ├── index.html
│   ├── package.json
│   └── vercel.json
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
└── README.md
```

## Local development

### Clone and install

```bash
git clone https://github.com/eyoba146/MinT.git
cd MinT
cd server
npm install
cd ../client
npm install
```

### Environment variables

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secure_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000

BREVO_API_KEY=your_brevo_api_key
EMAIL_USER=your_verified_sender@email.com
EMAIL_FROM=MinT Digital Innovation Hub <your_verified_sender@email.com>

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Never commit environment files.

### Run locally

From `server/`:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

From `client/` in another terminal:

```bash
npm run dev
```

The frontend runs at `http://localhost:3000`.

Create a production client build with `npm run build` from `client/`.

## API overview

The API base path is `/api`. Protected endpoints use:

```http
Authorization: Bearer <JWT_TOKEN>
```

| Route group               | Purpose                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `/api/auth`               | Registration, login, email verification, password reset, profile, and verification status                 |
| `/api/startups`           | Public directory, founder applications, connections, case review, designation, suspension, and revocation |
| `/api/ai`                 | Protected text polishing and investor-startup analysis                                                    |
| `/api/access-requests`    | Investor data-room requests and founder decisions                                                         |
| `/api/documents`          | Data-room documents and authorized downloads                                                              |
| `/api/opportunities`      | Opportunity creation, moderation, and listings                                                            |
| `/api/ecosystem-builders` | Builder applications, public profiles, and review actions                                                 |
| `/api/certificates`       | Designation certificates                                                                                  |
| `/api/audit`              | Administrative and startup case audit history                                                             |
| `/api/users`              | Administrator user management                                                                             |

## AI features

Gemini is used for founder text polishing and investor-startup ranking. AI requests have a 30-second timeout. Investor matching includes a local fallback ranking so a temporary AI outage, malformed response, or provider quota limit does not prevent the directory from working. AI results support the user experience and do not replace formal MinT review or investment decisions.

## Deployment

### Frontend: Vercel

- Root directory: `client`
- Build command: `npm run build`
- Environment variable: `VITE_API_URL=https://mint-3c4v.onrender.com/api`
- SPA rewrites are configured in `client/vercel.json`.

### Backend: Render

- Root directory: `server`
- Start command: `npm start`
- Configure all server environment variables in the Render dashboard.

The Render free tier may sleep after inactivity, so the first request can take longer.

### MongoDB Atlas and Cloudinary

Configure MongoDB Atlas network access and credentials. Configure Cloudinary credentials for startup logos and data-room file storage.

## Security notes

- Do not commit `.env` or `.env.local` files.
- Store production secrets only in Vercel and Render environment settings.
- Passwords are hashed before storage.
- Access is protected by JWT authentication, role checks, ownership checks, and data-room authorization.
- File uploads are handled through the backend and Cloudinary.
- AI API keys remain on the server and are never exposed to the browser.

## Development workflow

```bash
git pull origin main

# Make changes and verify them
cd client
npm run build

git add .
git commit -m "Describe your changes"
git push origin main
```

## License

This project is licensed under the MIT License.
