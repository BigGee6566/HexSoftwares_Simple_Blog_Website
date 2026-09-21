<div align="center">
  <img src="assets/images/nova-journal-logo.png" alt="NOVA Journal" width="420">
  <h1>NOVA Journal</h1>
  <p><strong>Ideas, technology, and stories shaping the future.</strong></p>
  <p>A modern, responsive blog platform built with nothing but HTML5, CSS3 and vanilla JavaScript.</p>
</div>

---

## Task

Built for the **Hex Softwares Pvt. Ltd. Web Development Internship — Task 1** ("Simple Blog Website").

The brief asked for a basic responsive blog. NOVA Journal treats it as a real product: a six-page publication with image uploads, search, filtering, dark mode, a single-post reading view, and a full create-post editor — with no framework, no backend and no build step.

## Live features

| Area | What it does |
|------|--------------|
| **Home** | Animated mesh-gradient hero, featured post, latest posts grid, topic chips, live stats, about preview, newsletter signup |
| **Blog listing** | Live search, category filter chips with counts, sort (newest / oldest / A–Z / Z–A), "Load more" pagination, bookmark + delete per card |
| **Single post** | Large featured image, full article rendering, reading-progress bar, share buttons (X, LinkedIn, Facebook, copy link), bookmark, tags, related posts, prev/next navigation, local comments |
| **Create post** | Image upload *or* image URL, canvas resize + compression, live preview panel, character counters, auto reading-time, per-field validation, quota-safe saving |
| **About** | Author bio, tech-stack tags, live article stats, what-I-learned and design-inspiration sections |
| **Contact** | Validated front-end-only contact form, contact info cards, social links |
| **Everywhere** | Dark/light theme toggle, sticky blurred header, mobile drawer with focus trap, scroll reveals, toasts, scroll-to-top, skip link |

## Technologies

- **HTML5** — semantic landmarks, correct heading order, labelled form controls
- **CSS3** — custom properties, Grid, Flexbox, `aspect-ratio`, `backdrop-filter`, `color-mix`, mobile-first media queries
- **Vanilla JavaScript (ES5-compatible)** — no libraries, no bundler
- **localStorage** — post, bookmark, comment, newsletter and message persistence
- **FileReader API** — reading uploaded image files
- **Canvas API** — resizing and compressing images before storage
- **Base64 data URLs** — storing uploaded images inline
- **IntersectionObserver** — performant scroll-reveal animations

## File structure

```
HexSoftwares_Simple_Blog_Website/
│
├── index.html              Home page
├── blog.html               Blog listing (search, filter, sort)
├── post.html               Single post view (?id=…)
├── create-post.html        Create-post editor with live preview
├── about.html              About page
├── contact.html            Contact page
│
├── css/
│   ├── style.css           Design system: tokens, components, themes
│   └── responsive.css      Breakpoints + mobile navigation drawer
│
├── js/
│   ├── data.js             Seed posts, storage helpers, formatters
│   ├── app.js              Theme, nav, toasts, safe rendering, cards
│   ├── blog.js             Home sections, listing, single post view
│   ├── create-post.js      Form, image compression, validation
│   └── contact.js          Contact form handling
│
├── assets/
│   ├── images/
│   │   ├── nova-journal-logo.png
│   │   ├── favicon.png
│   │   ├── fallback.jpg            Shown if any image fails to load
│   │   ├── author-avatar.jpg
│   │   └── cover-*.jpg             Six branded category covers
│   └── icons/                      (icons are inline SVG in the markup)
│
├── favicon.ico
└── README.md
```

## Running it locally

No build step and no dependencies.

**Option 1 — open directly**

Double-click `index.html`, or open it in any modern browser.

**Option 2 — local server (recommended)**

```bash
python -m http.server 8000
```

Then visit <http://localhost:8000>.

> A server is recommended because some browsers restrict `localStorage` on `file://` URLs. Everything else works either way.

## How it works

1. **First visit** — if `localStorage` key `hexsoftwares_blog_posts` is empty, six full sample posts are seeded automatically, so the site is never blank.
2. **Reading** — `blog.js` reads posts from storage, derives what should be on screen (filter → sort → slice), and re-renders the list from scratch. Cards link to `post.html?id=<post id>`.
3. **Writing** — `create-post.js` validates every field, resizes any uploaded image on a `<canvas>` to a maximum width of 1200px, converts it to a Base64 JPEG, and appends the post to storage.
4. **Rendering** — all user content is written through `textContent` and DOM nodes, never `innerHTML`. Post bodies support a small whitelisted markup subset (`## heading`, `- bullet`, `1. numbered`, `> quote`, `**bold**`, `*italic*`, `` `code` ``) parsed into real elements, so stored content can never execute script.

