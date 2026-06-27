# UI Guidelines

## Typography
- Font Family: Inter (or similar sans-serif).
- Headings: Bold, high contrast.

## Colors
- **Primary**: Brand color for prominent actions.
- **Accent**: Highlight color for interactive elements.
- **Background**: Page background (light/dark mode aware).
- **Surface**: Card and modal backgrounds.
- **Text**: Primary text color.
- **Text-Muted**: Secondary text color.
- **Border**: Dividers and inputs.
- **Error/Success/Warning**: Semantic colors.

## Spacing & Grid
- 4px base unit (Tailwind default).
- Flexbox and Grid layouts.
- Gap-4 (16px) or Gap-6 (24px) commonly used.

## Components
- **Cards**: Rounded corners (rounded-2xl), subtle border, shadow on hover.
- **Buttons**: Rounded-lg, hover effects, scale down on tap.
- **Inputs**: Rounded-lg, focus ring (ring-accent).

## Dark Mode
- Supported via Tailwind `dark:` variants.
- Toggled via `ThemeProvider` context.
