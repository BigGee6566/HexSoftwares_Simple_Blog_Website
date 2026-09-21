# HexSoftwares Simple Blog Website

A responsive four-page blog built with plain HTML5, CSS3, and vanilla JavaScript for the **Hex Softwares Web Development Internship — Task 1**.

## Pages

| Page | File | Description |
|------|------|-------------|
| Home | `index.html` | Hero section + 3 most recent posts |
| Blog Posts | `blog.html` | All posts + form to create new posts |
| About | `about.html` | About the project and author |
| Contact | `contact.html` | Client-side validated contact form |

## Technologies Used

- **HTML5** — Semantic markup across all pages
- **CSS3** — Custom properties, Flexbox, Grid, responsive design, animations
- **Vanilla JavaScript** — localStorage CRUD, form validation, DOM manipulation
- No frameworks, no libraries, no build tools

## How It Works

- **`css/styles.css`** — Shared stylesheet with CSS variables, responsive breakpoints, and dark mode support
- **`js/app.js`** — Reads and writes blog posts to `localStorage`, validates forms, handles mobile navigation
- Posts are stored under the key `hexsoftwares_blog_posts` in the browser's localStorage
- Three sample posts are seeded automatically on first visit
- No backend — data persists only in the browser that created it

## Running Locally

No build step needed. Serve the folder with any static server:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

Or simply open `index.html` directly in a browser (note: some browsers restrict localStorage on `file://` URLs).

## File Structure

```
HexSoftwares_Simple_Blog_Website/
├── index.html          Home page
├── blog.html           Blog Posts page
├── about.html          About page
├── contact.html        Contact page
├── css/
│   └── styles.css      All styling
├── js/
│   └── app.js          All JavaScript
└── README.md           This file
```

## Submission

1. Create a GitHub repository named `HexSoftwares_Simple_Blog_Website`
2. Push all code to the repository
3. Record a LinkedIn video explaining the project and link the repo

## Task

Built for the **Hex Softwares Web Development Internship — Task 1** ("Simple Blog Website").