### Storage keys

| Key | Contents |
|-----|----------|
| `hexsoftwares_blog_posts` | All blog posts |
| `hexsoftwares_theme` | `"dark"` or `"light"` |
| `nova_bookmarks` | Bookmarked post IDs |
| `nova_comments` | Comments, keyed by post ID |
| `nova_newsletter` | Newsletter subscribers |
| `nova_messages` | Contact form submissions |

### Image handling

Images are first-class in this project:

- **Upload** — file input + drag-and-drop, resized to ≤1200px wide and compressed to JPEG at quality 0.82 before encoding.
- **URL** — paste any direct image URL instead; it previews live once it loads. If both are provided, the uploaded file wins.
- **Placeholder** — a post with no image gets a branded gradient placeholder showing its category name, so cards never look broken.
- **Fallback chain** — every `<img>` falls back to `assets/images/fallback.jpg` on error, and then to the gradient placeholder if even that fails. A broken-image icon is never shown.
- **Alt text** — required whenever an image is used.
- **Quota safety** — a warning appears above ~2MB, `QuotaExceededError` is caught, and **your form content is never cleared when a save fails**.

#### Using remote photos instead

The bundled covers are local so the site works offline. To use Unsplash photos instead, edit the `COVERS` object at the top of `js/data.js`:

```js
var COVERS = {
  ai: 'https://images.unsplash.com/photo-XXXXXXXX?auto=format&fit=crop&w=1200&q=80',
  // …
};
```

Good sources: [AI & technology](https://unsplash.com/s/photos/ai-technology) · [software developers](https://unsplash.com/s/photos/software-developers) · [entrepreneurship](https://unsplash.com/s/photos/entrepreneurship) · [coding laptop](https://unsplash.com/s/photos/coding-laptop) · [business start-up](https://unsplash.com/s/photos/business-start-up).

The fallback chain means a dead URL degrades gracefully rather than breaking the layout.

## Accessibility

- Semantic landmarks (`header`, `nav`, `main`, `article`, `aside`, `footer`) and a skip-to-content link
- Sequential heading order on every page
- Every form control has a visible `<label>`; errors use an icon **and** text, never colour alone
- Errors are announced via `role="alert"` / `aria-live`
- Mobile drawer manages `aria-expanded`, traps focus, and closes on <kbd>Esc</kbd>
- All interactive targets are at least 44×44px
- Visible `:focus-visible` rings throughout
- `prefers-reduced-motion` and `prefers-contrast` are both respected
- Light-mode accent is darkened to `#06708F` so accent text clears 4.5:1 contrast on white

## Browser support

Current versions of Chrome, Edge, Firefox and Safari. `backdrop-filter` and `color-mix` degrade gracefully where unsupported.

## Design inspiration

Referenced, not copied — **Medium** (reading experience), **Dev.to** (card grid and tags), **Hashnode** (dark developer aesthetic), **Ghost** (editorial featured layout), and [anshuopinion/Project-9-Blog-Website](https://github.com/anshuopinion/10-Practice-Project-Html-CSS/tree/Project-9-Blog-Website/Project%209) (basic blog structure reference).

## Submission

1. Create a GitHub repository named **`HexSoftwares_Simple_Blog_Website`**
2. Push this code to the repository
3. Record a LinkedIn video walking through the project and include the repository link, tagging **Hex Softwares Pvt. Ltd.**

## Possible next steps

- A backend (Node + Express, or Supabase/Firebase) so posts are not limited to one browser
- Authentication and an admin dashboard for managing posts
- A proper Markdown editor with live split-pane preview
- Cloud image uploads (Cloudinary / S3) to remove the localStorage size ceiling
- Server-side comments with moderation
- Analytics, and a real newsletter integration (Mailchimp / Buttondown)
- Deployment to GitHub Pages, Netlify or Vercel
- Full-text search across post bodies, plus RSS output

---

<div align="center">
  <sub>© 2026 NOVA Journal — Hex Softwares Web Development Internship — Task 1</sub>
</div>
