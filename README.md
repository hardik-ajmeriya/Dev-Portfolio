<div align="center">

# Hardik Ajmeriya – DevOps & Full-Stack Portfolio

Modern, performance‑optimized portfolio built with React, Vite, Tailwind CSS, Framer Motion, and Web3Forms. Focused on DevOps, Cloud, Automation, and clean UI/UX.

![Stack](https://img.shields.io/badge/React-18-61dafb?logo=react&style=for-the-badge) ![Vite](https://img.shields.io/badge/Vite-Build-646cff?logo=vite&style=for-the-badge) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss&style=for-the-badge) ![Framer Motion](https://img.shields.io/badge/Framer-Motion-black?logo=framer&style=for-the-badge) ![Web3Forms](https://img.shields.io/badge/Web3Forms-API-2563eb?style=for-the-badge)

</div>

## Features

- Responsive, mobile‑first design (Tailwind + optimized layout)
- Dark / light theme context with persistence
- Smooth page transitions & micro‑interactions (Framer Motion)
- Route‑level code splitting via `React.lazy` + `Suspense` spinner
- Lazy‑loaded non‑critical images (`loading="lazy"`, `decoding="async"`)
- Accessible animations (prefers‑reduced‑motion respected)
- DevOps‑focused sections: Cloud Infrastructure, CI/CD Automation, Configuration Management
- Web3Forms contact form (no backend server required) with validation & success/error states
- SEO ready meta title & description
- Auto scroll to top on route change (better navigation UX)
- Favicon support (`/public/images/favicon.png`)

## Tech Stack

| Area         | Tools |
|--------------|-------|
| Framework    | React 18 + Vite |
| Styling      | Tailwind CSS + custom gradients |
| Animations   | Framer Motion |
| Forms        | React Hook Form + Yup (advanced contact page) |
| Icons        | lucide-react |
| Email / Contact | Web3Forms API (serverless) |
| State / Theme | React Context |
| Tooling      | npm scripts |

> Note: Project uses plain JavaScript (`.jsx`) – not TypeScript.

## Project Structure (key parts)

```
src/
  App.jsx              # Routing + Suspense + page transitions
  main.jsx             # App bootstrap
  index.css            # Tailwind & global scroll behavior
  contexts/ThemeContext.jsx
  components/Navbar.jsx / Footer.jsx
  pages/
    Home.jsx           # Hero, skills, animated sections
    About.jsx          # Journey, quote, skills display
    Projects.jsx       # Filterable project gallery
    Contact.jsx        # Web3Forms integrated form
public/
  images/              # Static assets (Me.png, project images, favicon.png)
```

## Environment Variables

Create `.env` in project root:

```env
VITE_WEB3FORMS_ACCESS_KEY=YOUR-WEB3FORMS-UUID-KEY
```

Access inside React:

```js
import.meta.env.VITE_WEB3FORMS_ACCESS_KEY
```

Make sure the key is a valid UUID and mapped to your email (e.g. `hardik.ajmeriya89@gmail.com`) in the Web3Forms dashboard.

## Getting Started

```bash
git clone <repo-url>
cd Hardik_Dev_Portfolio
npm install
npm run dev
```

Visit: `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview    # Serve dist locally for verification
```

## Contact Form (Web3Forms)

The form posts directly to Web3Forms – no custom backend required.

Flow:
1. User submits form.
2. `Contact.jsx` creates `FormData` with `access_key`, `name`, `email`, `subject`, `message`, `replyto`.
3. POST to `https://api.web3forms.com/submit`.
4. Success → show green message; failure → show error.

If you rotate your access key just update `.env` and restart dev server.

## Validation

Yup + React Hook Form used on the full contact page to enforce required fields, minimum lengths, and email format. Simple fallback validation is embedded for Web3Forms example usage.

## Customization

- Replace profile image: `public/images/Me.png` & update alt text.
- Edit hero roles / skills in `Home.jsx` (`techStack` array).
- Update journey text & quote in `About.jsx`.
- Add or modify projects in `Projects.jsx` (`projects` array).
- Change gradients / branding in `tailwind.config.js`.

## Performance & UX Optimizations

- Route code splitting reduces initial bundle.
- Critical hero image kept eager; other images lazy.
- Smooth scrolling (`html { scroll-behavior: smooth }`).
- Auto-scroll to top on navigation to avoid persistent scroll position.
- Reduced-motion media query disables long animations if user prefers.

## Accessibility Notes

- High color contrast in dark theme.
- Focus states preserved on interactive elements.
- Motion reduced for users with `prefers-reduced-motion`.
- Semantic headings (single H1 per page).

## Deployment (Vercel / Netlify Recommended)

1. Set environment variable `VITE_WEB3FORMS_ACCESS_KEY` in platform dashboard.
2. Deploy; Vite will expose the key at build time.
3. Verify contact form by sending a test message.

## Optional Cleanup

If you are not using the legacy `backend/` folder (Web3Forms removes need for a custom mail API):
1. Delete the folder.
2. Remove unused dependencies from `package.json` (Express, etc. if present).

## Future Enhancements

- Blog / articles (MDX)
- Metrics dashboard (GitHub contributions, AWS costs, etc.)
- Light performance report widget (Lighthouse score)
- Global search across sections
- Tag‑based project filtering UX improvements
- Toast notifications for form status

## Security Considerations

- Do not commit real secrets other than public Web3Forms access key.
- Rotate access key periodically in Web3Forms dashboard.
- Validate user input before adding any backend endpoints in future.