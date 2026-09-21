/* ==========================================================================
   NOVA JOURNAL — data.js
   Sample content, storage helpers and shared formatting utilities.
   Loaded first on every page. Everything hangs off the global `NOVA` object.
   ========================================================================== */

var NOVA = (function () {
  'use strict';

  /* ----------------------------------------------------------------------
     Storage keys
     ---------------------------------------------------------------------- */
  var KEYS = {
    posts: 'hexsoftwares_blog_posts',
    theme: 'hexsoftwares_theme',
    bookmarks: 'nova_bookmarks',
    comments: 'nova_comments',
    newsletter: 'nova_newsletter',
    messages: 'nova_messages'
  };

  var CATEGORIES = [
    'Artificial Intelligence',
    'Software Development',
    'Entrepreneurship',
    'Digital Innovation',
    'Education',
    'Entertainment'
  ];

  /* Cover art shipped with the project, so posts always render — even offline.
     ----------------------------------------------------------------------
     PREFER REMOTE PHOTOS INSTEAD? Swap the values below for Unsplash URLs,
     e.g. 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80'
     Every <img> already has an onerror fallback to assets/images/fallback.jpg,
     so a dead link degrades gracefully rather than showing a broken icon.
     ---------------------------------------------------------------------- */
  var COVERS = {
    ai: 'assets/images/cover-ai.jpg',
    software: 'assets/images/cover-software.jpg',
    entrepreneurship: 'assets/images/cover-entrepreneurship.jpg',
    innovation: 'assets/images/cover-innovation.jpg',
    education: 'assets/images/cover-education.jpg',
    entertainment: 'assets/images/cover-entertainment.jpg'
  };

  var FALLBACK_IMAGE = 'assets/images/fallback.jpg';

  /* ----------------------------------------------------------------------
     Low-level storage access
     Falls back to an in-memory object when localStorage is unavailable
     (private browsing, disabled cookies) so the UI never hard-crashes.
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
     Callers decide what to tell the user — nothing is thrown. */
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
      var isQuota =
        err && (err.name === 'QuotaExceededError' ||
                err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                err.code === 22 || err.code === 1014);
      return { ok: false, reason: isQuota ? 'quota' : 'unavailable' };
    }
  }

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

  function calculateReadingTime(text) {
    var words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
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
     Sample posts — seeded when storage is empty
     ---------------------------------------------------------------------- */

  var SEED_POSTS = [
    {
      id: 'seed-ai-teammate',
      title: 'Why Small Teams Should Treat AI as a Teammate, Not a Tool',
      author: 'Yongama',
      category: 'Artificial Intelligence',
      date: '2026-09-18',
      featured: true,
      tags: ['ai', 'productivity', 'workflow'],
      image: COVERS.ai,
      imageAlt: 'Abstract network of glowing connected nodes representing a neural network',
      excerpt: 'Most people bolt AI onto the end of a workflow and wonder why it disappoints. The teams getting real leverage do something different — they give it a seat at the table from the start.',
      content:
        'There is a quiet difference between the teams that get real value from AI and the ones that keep bouncing off it. It is rarely about which model they use. It is about *where in the process* they bring it in.\n\n' +
        '## The bolt-on trap\n\n' +
        'The common pattern looks like this: a person does all the thinking, writes the whole thing, then pastes it into a chat box and asks for a polish. The output comes back slightly smoother and entirely generic, and the conclusion is that AI is overrated.\n\n' +
        'That is a workflow problem, not a capability problem. By the time you ask for help, every meaningful decision has already been made. You have handed over the easiest ten percent of the work.\n\n' +
        '## Bring it in at the messy stage\n\n' +
        'The teams seeing genuine leverage invite AI into the part of the work that is still unresolved — the stage where you have a half-formed idea, three competing approaches, and no clear winner.\n\n' +
        '- **Ask it to argue against you.** Describe your plan and ask for the three strongest reasons it fails. This surfaces blind spots faster than a meeting.\n' +
        '- **Use it to widen options, then narrow yourself.** Ask for eight approaches, not one. Judgement is still your job.\n' +
        '- **Make it explain, not just produce.** If you cannot follow the reasoning, you cannot defend the result.\n\n' +
        '> Treating AI as a teammate means giving it context, letting it disagree with you, and still owning the final call.\n\n' +
        '## Context is the entire game\n\n' +
        'A teammate who knows your constraints gives better advice than a stranger who does not. The same is true here. A prompt that says "write a launch plan" gets a template. A prompt that says "we have three weeks, no budget, one developer, and our users are on slow mobile connections" gets something you can actually use.\n\n' +
        'Most disappointing outputs trace back to missing context, not a weak model.\n\n' +
        '## Where to keep humans firmly in charge\n\n' +
        'Being useful is not the same as being reliable. Keep a person in the loop for anything involving facts you cannot verify, decisions with real consequences, and anything carrying your name.\n\n' +
        'The practical rule I use: AI can help me think, draft and critique. It does not get the final word on anything I would have to defend in a room full of people.\n\n' +
        '## Start smaller than you think\n\n' +
        'Pick one recurring task this week — a weekly summary, a first draft, a code review pass. Run it with AI involved from the beginning rather than the end. Compare it honestly against how you did it before.\n\n' +
        'One workflow, done properly, teaches you more than a month of reading about the technology.'
    },
    {
      id: 'seed-vanilla-js',
      title: 'The Vanilla JavaScript Skills That Survive Every Framework',
      author: 'Yongama',
      category: 'Software Development',
      date: '2026-09-15',
      featured: false,
      tags: ['javascript', 'fundamentals', 'webdev'],
      image: COVERS.software,
      imageAlt: 'Abstract representation of coloured code blocks arranged in rows',
      excerpt: 'Frameworks change every few years. The fundamentals underneath them barely move at all — and they are what make you dangerous in any stack.',
      content:
        'I built this blog with no framework. No React, no build step, no package manager. That was a constraint of the brief, but it turned out to be one of the most useful things I have done for my own understanding.\n\n' +
        '## What you actually learn without a framework\n\n' +
        'When there is no library standing between you and the browser, you are forced to understand what the browser is genuinely doing.\n\n' +
        '- **The DOM is a tree you can walk.** `querySelector`, `createElement`, `append` — once these are second nature, every framework feels like a convenience layer over something you already understand.\n' +
        '- **Events bubble.** Attaching one listener to a container and reading `event.target` is faster and simpler than wiring up a listener per card. Frameworks do this for you; knowing why matters.\n' +
        '- **State is just data you own.** A framework gives you a re-render. Without one, you learn the loop yourself: change the data, then redraw the view from that data. That mental model transfers everywhere.\n\n' +
        '## The pattern that made this project click\n\n' +
        'Every dynamic page here follows the same three steps:\n\n' +
        '1. Read the current data from storage.\n' +
        '2. Derive what should be on screen — filter it, sort it, slice it.\n' +
        '3. Render that derived list from scratch.\n\n' +
        'No patching individual nodes, no tracking which card changed. Re-deriving from a single source of truth is how modern frameworks think, and you can practise it with nothing but a `for` loop.\n\n' +
        '> If your render function only depends on your data, debugging becomes "what is in the data?" instead of "what did the DOM do?"\n\n' +
        '## Safety is a fundamental too\n\n' +
        'The moment you render text a user typed, you have an escaping problem. Using `textContent` instead of `innerHTML` is not a stylistic preference — it is the difference between displaying `<script>` as words and executing it.\n\n' +
        'Every piece of user content in this project goes through DOM text nodes. It costs nothing and removes an entire vulnerability class.\n\n' +
        '## Things worth knowing cold\n\n' +
        '- `JSON.parse` and `JSON.stringify`, including what they do to dates\n' +
        '- Array methods: `filter`, `map`, `sort`, `slice`, `reduce`\n' +
        '- `addEventListener` and `preventDefault` on form submits\n' +
        '- `FileReader` and the `Image` element for anything involving uploads\n' +
        '- `IntersectionObserver` for scroll effects that do not tank performance\n\n' +
        'None of these disappeared when React arrived. They sit underneath it.\n\n' +
        '## The honest trade-off\n\n' +
        'Vanilla is not always the right answer. Once an app has real routing, shared state across many screens, and a team touching it, a framework earns its weight fast.\n\n' +
        'But learning the layer underneath first means you pick up frameworks faster, debug them better, and know when you do not need one at all.'
    },
    {
      id: 'seed-validate-idea',
      title: 'Validating a Business Idea Without Spending a Cent',
      author: 'Yongama',
      category: 'Entrepreneurship',
      date: '2026-09-11',
      featured: false,
      tags: ['startups', 'validation', 'strategy'],
      image: COVERS.entrepreneurship,
      imageAlt: 'Ascending bar chart with a bright trend line showing growth',
      excerpt: 'Building first is the most expensive way to find out nobody wanted it. Here is the cheaper sequence — and the questions that actually predict whether something will work.',
      content:
        'The most expensive mistake a first-time founder makes is building the product before checking whether the problem is real. Months disappear, and the feedback you finally get is the feedback you could have had in week one.\n\n' +
        '## Separate the problem from your solution\n\n' +
        'You are usually attached to a solution. The thing that determines whether a business exists is the problem.\n\n' +
        'Write down, in one sentence, who has this problem and what it currently costs them — in money, time or frustration. If you cannot fill in that sentence without guessing, that is your first task.\n\n' +
        '## Talk to people badly, then better\n\n' +
        'Your first ten conversations will be clumsy. Have them anyway. But avoid the trap of pitching:\n\n' +
        '- **Bad question:** "Would you use an app that does X?" People are polite. They say yes.\n' +
        '- **Better question:** "Walk me through the last time you dealt with this. What did you actually do?"\n\n' +
        'Past behaviour is evidence. Future intentions are noise.\n\n' +
        '> The strongest validation signal is not enthusiasm. It is discovering someone has already built an ugly workaround — a spreadsheet, a WhatsApp group, a paper notebook.\n\n' +
        'A workaround means the problem is painful enough to spend effort on. That is a customer.\n\n' +
        '## Test demand before capability\n\n' +
        'You do not need a product to test whether people want one.\n\n' +
        '1. **A one-page description.** Explain the offer plainly and share it where your audience already gathers. Count who asks to know more.\n' +
        '2. **Do it manually first.** Deliver the outcome by hand for three people. It does not scale — that is the point. You learn what the software would need to do.\n' +
        '3. **Ask for a small commitment.** Not necessarily money: a scheduled call, a waitlist signup with a real name, a WhatsApp number. Commitment separates interest from curiosity.\n\n' +
        '## The questions that predict survival\n\n' +
        '- How often does this problem occur? Daily beats yearly.\n' +
        '- Who currently pays to solve it, and how much?\n' +
        '- What happens if they simply do nothing? If nothing bad happens, urgency is missing.\n' +
        '- Can you reach these people without a marketing budget?\n\n' +
        'That last one matters enormously when you are starting with no capital. A brilliant product aimed at an audience you cannot reach is a hobby.\n\n' +
        '## Validation is not a phase you finish\n\n' +
        'It is a habit. Even after launch, the same instinct applies — watch behaviour rather than compliments, and keep asking what people did instead of what they say they would do.\n\n' +
        'The goal is not to be right at the start. It is to be wrong cheaply and early enough that it does not matter.'
    },
    {
      id: 'seed-offline-first',
      title: 'Offline-First: Designing for Real Network Conditions',
      author: 'Yongama',
      category: 'Digital Innovation',
      date: '2026-09-07',
      featured: false,
      tags: ['performance', 'ux', 'mobile'],
      image: COVERS.innovation,
      imageAlt: 'Glowing orbital rings surrounding a four-point star',
      excerpt: 'Most products are designed on fast connections and tested on faster ones. Building for intermittent, expensive data changes the architecture — usually for the better.',
      content:
        'There is a gap between the conditions we build software in and the conditions people use it in. Developers work on stable connections with uncapped data. A large share of users do not.\n\n' +
        'Designing for that reality is not charity. It produces faster, more resilient products for everyone.\n\n' +
        '## Assume the network will fail\n\n' +
        'Not "might" — will. Somewhere between tapping a button and getting a response, the connection drops. The question is what your interface does about it.\n\n' +
        'The default behaviour in most apps is a spinner that never resolves. The user has no idea whether their action was saved, and no way to retry without losing what they typed.\n\n' +
        '- **Never discard user input on failure.** If a save fails, the form keeps its contents. This project does exactly that when browser storage is full.\n' +
        '- **Say what happened, in plain language.** "No connection — your draft is saved here" beats a red triangle.\n' +
        '- **Make retry obvious and cheap.** One button, same place, no re-typing.\n\n' +
        '## Data costs money\n\n' +
        'When data is prepaid, every unnecessary megabyte is a real cost to a real person. That reframes performance work as a fairness issue rather than a technical nicety.\n\n' +
        '1. Resize images before they are sent or stored — this project caps uploads at 1200px wide.\n' +
        '2. Load images lazily so off-screen content costs nothing until it is needed.\n' +
        '3. Ship less code. Every library has a price paid by someone on a capped bundle.\n\n' +
        '> A page that works on a weak connection is not a degraded experience. For a large number of users it is the only experience.\n\n' +
        '## Local-first has a pleasant side effect\n\n' +
        'When the data lives on the device first and syncs later, the interface stops waiting. Actions feel instant because they are instant — the network catches up in the background.\n\n' +
        'This blog is an extreme version of that idea: everything lives in browser storage, so it works with the network unplugged entirely. Most real products land somewhere in the middle, but the instinct transfers.\n\n' +
        '## Test the way people actually browse\n\n' +
        'Open your browser developer tools, throttle the network to a slow profile, and use your own product. Then try it with the network disabled completely.\n\n' +
        'The first time you do this it is uncomfortable. That discomfort is the actual experience of a meaningful portion of your users, and it is the fastest route to knowing what to fix.'
    },
    {
      id: 'seed-learn-to-code',
      title: 'Learning to Code Without a Bootcamp Budget',
      author: 'Yongama',
      category: 'Education',
      date: '2026-09-03',
      featured: false,
      tags: ['learning', 'career', 'skills'],
      image: COVERS.education,
      imageAlt: 'Layered geometric planes suggesting stacked learning stages',
      excerpt: 'The material is free and abundant. What is scarce is structure, feedback and the discipline to finish things. Here is how to manufacture all three on your own.',
      content:
        'Everything you need to learn programming is available for free. That is genuinely true, and it is also why so many people stall — abundance without structure turns into an endless queue of half-watched tutorials.\n\n' +
        'The scarce resources are not lessons. They are **structure**, **feedback** and **finished work**.\n\n' +
        '## Escape tutorial purgatory\n\n' +
        'The trap is comfortable: a tutorial gives you the feeling of progress without the friction of decisions. You type what you are told, it works, and almost nothing transfers.\n\n' +
        'The escape is deliberately breaking the script:\n\n' +
        '- Finish the tutorial, then rebuild the same thing from an empty file with the tab closed.\n' +
        '- Change the requirements. If it built a to-do list, make yours support categories.\n' +
        '- When you get stuck, sit with it for twenty minutes before searching. That discomfort is the learning.\n\n' +
        '> You do not understand something because you watched it work. You understand it when you can rebuild it after forgetting the details.\n\n' +
        '## Build a structure nobody is giving you\n\n' +
        'A course has a syllabus and a deadline. Studying alone, you have to manufacture both.\n\n' +
        '1. **Pick one project, not one language.** "Build a blog that saves posts in the browser" is a goal. "Learn JavaScript" is not.\n' +
        '2. **Set a real deadline with a witness.** Tell someone you will show them the finished thing on a specific date.\n' +
        '3. **Work in short, frequent sessions.** Five focused days beat one exhausting weekend.\n\n' +
        '## Manufacture feedback\n\n' +
        'Without a mentor, you need other mirrors:\n\n' +
        '- **Read your own code a week later.** If you cannot follow it, that is feedback.\n' +
        '- **Explain it out loud.** Record yourself describing how a feature works. The sentence you stumble over marks the part you do not understand.\n' +
        '- **Publish it.** Putting work in public raises your standard more reliably than any amount of private intention.\n\n' +
        '## Finish things, even badly\n\n' +
        'Ten abandoned projects teach less than two finished ones. Finishing forces you through the unglamorous parts — validation, edge cases, empty states, the bug that only appears on a phone — and those parts are where the real skill lives.\n\n' +
        'A small, complete, polished project says more about your ability than an ambitious half-built one. It is also the thing you can actually show someone.\n\n' +
        '## Keep a record\n\n' +
        'Write down what you learned each week, even in two lines. Progress in programming is invisible day to day and obvious over months — but only if you wrote it down.\n\n' +
        'That habit is, incidentally, how this blog started.'
    },
    {
      id: 'seed-creator-economics',
      title: 'How Creator Tools Are Rewriting the Economics of Media',
      author: 'Yongama',
      category: 'Entertainment',
      date: '2026-08-29',
      featured: false,
      tags: ['media', 'creators', 'technology'],
      image: COVERS.entertainment,
      imageAlt: 'Colourful audio waveform bars radiating from a centre line',
      excerpt: 'Production costs that once needed a studio now fit on a laptop. The interesting consequence is not cheaper content — it is which stories become economically possible.',
      content:
        'For most of the last century, making media at a professional standard required capital. Cameras, edit suites, studio time, distribution deals. That cost structure decided what got made, because everything had to appeal to a large enough audience to justify the spend.\n\n' +
        'That constraint has largely dissolved. The consequence is more interesting than "content is cheaper now".\n\n' +
        '## The real shift is which stories become viable\n\n' +
        'When production costs collapse, the audience size required to break even collapses with it. A project that would have been rejected as too niche for a studio can now support the person making it.\n\n' +
        'This is why the most distinctive work is increasingly coming from small teams. They are not outcompeting studios on scale. They are serving audiences that were never big enough to be worth serving before.\n\n' +
        '> Lower production costs do not just change who can make things. They change what is worth making.\n\n' +
        '## What the tools actually removed\n\n' +
        '- **The edit suite** became software on an ordinary laptop.\n' +
        '- **Distribution** became a link, removing the gatekeeper entirely.\n' +
        '- **Discovery** became algorithmic, which is a mixed blessing but no longer requires a marketing budget.\n' +
        '- **Iteration** became nearly free — you can publish, watch the response, and adjust within a day.\n\n' +
        'That last one is underrated. Traditional media made expensive bets on long timelines. Creators run cheap experiments continuously, which is simply a faster way to find out what works.\n\n' +
        '## The new scarce resources\n\n' +
        'When production is no longer the bottleneck, the constraints move:\n\n' +
        '1. **Attention.** Everyone can publish, so being found is the hard part.\n' +
        '2. **Taste.** Tools do not supply judgement about what is worth making.\n' +
        '3. **Consistency.** Audiences form around reliability more than brilliance.\n' +
        '4. **Trust.** As synthetic media becomes ordinary, a known human voice becomes more valuable, not less.\n\n' +
        '## Where this is uncomfortable\n\n' +
        'It would be dishonest to present this as purely good news. Rates for entry-level production work are under real pressure, and the same tools that let one person make something remarkable also flood every feed with material made without much thought.\n\n' +
        'The abundance is real, and so is the cost of it.\n\n' +
        '## What it means if you are starting now\n\n' +
        'Do not compete on production value — that floor keeps rising and nobody wins there. Compete on perspective, on the specific thing you understand that others do not, and on showing up consistently enough for people to find you.\n\n' +
        'The tools are no longer the hard part. What you have to say still is.'
    }
  ];

  /* ----------------------------------------------------------------------
     Post persistence
     ---------------------------------------------------------------------- */

  /* Every post is normalised on read so posts created by older versions of
     the form (or hand-edited storage) never break a render. */
  function normalisePost(raw, index) {
    var p = raw && typeof raw === 'object' ? raw : {};
    var content = typeof p.content === 'string' ? p.content : '';
    return {
      id: p.id != null ? String(p.id) : 'post-' + index + '-' + Date.now(),
      title: typeof p.title === 'string' ? p.title : 'Untitled post',
      author: typeof p.author === 'string' && p.author.trim() ? p.author : 'Anonymous',
      category: CATEGORIES.indexOf(p.category) > -1 ? p.category : 'Digital Innovation',
      date: typeof p.date === 'string' && p.date ? p.date : todayISO(),
      excerpt: typeof p.excerpt === 'string' ? p.excerpt : truncate(content, 160),
      content: content,
      image: typeof p.image === 'string' ? p.image : '',
      imageAlt: typeof p.imageAlt === 'string' && p.imageAlt.trim() ? p.imageAlt : '',
      extraImage: typeof p.extraImage === 'string' ? p.extraImage : '',
      readingTime: Number(p.readingTime) > 0 ? Number(p.readingTime) : calculateReadingTime(content),
      tags: Array.isArray(p.tags) ? p.tags.filter(function (t) { return typeof t === 'string' && t.trim(); }) : [],
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

  /* Newest first: explicit createdAt wins, otherwise fall back to the date field. */
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
      // Space seed timestamps so ordering is stable and predictable.
      copy.createdAt = new Date(p.date).getTime() || (Date.now() - i * 86400000);
      return copy;
    });
    savePosts(seeded);
    return seeded;
  }

  /* Called once per page load — guarantees the site is never empty on first visit. */
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

  function deletePost(id) {
    var remaining = getPosts().filter(function (p) { return p.id !== String(id); });
    var result = savePosts(remaining);
    return { ok: result.ok, reason: result.reason, posts: remaining };
  }

  function addPost(post) {
    var posts = getPosts();
    posts.push(post);
    var result = savePosts(posts);
    return result;
  }

  /* ----------------------------------------------------------------------
     Bookmarks / comments / newsletter / messages
     ---------------------------------------------------------------------- */

  function getBookmarks() {
    var list = readStore(KEYS.bookmarks, []);
    return Array.isArray(list) ? list.map(String) : [];
  }

  function isBookmarked(id) {
    return getBookmarks().indexOf(String(id)) > -1;
  }

  /* Returns the new state so the caller can update the button label. */
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
    if (!all || typeof all !== 'object') return [];
    var list = all[String(postId)];
    return Array.isArray(list) ? list : [];
  }

  function addComment(postId, comment) {
    var all = readStore(KEYS.comments, {});
    if (!all || typeof all !== 'object') all = {};
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
      return String(s.email || s).toLowerCase() === clean;
    });
    if (exists) return 'duplicate';
    list.push({ email: clean, joined: new Date().toISOString() });
    return writeStore(KEYS.newsletter, list).ok || !storageWorks ? 'added' : 'failed';
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
    COVERS: COVERS,
    FALLBACK_IMAGE: FALLBACK_IMAGE,
    SEED_POSTS: SEED_POSTS,
    storageWorks: storageWorks,

    readStore: readStore,
    writeStore: writeStore,

    getPosts: getPosts,
    savePosts: savePosts,
    ensurePosts: ensurePosts,
    seedSamplePosts: seedSamplePosts,
    sortNewestFirst: sortNewestFirst,
    getPostById: getPostById,
    addPost: addPost,
    deletePost: deletePost,
    normalisePost: normalisePost,

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
    calculateReadingTime: calculateReadingTime,
    getInitials: getInitials,
    truncate: truncate
  };
})();
