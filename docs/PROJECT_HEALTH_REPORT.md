# Project Health Report

**Generated on:** 2026-06-27
**Target:** TalentNest Codebase

---

## 📊 Health Scores

| Category | Score | Notes |
| :--- | :---: | :--- |
| **Architecture** | **8.0 / 10** | Clear Client/Server separation. Good use of Fastify controllers/routes and TanStack Query on the frontend. Could benefit from a dedicated Service layer in the backend to decouple business logic from HTTP handlers. |
| **Code Quality** | **7.5 / 10** | Strong typing with TypeScript and robust runtime validation with Zod. Some frontend components (like `ProfileManager.tsx`) are quite large and handle too many responsibilities. |
| **Folder Structure** | **8.5 / 10** | Logical separation of frontend/backend. Clear grouping by domain/feature in both repositories. |
| **Security** | **7.5 / 10** | Good baseline: Helmet, CORS, Rate Limiting, bcrypt, and HttpOnly cookies. However, global rate limiting is used rather than route-specific (e.g., stricter limits on `/login`). Local file uploads pose a potential Disk Exhaustion (DoS) risk. |
| **Performance** | **8.0 / 10** | Fastify is exceptionally fast, and TanStack Query handles client-side caching beautifully. The main bottleneck is the lack of pagination on listing endpoints (e.g., fetching all jobs at once). |
| **Scalability** | **6.5 / 10** | The database and API can scale horizontally, but the **local file upload strategy (`public/uploads`) completely blocks horizontal scaling**. Multiple server instances will not share the same disk. |
| **UI Consistency** | **8.5 / 10** | Excellent use of Tailwind CSS and a dedicated `components/ui` folder for base elements (Buttons, Inputs). Highly consistent design language. |
| **Accessibility** | **6.0 / 10** | Missing comprehensive `aria-*` attributes. Custom modals and form elements need better keyboard navigation and screen reader support. |
| **Maintainability** | **8.0 / 10** | Zod schemas and Prisma models act as a strong source of truth. Easy for new developers to understand. |

---

## 🔍 Codebase Analysis

### 1. Duplicate Code
- **Frontend API Services:** Repeated Axios boilerplate in various service files (`auth.service.ts`, `job.service.ts`, etc.). This could be abstracted into a generic API builder.
- **UI Cards:** `JobCard.tsx`, `CompanyCard.tsx`, and `ResumeCard.tsx` share very similar structural and styling patterns. A base `<Card />` component in `ui/` could reduce this duplication.

### 2. Dead Code & Unused Files
- **Backend Utilities:** `backend/clear-users.ts` is a leftover utility script that shouldn't be in the production deployment path.
- **Frontend Assets:** Check `frontend/public/` and `src/assets/` for default Vite SVGs (`vite.svg`, `react.svg`) that are likely unused in the final build.

### 3. Performance Bottlenecks
- **No Pagination:** Endpoints like `GET /jobs` and `GET /freelancers` return all records. As the database grows, this will cause massive payload sizes, slow queries, and UI lag.
- **Image Optimization:** Uploaded images (avatars, portfolio pieces) are served exactly as uploaded. Serving a 5MB image for a 40x40 avatar thumbnail severely impacts page load times.

### 4. Security Risks
- **Disk Exhaustion (DoS):** Because files are uploaded directly to the server's disk without aggressive quotas, a malicious user could repeatedly upload 10MB files and crash the server by filling up the storage.
- **File Type Validation:** Ensure that `multipart` file uploads strictly validate MIME types (e.g., preventing a `.exe` or `.php` file masquerading as a `.jpg`).

### 5. Missing Validations
- **String Length Bounds:** Zod schemas validate that strings exist, but often lack `.max()` constraints. (e.g., preventing a 100,000-character string from being submitted as a "bio", which could stress the database).
- **Pagination Parameters:** Missing Zod validation for `page` and `limit` queries on list routes.

### 6. Technical Debt
- **Fat Controllers:** The backend controllers handle HTTP request parsing, Zod validation, business logic, and database operations all in one place.
- **Local File Storage:** Storing user uploads in `public/uploads` is a major technical debt that prevents zero-downtime deployments and horizontal scaling.

### 7. Refactoring Opportunities
- **Extract a Service Layer (Backend):** Move the core business logic (e.g., creating a job, verifying OAuth users) out of the Fastify controllers and into a `src/services/` directory. This makes the logic unit-testable without spinning up an HTTP server.
- **Cloud Storage Interface (Backend):** Abstract the file upload logic behind an interface (e.g., `StorageProvider`). Create a `LocalStorageProvider` for development and an `S3StorageProvider` for production.
- **Layout Components (Frontend):** Extract the common page structures (Sidebar + Header + Main Content) into reusable layout wrapper components (e.g., `DashboardLayout.tsx`).
- **Form Component Wrapper (Frontend):** Combine React Hook Form and Zod into a reusable `<Form />` wrapper to remove repetitive setup code in pages like `Login.tsx` and `Signup.tsx`.

---

## 🎯 Prioritized Recommendations

### High Priority (Do Now)
1. **Migrate File Uploads:** Move file storage to AWS S3, Cloudinary, or Supabase Storage to fix the critical scalability block.
2. **Implement Pagination:** Add `limit` and `offset` (or cursor-based pagination) to all listing APIs and update TanStack Query to use `useInfiniteQuery`.
3. **Add Max Length Validations:** Update backend Zod schemas to enforce strict database column limits (e.g., `VARCHAR(255)` -> `.max(255)`).

### Medium Priority (Do Next)
4. **Abstract Backend Business Logic:** Refactor "Fat Controllers" into a distinct Service layer for easier testing and maintainability.
5. **Optimize Images:** Implement dynamic image resizing (either via a CDN like Cloudinary or a backend tool like `sharp`) before serving avatars and thumbnails.

### Low Priority (Future Polish)
6. **Accessibility Audit:** Run Lighthouse or Axe to identify and fix missing ARIA labels on custom inputs, buttons, and modals.
7. **Extract UI Layouts:** Create higher-order layout components in the frontend to clean up page-level code.
