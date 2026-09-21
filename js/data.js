/* ==========================================================================
   NOVA JOURNAL — data.js
   Content, storage helpers and shared formatting utilities.
   Loaded first on every page. Everything hangs off the global `NOVA` object.
   ========================================================================== */

var NOVA = (function () {
  'use strict';

  /* ----------------------------------------------------------------------
     Storage keys — single source of truth
     ---------------------------------------------------------------------- */
  var KEYS = {
    posts: 'hexsoftwares_blog_posts',
    theme: 'hexsoftwares_theme',
    bookmarks: 'hexsoftwares_bookmarks',
    comments: 'hexsoftwares_comments',
    newsletter: 'hexsoftwares_newsletter_subscribers',
    messages: 'hexsoftwares_contact_messages'
  };

  /* Keys used by an earlier build. Migrated once on load so nobody loses
     bookmarks or comments they saved before the rename. */
  var LEGACY_KEYS = {
    nova_bookmarks: KEYS.bookmarks,
    nova_comments: KEYS.comments,
    nova_newsletter: KEYS.newsletter,
    nova_messages: KEYS.messages
  };

  /* ----------------------------------------------------------------------
     Topics
     ---------------------------------------------------------------------- */

  var CATEGORY_INFO = [
    { name: 'Artificial Intelligence', cover: 'assets/images/cover-ai.jpg',
      blurb: 'AI tools, trends, ethics, and practical applications.' },
    { name: 'Software Development', cover: 'assets/images/cover-software.jpg',
      blurb: 'Coding, web development, databases, debugging, and project building.' },
    { name: 'Entrepreneurship', cover: 'assets/images/cover-entrepreneurship.jpg',
      blurb: 'Business ideas, innovation, startup lessons, and personal development.' },
    { name: 'Digital Innovation', cover: 'assets/images/cover-innovation.jpg',
      blurb: 'Technology solutions that improve how people learn, work, and access opportunities.' },
    { name: 'Education and Skills', cover: 'assets/images/cover-education.jpg',
      blurb: 'Digital literacy, learning resources, and career development.' },
    { name: 'Creative Technology', cover: 'assets/images/cover-entertainment.jpg',
      blurb: 'Content creation, design, media, and the connection between creativity and technology.' }
  ];

  var CATEGORIES = CATEGORY_INFO.map(function (c) { return c.name; });

  /* Topic names used by an earlier build, migrated on load. */
  var LEGACY_CATEGORIES = {
    'Education': 'Education and Skills',
    'Entertainment': 'Creative Technology'
  };

  function categoryCover(name) {
    for (var i = 0; i < CATEGORY_INFO.length; i++) {
      if (CATEGORY_INFO[i].name === name) return CATEGORY_INFO[i].cover;
    }
    return '';
  }

  var FALLBACK_IMAGE = 'assets/images/fallback.jpg';

  /* Cover art ships with the project so posts render offline and nothing can
     break during a demo. To use remote photography instead, replace the
     `cover` values in CATEGORY_INFO above with direct image URLs — every
     <img> already falls back to FALLBACK_IMAGE, so a dead link degrades
     gracefully rather than showing a broken-image icon. */

  /* ----------------------------------------------------------------------
     Low-level storage access
     Falls back to an in-memory object when localStorage is unavailable
     (private browsing, blocked cookies) so the UI never hard-crashes.
     ---------------------------------------------------------------------- */

  var memoryStore = {};
  var storageWorks = (function () {
    try {
      var probe = '__nova_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return true;
    } catch (e) {
      return false;
    }
  })();

  function readStore(key, fallback) {
    try {
      var raw = storageWorks ? localStorage.getItem(key) : memoryStore[key];
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (e) {
      // Corrupt or unreadable JSON — start clean rather than crash the page.
      return fallback;
    }
  }

  /* Returns { ok:true } or { ok:false, reason:'quota'|'unavailable' }.
     Nothing is thrown; callers decide what to tell the user. */
  function writeStore(key, value) {
    var payload;
    try {
      payload = JSON.stringify(value);
    } catch (e) {
      return { ok: false, reason: 'unavailable' };
    }

    if (!storageWorks) {
      memoryStore[key] = payload;
      return { ok: false, reason: 'unavailable' };
    }

    try {
      localStorage.setItem(key, payload);
      return { ok: true };
    } catch (err) {
      var isQuota = err && (err.name === 'QuotaExceededError' ||
                            err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                            err.code === 22 || err.code === 1014);
      return { ok: false, reason: isQuota ? 'quota' : 'unavailable' };
    }
  }

  function removeStore(key) {
    try {
      if (storageWorks) localStorage.removeItem(key);
      else delete memoryStore[key];
    } catch (e) { /* nothing useful to do */ }
  }

  /* ----------------------------------------------------------------------
     One-time migrations
     ---------------------------------------------------------------------- */

  function migrateLegacyKeys() {
    if (!storageWorks) return;
    Object.keys(LEGACY_KEYS).forEach(function (oldKey) {
      var newKey = LEGACY_KEYS[oldKey];
      try {
        var legacy = localStorage.getItem(oldKey);
        if (legacy === null) return;
        // Never clobber data already stored under the current key.
        if (localStorage.getItem(newKey) === null) localStorage.setItem(newKey, legacy);
        localStorage.removeItem(oldKey);
      } catch (e) { /* skip this key and carry on */ }
    });
  }

  function migrateLegacyCategories() {
    var raw = readStore(KEYS.posts, null);
    if (!Array.isArray(raw)) return;
    var changed = false;
    raw.forEach(function (p) {
      if (p && LEGACY_CATEGORIES[p.category]) {
        p.category = LEGACY_CATEGORIES[p.category];
        changed = true;
      }
    });
    if (changed) writeStore(KEYS.posts, raw);
  }

  migrateLegacyKeys();
  migrateLegacyCategories();

  /* ----------------------------------------------------------------------
     Formatting utilities
     ---------------------------------------------------------------------- */

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function formatDate(value) {
    var d = new Date(value);
    if (isNaN(d.getTime())) return String(value || '');
    return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }

  function countWords(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length;
  }

  function calculateReadingTime(text) {
    return Math.max(1, Math.round(countWords(text) / 200));
  }

  function getInitials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'NJ';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function truncate(text, max) {
    var s = String(text || '').trim();
    if (s.length <= max) return s;
    return s.slice(0, max).replace(/\s+\S*$/, '') + '…';
  }

  /* ----------------------------------------------------------------------
     Starter articles — seeded when storage is empty
     ---------------------------------------------------------------------- */

  var AUTHOR = 'Yongama Goso';

  var SEED_POSTS = [
    {
      id: 'seed-localstorage-blog',
      title: 'What I Learned Building a Blog That Runs Entirely in the Browser',
      author: AUTHOR,
      category: 'Software Development',
      date: '2026-09-18',
      featured: true,
      tags: ['javascript', 'localstorage', 'project notes'],
      image: 'assets/images/cover-software.jpg',
      imageAlt: 'Abstract arrangement of coloured code blocks in stacked rows',
      excerpt: 'No framework, no backend, no build step. The constraint turned out to teach me more about the browser than any tutorial had.',
      content:
        'This site is the project. No framework, no server, no database — every article you are reading lives in `localStorage` in your own browser.\n\n' +
        'I did not choose that because it is the right architecture. I chose it because the brief said plain HTML, CSS and JavaScript, and I wanted to find out what I actually understood once there was nothing to hide behind.\n\n' +
        '## Storage is easy until it fails\n\n' +
        'Reading and writing is two lines. `JSON.stringify` on the way in, `JSON.parse` on the way out. That part took an afternoon.\n\n' +
        'The rest of the week went to everything that happens when it does not work:\n\n' +
        '- **The data is corrupt.** Someone edits storage by hand, or an older version wrote a different shape. `JSON.parse` throws and the page is blank. Every read is wrapped now, and a bad value falls back to an empty list instead of killing the render.\n' +
        '- **Storage is switched off.** In private mode, touching `localStorage` can throw on the first call. The site checks once at startup and keeps working from memory, with a message so you know why nothing will be there tomorrow.\n' +
        '- **Storage is full.** This is the one that mattered most. About 5MB, shared with everything else on the origin, and a Base64 image eats it fast.\n\n' +
        '> The bug I am proudest of fixing is the one where a failed save used to clear the form. You would write six paragraphs, hit publish, get an error, and lose all of it.\n\n' +
        'Now a failed save leaves every field exactly where it was and tells you what to try. That is not a feature anyone will notice. It is the thing I would want if I were the one typing.\n\n' +
        '## Re-render, do not patch\n\n' +
        'My first version tried to be clever — find the card that changed, update that node, leave the rest alone. It broke constantly, because the screen and the data drifted apart.\n\n' +
        'The version that works is boring. Read the posts, filter and sort them, throw the list away, build it again. On a few dozen articles you cannot see the difference, and debugging became a question about the data instead of a hunt through the DOM.\n\n' +
        '## What I would do differently\n\n' +
        'Images are the weak point. Storing them as Base64 inside the same 5MB as the text was the obvious approach and the wrong one — it is why the quota handling had to get so careful. A real version puts files somewhere else and keeps a URL.\n\n' +
        'I also over-built the first stylesheet before I knew what the pages needed, then spent longer deleting than writing.\n\n' +
        'Next on this project is a small backend, so the posts stop being trapped in whichever browser made them.'
    },
    {
      id: 'seed-ai-judgment',
      title: 'Where AI Tools Help Me Code, and Where They Still Get in the Way',
      author: AUTHOR,
      category: 'Artificial Intelligence',
      date: '2026-09-15',
      featured: false,
      tags: ['ai', 'workflow', 'learning'],
      image: 'assets/images/cover-ai.jpg',
      imageAlt: 'Network of glowing connected nodes suggesting a neural network',
      excerpt: 'They are genuinely useful for the parts I already understand. They are a trap for the parts I do not — and telling the difference took me a while.',
      content:
        'I use AI tools most days. I also lost a full evening to one, and the lesson from that evening is the useful part of this post.\n\n' +
        '## The evening I lost\n\n' +
        'I asked for help with a date bug. The answer was confident, well formatted, and wrong in a way I could not see, because I did not understand time zones well enough to check it. I pasted it in. It fixed the symptom on my machine and broke the sort order for anyone in a different offset.\n\n' +
        'It took hours to find, and the fix was four characters.\n\n' +
        '> A suggestion you cannot evaluate is not help. It is a decision you have handed to something that will not be there when it breaks.\n\n' +
        '## Where they genuinely help\n\n' +
        'The pattern I keep coming back to: these tools are strongest on work I could do myself but would rather not do slowly.\n\n' +
        '- **Explaining an unfamiliar error.** Faster than searching, and I can ask follow-up questions in my own words.\n' +
        '- **The boring transform.** Reshaping data, writing the same validation for the fifth field, converting a format.\n' +
        '- **Arguing with my plan.** Describing an approach and asking what breaks surfaces things I had not considered.\n' +
        '- **Getting unstuck on a blank file.** A rough first attempt I then rewrite is easier than starting from nothing.\n\n' +
        '## Where they get in the way\n\n' +
        'Anything I cannot verify. If I would not spot a wrong answer, I am not in a position to accept a right one either — and that is exactly when the output is most convincing.\n\n' +
        'They are also poor at holding the whole project in view. They will happily suggest something reasonable in isolation that contradicts a decision made three files away.\n\n' +
        '## The rule I use now\n\n' +
        'I let these tools help me think, draft and check. I do not let them make a decision I could not defend to someone who asked why.\n\n' +
        'As a student that rule costs me time, because it means stopping to learn the thing rather than routing around it. That is the point. The goal is not to produce code today. It is to be someone who can produce it next year.'
    },
    {
      id: 'seed-validating-idea',
      title: 'Validating a Business Idea When You Have No Budget',
      author: AUTHOR,
      category: 'Entrepreneurship',
      date: '2026-09-11',
      featured: false,
      tags: ['entrepreneurship', 'validation', 'south africa'],
      image: 'assets/images/cover-entrepreneurship.jpg',
      imageAlt: 'Rising bar chart with a bright trend line indicating growth',
      excerpt: 'Building first is the most expensive way to find out nobody wanted it. What replaces a budget is conversations and a willingness to hear no.',
      content:
        'The advice to "just build it and see" assumes you can afford to be wrong. Most students and early founders I know cannot. Months of unpaid evenings is a real cost even when no money changes hands.\n\n' +
        '## Separate the problem from your solution\n\n' +
        'You are usually attached to the solution. Whether a business exists depends on the problem.\n\n' +
        'Write one sentence: who has this problem, and what does it cost them right now in money, time or frustration? If you cannot finish that sentence without guessing, finding out is the work.\n\n' +
        '## Ask about the past, not the future\n\n' +
        'The first conversations will be clumsy. Have them anyway, but watch the question:\n\n' +
        '- **Weak:** "Would you use an app that does this?" People are polite. They say yes.\n' +
        '- **Better:** "Tell me about the last time you dealt with this. What did you actually do?"\n\n' +
        'Past behaviour is evidence. Stated intention is not.\n\n' +
        '> The strongest signal is not enthusiasm. It is finding someone who already built an ugly workaround — a spreadsheet, a WhatsApp group, a paper book behind the counter.\n\n' +
        'A workaround means the problem is annoying enough to spend effort on. That is a customer.\n\n' +
        '## Test demand before you can deliver\n\n' +
        '1. **Describe the offer on one page** and put it where those people already are. Count who asks to know more.\n' +
        '2. **Do it by hand for three people.** It does not scale, which is the point — you learn what software would need to do.\n' +
        '3. **Ask for a small commitment.** Not money necessarily: a scheduled call, a real name, a number. Commitment separates interest from politeness.\n\n' +
        '## The questions that matter most here\n\n' +
        '- How often does this happen? Weekly beats yearly.\n' +
        '- What do people pay to solve it today, even informally?\n' +
        '- What happens if they do nothing? If the answer is "nothing much", urgency is missing.\n' +
        '- **Can you reach these people without a marketing budget?**\n\n' +
        'That last one decides more than the others when you are starting with nothing. A good product aimed at people you have no way to reach is a hobby, and I would rather find that out in week one than month six.\n\n' +
        'The aim is not to be right at the start. It is to be wrong cheaply enough that it does not end the attempt.'
    },
    {
      id: 'seed-data-costs',
      title: 'Designing for Data Costs: What Changes When Bandwidth Is Expensive',
      author: AUTHOR,
      category: 'Digital Innovation',
      date: '2026-09-07',
      featured: false,
      tags: ['performance', 'accessibility', 'south africa'],
      image: 'assets/images/cover-innovation.jpg',
      imageAlt: 'Concentric orbital rings surrounding a four-point star',
      excerpt: 'We build on uncapped connections and test on faster ones. Designing for prepaid data and patchy signal changes the architecture — usually for the better.',
      content:
        'There is a gap between the conditions software is built in and the conditions it is used in. I notice it because I have been on both sides of it in the same week.\n\n' +
        'Designing for expensive, unreliable data is not charity. It produces faster and more resilient products for everyone.\n\n' +
        '## Every megabyte is somebody\'s airtime\n\n' +
        'When data is prepaid, a heavy page is not an abstract performance metric. It is money that could have been something else. That reframes optimisation as a fairness question rather than a technical nicety.\n\n' +
        '1. Resize images before sending or storing them — this site caps uploads at 1200px wide and compresses them.\n' +
        '2. Load images lazily, so anything below the fold costs nothing until it is needed.\n' +
        '3. Ship less code. Every library has a price, and somebody else pays it.\n\n' +
        '## Assume the connection drops\n\n' +
        'Not "might" — will. Somewhere between tapping a button and getting a response, the signal goes. The question is what your interface does about it.\n\n' +
        'The default in most apps is a spinner that never resolves. You cannot tell whether your action saved, and retrying means typing everything again.\n\n' +
        '- **Never discard what someone typed.** If a save fails, the form keeps its contents.\n' +
        '- **Say what happened in plain language.** "No connection — your draft is still here" beats a red triangle.\n' +
        '- **Make retry one button in the same place.**\n\n' +
        '> A page that works on a weak connection is not a degraded experience. For a lot of people it is the only experience.\n\n' +
        '## Local-first has a pleasant side effect\n\n' +
        'When data is written locally first and synced later, the interface stops waiting. Actions feel instant because they are, and the network catches up behind them.\n\n' +
        'This blog is an extreme version — everything is local, so it works with the network off entirely. Most real products land somewhere in the middle, but the instinct carries over.\n\n' +
        '## Test the way people actually browse\n\n' +
        'Open your developer tools, throttle the network to a slow profile, and use your own site. Then switch the network off completely.\n\n' +
        'The first time is uncomfortable. That discomfort is somebody\'s normal, and it is the fastest way I know to find out what to fix.'
    },
    {
      id: 'seed-studying-and-building',
      title: 'Studying Information Systems While Teaching Myself to Code',
      author: AUTHOR,
      category: 'Education and Skills',
      date: '2026-09-03',
      featured: false,
      tags: ['learning', 'student life', 'skills'],
      image: 'assets/images/cover-education.jpg',
      imageAlt: 'Layered geometric planes suggesting stacked stages of learning',
      excerpt: 'The degree teaches me why systems are built. It does not teach me to build them. Closing that gap is its own project, and structure is the scarce part.',
      content:
        'My coursework explains how information systems serve a business — process, data modelling, requirements, why a system exists at all. It is genuinely useful, and it is not the same thing as being able to build the system.\n\n' +
        'Closing that gap is the other half of my week.\n\n' +
        '## What is actually scarce\n\n' +
        'It is not material. Everything needed to learn programming is free and abundant, which is exactly why so many people stall. Abundance without structure becomes a queue of half-watched tutorials.\n\n' +
        'The scarce things are **structure**, **feedback** and **finished work**.\n\n' +
        '## Escaping tutorial purgatory\n\n' +
        'A tutorial gives the feeling of progress without the friction of deciding anything. You type what you are told, it runs, and almost nothing transfers.\n\n' +
        '- Finish it, then rebuild the same thing from an empty file with the tab closed.\n' +
        '- Change the requirements so you cannot follow along.\n' +
        '- When stuck, sit with it for twenty minutes before searching. The discomfort is the learning.\n\n' +
        '> You do not understand something because you watched it work. You understand it when you can rebuild it after forgetting the details.\n\n' +
        '## Manufacturing structure and feedback\n\n' +
        'A course has a syllabus and a deadline. Studying alone, you have to invent both.\n\n' +
        '1. **Pick a project, not a language.** "Build a blog that saves posts in the browser" is a goal. "Learn JavaScript" is not.\n' +
        '2. **Set a date and tell somebody.** A witness does more than intention.\n' +
        '3. **Short sessions, often.** Five focused days beat one exhausting weekend.\n\n' +
        'Without a mentor you need other mirrors: read your own code a week later, explain a feature out loud and notice the sentence you stumble on, and publish it — public work raises your standard more reliably than private resolve.\n\n' +
        '## Where the two halves meet\n\n' +
        'The degree gives me vocabulary for things I would otherwise have learned as superstition. Building gives the coursework somewhere to land.\n\n' +
        'The combination I am aiming for is someone who can write the software and explain to a business why it is worth writing. Neither half gets me there alone.'
    },
    {
      id: 'seed-finished-interfaces',
      title: 'The Small Design Decisions That Make an Interface Feel Finished',
      author: AUTHOR,
      category: 'Creative Technology',
      date: '2026-08-29',
      featured: false,
      tags: ['design', 'ui', 'craft'],
      image: 'assets/images/cover-entertainment.jpg',
      imageAlt: 'Colourful audio waveform bars radiating from a centre line',
      excerpt: 'The difference between a project that looks like a tutorial and one that looks made is rarely a big idea. It is a hundred small decisions nobody is supposed to notice.',
      content:
        'When I compare my early pages to work I admire, the gap is never one dramatic thing. It is an accumulation of small decisions, each invisible on its own.\n\n' +
        '## Empty is a state, not an accident\n\n' +
        'Most tutorials render a list. They rarely say what to show when the list is empty, and that is the first screen a new user sees.\n\n' +
        'A blank area reads as broken. A short line explaining what goes here and a button to create the first item reads as designed. Same amount of code, completely different impression.\n\n' +
        'The same applies to failure. "Something went wrong" tells me nothing. "Your browser storage is full — try a smaller image or delete an older post" tells me what to do next.\n\n' +
        '## Decide what is loudest\n\n' +
        'The habit I had to break was giving everything equal weight. Every section the same size, every card the same shape, every heading the same treatment.\n\n' +
        'When everything is emphasised, nothing is. The featured article on this site gets a wider layout and a larger image than the cards below it, because it is meant to be read first. That is the whole trick.\n\n' +
        '> Hierarchy is not decoration. It is telling someone where to look, in what order.\n\n' +
        '## Motion that reports, not performs\n\n' +
        'I went through a phase of animating everything. It felt impressive for a day and irritating for a week.\n\n' +
        'What survived is motion that answers a question. Did my click register? Is this card interactive? Where did that message come from? Anything that only exists to be noticed eventually is — as friction.\n\n' +
        'And all of it collapses to nothing under `prefers-reduced-motion`, because for some people that movement is not a flourish, it is a problem.\n\n' +
        '## Alignment and rhythm\n\n' +
        'Pick a spacing scale and use it. Most of what reads as "sloppy" is a 14px gap next to a 16px gap next to an 18px gap, chosen by feel at three different moments.\n\n' +
        '## Why any of it matters\n\n' +
        'None of these decisions is difficult. They are just easy to skip, because skipping them still produces something that works.\n\n' +
        'The difference is that an interface built with them feels like somebody was there, thinking about the person on the other side. That is the part I am actually trying to learn.'
    }
  ];

  /* ----------------------------------------------------------------------
     Post normalisation and persistence
     ---------------------------------------------------------------------- */

  /* Every post is normalised on read, so a post written by an older build
     (or edited by hand in devtools) can never break a render. */
  function normalisePost(raw, index) {
    var p = raw && typeof raw === 'object' ? raw : {};
    var content = typeof p.content === 'string' ? p.content : '';
    var category = typeof p.category === 'string' ? p.category : '';
    if (LEGACY_CATEGORIES[category]) category = LEGACY_CATEGORIES[category];
    if (CATEGORIES.indexOf(category) === -1) category = 'Digital Innovation';

    return {
      id: p.id != null ? String(p.id) : 'post-' + index + '-' + Date.now(),
      title: typeof p.title === 'string' ? p.title : 'Untitled post',
      author: typeof p.author === 'string' && p.author.trim() ? p.author : 'Anonymous',
      category: category,
      date: typeof p.date === 'string' && p.date ? p.date : todayISO(),
      excerpt: typeof p.excerpt === 'string' ? p.excerpt : truncate(content, 160),
      content: content,
      image: typeof p.image === 'string' ? p.image : '',
      imageAlt: typeof p.imageAlt === 'string' && p.imageAlt.trim() ? p.imageAlt : '',
      extraImage: typeof p.extraImage === 'string' ? p.extraImage : '',
      readingTime: Number(p.readingTime) > 0 ? Number(p.readingTime) : calculateReadingTime(content),
      tags: Array.isArray(p.tags) ? p.tags.filter(function (t) {
        return typeof t === 'string' && t.trim();
      }) : [],
      featured: p.featured === true,
      createdAt: Number(p.createdAt) > 0 ? Number(p.createdAt) : 0
    };
  }

  function getPosts() {
    var raw = readStore(KEYS.posts, null);
    if (!Array.isArray(raw)) return [];
    return raw.map(normalisePost);
  }

  function savePosts(posts) {
    return writeStore(KEYS.posts, posts);
  }

  /* Newest first: explicit createdAt wins, otherwise the date field. */
  function sortNewestFirst(posts) {
    return posts.slice().sort(function (a, b) {
      var at = a.createdAt || new Date(a.date).getTime() || 0;
      var bt = b.createdAt || new Date(b.date).getTime() || 0;
      return bt - at;
    });
  }

  function seedSamplePosts() {
    var seeded = SEED_POSTS.map(function (p, i) {
      var copy = normalisePost(p, i);
      copy.createdAt = new Date(p.date).getTime() || (Date.now() - i * 86400000);
      return copy;
    });
    savePosts(seeded);
    return seeded;
  }

  /* Called once per page load, so the site is never empty on a first visit. */
  function ensurePosts() {
    var posts = getPosts();
    if (!posts.length) posts = seedSamplePosts();
    return posts;
  }

  function getPostById(id) {
    var posts = getPosts();
    for (var i = 0; i < posts.length; i++) {
      if (posts[i].id === String(id)) return posts[i];
    }
    return null;
  }

  /* The newest post flagged `featured`, else the newest post overall. */
  function getFeaturedPost(posts) {
    var list = sortNewestFirst(posts || getPosts());
    if (!list.length) return null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].featured) return list[i];
    }
    return list[0];
  }

  function addPost(post) {
    var posts = getPosts();
    posts.push(post);
    return savePosts(posts);
  }

  function deletePost(id) {
    var remaining = getPosts().filter(function (p) { return p.id !== String(id); });
    var result = savePosts(remaining);
    return { ok: result.ok, reason: result.reason, posts: remaining };
  }

  function countByCategory(posts, name) {
    return (posts || getPosts()).filter(function (p) { return p.category === name; }).length;
  }

  /* ----------------------------------------------------------------------
     Bookmarks, comments, newsletter, messages
     ---------------------------------------------------------------------- */

  function getBookmarks() {
    var list = readStore(KEYS.bookmarks, []);
    return Array.isArray(list) ? list.map(String) : [];
  }

  function isBookmarked(id) {
    return getBookmarks().indexOf(String(id)) > -1;
  }

  /* Returns the new state so the caller can update its button label. */
  function toggleBookmark(id) {
    var list = getBookmarks();
    var key = String(id);
    var i = list.indexOf(key);
    if (i > -1) list.splice(i, 1); else list.push(key);
    writeStore(KEYS.bookmarks, list);
    return i === -1;
  }

  function getComments(postId) {
    var all = readStore(KEYS.comments, {});
    if (!all || typeof all !== 'object' || Array.isArray(all)) return [];
    var list = all[String(postId)];
    return Array.isArray(list) ? list : [];
  }

  function addComment(postId, comment) {
    var all = readStore(KEYS.comments, {});
    if (!all || typeof all !== 'object' || Array.isArray(all)) all = {};
    var key = String(postId);
    if (!Array.isArray(all[key])) all[key] = [];
    all[key].push(comment);
    return writeStore(KEYS.comments, all);
  }

  function getSubscribers() {
    var list = readStore(KEYS.newsletter, []);
    return Array.isArray(list) ? list : [];
  }

  /* Returns 'added' | 'duplicate' | 'failed' */
  function addSubscriber(email) {
    var list = getSubscribers();
    var clean = String(email).trim().toLowerCase();
    var exists = list.some(function (s) {
      return String(s && s.email ? s.email : s).toLowerCase() === clean;
    });
    if (exists) return 'duplicate';
    list.push({ email: clean, joined: new Date().toISOString() });
    var result = writeStore(KEYS.newsletter, list);
    return (result.ok || !storageWorks) ? 'added' : 'failed';
  }

  function saveMessage(message) {
    var list = readStore(KEYS.messages, []);
    if (!Array.isArray(list)) list = [];
    list.push(message);
    return writeStore(KEYS.messages, list);
  }

  /* ----------------------------------------------------------------------
     Public API
     ---------------------------------------------------------------------- */

  return {
    KEYS: KEYS,
    CATEGORIES: CATEGORIES,
    CATEGORY_INFO: CATEGORY_INFO,
    FALLBACK_IMAGE: FALLBACK_IMAGE,
    AUTHOR: AUTHOR,
    SEED_POSTS: SEED_POSTS,
    storageWorks: storageWorks,

    readStore: readStore,
    writeStore: writeStore,
    removeStore: removeStore,

    getPosts: getPosts,
    savePosts: savePosts,
    ensurePosts: ensurePosts,
    seedSamplePosts: seedSamplePosts,
    sortNewestFirst: sortNewestFirst,
    getPostById: getPostById,
    getFeaturedPost: getFeaturedPost,
    addPost: addPost,
    deletePost: deletePost,
    normalisePost: normalisePost,
    countByCategory: countByCategory,
    categoryCover: categoryCover,

    getBookmarks: getBookmarks,
    isBookmarked: isBookmarked,
    toggleBookmark: toggleBookmark,

    getComments: getComments,
    addComment: addComment,

    getSubscribers: getSubscribers,
    addSubscriber: addSubscriber,
    saveMessage: saveMessage,

    formatDate: formatDate,
    todayISO: todayISO,
    countWords: countWords,
    calculateReadingTime: calculateReadingTime,
    getInitials: getInitials,
    truncate: truncate
  };
})();
