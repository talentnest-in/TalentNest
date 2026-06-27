# State Management

## Server State (TanStack Query)
Used for all API data fetching, caching, and mutations.
- `useQuery`: Fetching profiles, jobs, portfolios.
- `useMutation`: Logging in, updating profiles, creating jobs.
- **Invalidation**: Query cache is invalidated after mutations to ensure UI freshness.

## Client State (React Context)
- **AuthContext**: Manages user session, token existence, login/logout functions.
- **ThemeProvider**: Manages Light/Dark mode preferences.

## Form State
- Handled locally within components using `react-hook-form`.
- Validated with `zod`.
