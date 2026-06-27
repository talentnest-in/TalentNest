# Database Schema

## ER Diagram
```mermaid
erDiagram
    User ||--o| FreelancerProfile : has
    User ||--o| ClientProfile : has
    FreelancerProfile ||--o{ Skill : has
    FreelancerProfile ||--o{ Experience : has
    FreelancerProfile ||--o{ Education : has
    FreelancerProfile ||--o{ PortfolioProject : has
    ClientProfile ||--o| Company : has
    ClientProfile ||--o{ Job : posts
    Job ||--o{ JobSkill : requires
```

## Models
- **User**: Base account (Email/OAuth, Role).
- **FreelancerProfile**: Bio, hourly rate, location, resume.
  - **Skill**, **Experience**, **Education**, **PortfolioProject**.
- **ClientProfile**: Bio, website, location, logo.
  - **Company**: Industry, size, description.
  - **Job**: Title, description, budget, type (FIXED/HOURLY), status.
    - **JobSkill**.

## Enums
- `Role`: FREELANCER, CLIENT, ADMIN
- `JobStatus`: DRAFT, OPEN, PAUSED, CLOSED
- `JobType`: FIXED, HOURLY
