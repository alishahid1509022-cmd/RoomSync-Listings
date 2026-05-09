# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# RoomSync — Room Listings

A Single Page Application for browsing and managing room listings in Lahore. Built as Assignment 03 for the Web Engineering course (BSCS, Spring 2026).

## 🌐 Live Demo

🔗 [https://roomsync-listings-xxxxx.web.app](https://roomsync-listings-xxxxx.web.app)

## 👤 Author

**Ali** — SAP ID: 70145611
BSCS Winter-2026, 6th Semester
University of Lahore (UOL)

## ⚙️ Tech Stack

- **Frontend:** React 19 (Vite)
- **Routing:** React Router DOM v7
- **Database:** Firebase Firestore
- **Hosting:** Firebase Hosting
- **Styling:** Custom CSS with CSS Variables (light/dark mode)
- **Fonts:** Plus Jakarta Sans, Playfair Display

## ✨ Features

- ✅ SPA routing with dynamic routes (`/view/:id`, `/edit/:id`)
- ✅ Full CRUD operations on Firestore
- ✅ Real-time data sync with `onSnapshot`
- ✅ Light/Dark mode toggle
- ✅ Responsive design
- ✅ Form validation
- ✅ Loading and error states

## 📂 Routes

| Route | Description |
|-------|-------------|
| `/` | Home page |
| `/create` | Add a new room listing |
| `/all` | View all listings (cards) |
| `/view/:id` | View a single listing (dynamic route) |
| `/edit/:id` | Edit an existing listing |

## 🗃️ Firestore Schema

Collection: `listings`

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Listing title |
| `location` | string | Room location |
| `rent` | number | Monthly rent in PKR |
| `roomType` | string | Private / Shared |
| `furnished` | string | Furnished / Semi-Furnished / Unfurnished |
| `description` | string | Listing details |
| `contactName` | string | Contact person |
| `contactPhone` | string | Contact phone number |
| `imageUrl` | string | Optional photo URL |
| `createdAt` | timestamp | Auto-generated |
| `updatedAt` | timestamp | Updated on edit |

## 🚀 Run Locally

```bash
# Clone the repo
git clone https://github.com/YOUR-USERNAME/roomsync-listings.git
cd roomsync-listings

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## 📜 License

Submitted as coursework for The University of Lahore.