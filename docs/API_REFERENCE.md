# API Reference

Base URL: `/api/v1`

## Auth
- `POST /auth/register` - Create local account
- `POST /auth/login` - Login local account
- `GET /auth/me` - Get current user profile
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/github` - Initiate GitHub OAuth

## Freelancer
- `GET /freelancers/profile` - Get profile
- `PUT /freelancers/profile` - Update profile
- `POST /freelancers/resume` - Upload resume
- `POST /freelancers/skills` - Add skill
- `POST /freelancers/experience` - Add experience
- `POST /freelancers/education` - Add education

## Client
- `GET /clients/profile` - Get profile
- `PUT /clients/profile` - Update profile
- `GET /company` - Get company details
- `PUT /company` - Update company details

## Jobs
- `GET /jobs` - List open jobs
- `POST /client/jobs` - Create a job
- `PUT /client/jobs/:id` - Update a job
- `DELETE /client/jobs/:id` - Delete a job
