<div align="center">
  <img src="assets/images/nova-journal-logo.png" alt="NOVA Journal" width="420">
  <h1>NOVA Journal</h1>
  <p><strong>Notes from building software, and the business questions that come with it.</strong></p>
  <p>A technology and creativity publication built with HTML5, CSS3 and vanilla JavaScript — no framework, no backend, no build step.</p>
</div>

---

## Task

Built for the **Hex Softwares Web Development Internship — Task 1** ("Simple Blog Website").

Created by **Yongama Goso**, an Information Systems student, emerging software developer and technology entrepreneur from South Africa.

## Topics

| Topic | Covers |
|---|---|
| Artificial Intelligence | AI tools, trends, ethics, and practical applications |
| Software Development | Coding, web development, databases, debugging, and project building |
| Entrepreneurship | Business ideas, innovation, startup lessons, and personal development |
| Digital Innovation | Technology solutions that improve how people learn, work, and access opportunities |
| Education and Skills | Digital literacy, learning resources, and career development |
| Creative Technology | Content creation, design, media, and the connection between creativity and technology |

---

## Feature accuracy

Everything below was verified against the actual code in this repository.

### Implemented (works fully, client-side)

**Home (`index.html`)**
- Editorial hero with publication masthead and the NOVA orbital mark
- **Featured Editorial** — newest post flagged `featured: true`, falling back to the newest post overall
- **Latest Articles** — three most recent posts, excluding whatever is already featured, each with a bookmark button
- **Explore Our Topics** — six topics rendered as a ruled index with live article counts
- Author preview and newsletter form

**Blog listing (`blog.html`)**
- Live search across title, excerpt, body, author, topic and tags (debounced)
- Topic filter chips with live counts, plus a **Saved** bookmarks view
- Sort: Newest, Oldest, Title A–Z, Title Z–A
- "Load more" pagination in pages of six
- Per-card bookmark and delete (delete behind a focus-trapped confirmation dialog)
- Distinct empty states for no posts, no search matches, and no saved articles
- Press <kbd>/</kbd> to jump to the search box

**Single article (`post.html`)**
- Renders by `?id=` from the query string; unknown IDs show a "Post not found" state
- Breadcrumbs (Home / Blog / Topic / Article)
- Reading-progress bar, reading time, tags, scroll-to-top
- Share to X, LinkedIn, Facebook, and copy-link with toast confirmation
- Bookmark toggle, previous/next navigation, related articles by topic
- Comment form with validation

**Create post (`create-post.html`)**
- Image upload via `FileReader` **or** image URL, with live preview and removal
- Canvas resize to a maximum width of 1200px, JPEG compression at quality 0.82
- Character counters, live word counter, auto-calculated reading time (editable)
- Per-field validation, including rejecting future dates
- Live preview panel showing the card as it will appear
- Unique IDs from `Date.now()` plus a random suffix

**Global**
- Dark and light themes, applied before first paint to avoid a flash
- Sticky header with backdrop blur on scroll
- Mobile drawer with `aria-expanded`, focus trap, Escape to close, click-outside to close
- Skip-to-content link, visible focus rings, `prefers-reduced-motion` and `prefers-contrast` support
- Toasts, scroll reveals, page-load fade

### Simulated with localStorage (no server involved)

These features work and persist, but only inside the browser that created them. Nothing is transmitted anywhere.

| Feature | Key |
|---|---|
| Blog posts | `hexsoftwares_blog_posts` |
| Theme preference | `hexsoftwares_theme` |
| Bookmarks | `hexsoftwares_bookmarks` |
| Comments | `hexsoftwares_comments` |
| Newsletter sign-ups | `hexsoftwares_newsletter_subscribers` |
| Contact messages | `hexsoftwares_contact_messages` |

- **The contact form does not send email.** It validates, shows a success message and stores the entry locally.
- **The newsletter has no mailing list behind it.** It validates, blocks duplicates and stores locally.
- **Comments are per-browser.** They are not shared between visitors.
- Data written by an earlier version under `nova_*` keys, or using the older `Education` / `Entertainment` topic names, is migrated automatically on load.

### Requires manual testing

Automated checks run in headless Chromium only. These need a human:

- Real-device testing on iOS Safari and Android Chrome
- Screen-reader passes (NVDA, VoiceOver) beyond the structural checks below
- Uploading a genuinely large photo from a phone camera to trigger the ~2MB warning and quota path
- Filling browser storage to its real limit
- Printing an article to confirm the print stylesheet
- Confirming the share links post correctly once the site is on a public URL (they share `window.location.href`, which is `localhost` during development)

### Future upgrades

- A backend (Node + Express, or Supabase/Firebase) so posts are not limited to one browser
- User authentication and an admin dashboard
- A Markdown editor with split-pane preview
- Cloud image uploads (Cloudinary / S3) to remove the localStorage size ceiling
- Server-side comments with moderation
- Analytics, and a real newsletter integration
- Deployment to GitHub Pages, Netlify or Vercel
- Full-text search and RSS output

---

## Tech stack

**HTML5** · **CSS3** · **Vanilla JavaScript (ES5-compatible)** · **localStorage** · **FileReader API** · **Canvas API** · **Base64 data URLs** · **IntersectionObserver**

No frameworks, no libraries, no bundler, no dependencies.

Typography is **Sora** for headings and **Manrope** for body text, loaded from Google Fonts with system fallbacks so the layout holds if the request fails.

## File structure

```
HexSoftwares_Simple_Blog_Website/
│
├── index.html              Home — featured editorial, latest articles, topics
├── blog.html               Listing — search, filter, sort, saved, load more
├── post.html               Single article (?id=…)
├── create-post.html        Editor with live preview
├── about.html              About the publication and its author
├── contact.html            Contact form
│
├── css/
│   ├── style.css           Design tokens, components, both themes
│   └── responsive.css      Breakpoints + mobile drawer
│
├── js/
│   ├── data.js             Topics, seed articles, storage helpers, migrations
│   ├── app.js              Theme, nav, toasts, safe rendering, shared components
│   ├── blog.js             Home sections, listing, single article
│   ├── create-post.js      Form, image compression, validation
│   └── contact.js          Contact form
│
├── assets/images/          Logo, favicon, fallback, six topic covers
├── favicon.ico
└── README.md
```

## Running it locally

No build step and no dependencies.

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

Opening `index.html` directly also works, though some browsers restrict `localStorage` on `file://` URLs.

## How it works

1. **First visit** — if `hexsoftwares_blog_posts` is empty, six full articles are seeded so the site is never blank.
2. **Reading** — `blog.js` reads from storage, derives what should be on screen (filter → sort → slice) and re-renders the list from scratch. Cards link to `post.html?id=<id>`.
3. **Writing** — `create-post.js` validates every field, resizes any uploaded image on a `<canvas>` to at most 1200px wide, converts it to a Base64 JPEG and appends the post.
4. **Rendering** — all user content is written through `textContent` and DOM nodes, never `innerHTML`. Article bodies support a small whitelisted markup subset (`## heading`, `- bullet`, `1. numbered`, `> quote`, `**bold**`, `*italic*`, `` `code` ``) parsed into real elements, so stored content cannot execute script.

### Image handling

- **Upload or URL** — file input with drag-and-drop, or paste a direct image URL. If both are supplied, the uploaded file wins.
- **Resized** to ≤1200px wide and compressed before encoding.
- **Warned** when the encoded result exceeds roughly 2MB.
- **Placeholder** — an article with no image gets a branded gradient block showing its topic name.
- **Fallback chain** — every `<img>` falls back to `assets/images/fallback.jpg`, then to the gradient placeholder. The handler is attached once and guards against loops, so a broken-image icon never appears.
- **Alt text** is required whenever an image is used.
- **Quota safety** — `QuotaExceededError` is caught, and **your form content is never cleared when a save fails**.

The bundled covers are local so the site works offline. To use remote photography instead, replace the `cover` values in `CATEGORY_INFO` at the top of `js/data.js` with direct image URLs; the fallback chain means a dead link degrades gracefully.

## Accessibility

- Semantic landmarks, sequential headings, one `<h1>` per page
- Every form control has a visible label; errors use an icon **and** text, never colour alone
- Errors announced via `role="alert"` / `aria-live`
- Mobile drawer manages `aria-expanded`, traps focus and closes on <kbd>Esc</kbd>
- All interactive targets meet the 44×44px minimum
- `prefers-reduced-motion` and `prefers-contrast` respected
- Light-mode accent darkened to `#06708F` so accent text clears 4.5:1 on white
- Without JavaScript, content still renders (scroll-reveal is opt-in via a `.js` class)

## Testing

A Playwright suite of **149 automated checks** covers all six pages in headless Chromium: seeding, search, filtering, sorting, the saved view, load-more, the single article, comments, bookmarks, breadcrumbs, create-post validation, image fallbacks, quota handling, delete confirmation, contact, newsletter, theme persistence, `prefers-color-scheme`, the mobile drawer focus trap, 320px reflow, touch targets, no-JS rendering, corrupt-storage recovery, blocked-localStorage degradation and the key/topic migrations.

XSS is covered explicitly: an article whose title and body contain `<script>` and `onerror=` renders as literal text and executes nothing.

Last run: **149 passed, 0 failed, 0 console errors.** The suite is a development tool and is not part of the shipped site.

## Design inspiration

Referenced, not copied — **Medium** (reading experience), **Dev.to** (card grid and tags), **Hashnode** (dark developer aesthetic), **Ghost** (editorial featured layout), and [anshuopinion/Project-9-Blog-Website](https://github.com/anshuopinion/10-Practice-Project-Html-CSS/tree/Project-9-Blog-Website/Project%209) (basic blog structure reference).

## Contact

| | |
|---|---|
| Email | [goso.yonga@gmail.com](mailto:goso.yonga@gmail.com) |
| Phone | [069 768 7985](tel:+27697687985) |
| GitHub | [github.com/BigGee6566](https://github.com/BigGee6566) |
| LinkedIn | [Yongama Goso](https://www.linkedin.com/in/yongama-goso-85aaaa2b0) |
| Facebook | [facebook.com/yongama.ow.gee](https://www.facebook.com/yongama.ow.gee) |
| Portfolio | [biggee6566.github.io/Yongama-Goso](https://biggee6566.github.io/Yongama-Goso/) |
| Location | Eastern Cape, South Africa |

## Submission

1. Create a GitHub repository named **`HexSoftwares_Simple_Blog_Website`**
2. Push this code to the repository
3. Record a LinkedIn video walking through the project, include the repository link, and tag **Hex Softwares Pvt. Ltd.**

---

<div align="center">
  <sub>© 2026 NOVA Journal — Hex Softwares Web Development Internship — Task 1</sub>
</div>
