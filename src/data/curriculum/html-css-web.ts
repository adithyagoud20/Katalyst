import type {
  ExerciseTestCase,
  LearningCheckpoint,
  LearningCourse,
  LearningDifficulty,
  LearningExampleRun,
  LearningExercise,
  LearningLesson,
  LearningModule,
  LearningObjective,
  LearningSubject,
} from "@/lib/learning-curriculum";

export const htmlCssWebSubject: LearningSubject = {
  id: "web-engineering",
  title: "Web Engineering & UI Architecture",
  description: "Semantic HTML5, accessible form design, modern CSS Flexbox, Grid, custom properties, and GPU-accelerated motion systems.",
};

export const htmlCssWebObjectives: LearningObjective[] = [
  { id: "web-semantic-html", title: "Structure accessible documents using semantic HTML5 elements: main, nav, article, section, and header." },
  { id: "web-accessible-forms", title: "Build accessible forms with associated labels, constraint validation, and keyboard focus states." },
  { id: "web-responsive-media", title: "Deliver responsive images with picture, srcset, and browser-native lazy loading." },
  { id: "web-flexbox-layouts", title: "Build 1-dimensional component layouts using CSS Flexbox alignment and distribution axes." },
  { id: "web-css-grid", title: "Construct 2-dimensional responsive grid layouts with fr units, minmax(), and auto-fit." },
  { id: "web-media-queries", title: "Implement mobile-first responsive interfaces using CSS media queries and viewport breakpoints." },
  { id: "web-custom-properties", title: "Architect maintainable design systems with scoped CSS custom properties and dark mode tokens." },
  { id: "web-transitions-motion", title: "Implement smooth micro-interactions using CSS transitions, transform matrixes, and keyframe animations." },
];

function exercise(
  id: string,
  title: string,
  prompt: string,
  solution: string,
  objectiveId: string,
  expectedOutcome: string,
  hints: string[],
  difficulty: LearningDifficulty = "Beginner",
  starterCode?: string,
  testCases?: ExerciseTestCase[],
): LearningExercise {
  return {
    id,
    title,
    prompt,
    solution,
    objectiveId,
    expectedOutcome,
    hints,
    hint: hints[0],
    difficulty,
    ...(starterCode ? { starterCode } : {}),
    ...(testCases ? { testCases } : {}),
  };
}

function checkpoint(prompt: string, answer: string): LearningCheckpoint {
  return { prompt, answer };
}

function exampleRun(expectedOutput: string, sampleInput?: string): LearningExampleRun {
  return { expectedOutput, ...(sampleInput !== undefined ? { sampleInput } : {}) };
}

function moduleData(
  id: string,
  order: number,
  title: string,
  summary: string,
  lessons: LearningLesson[],
): LearningModule {
  return { id, order, title, summary, lessons };
}

export const htmlCssWebLessons: LearningLesson[] = [
  // Module 1: Semantic Structure & Document Flow
  {
    id: "html-semantic-structure",
    order: 1,
    title: "Semantic HTML5 Elements and Accessible Outlines",
    summary: "Master core concepts and hands-on engineering techniques for semantic html5 elements and accessible outlines.",
    type: "guided-coding",
    objectiveIds: ["web-semantic-html"],
    prerequisiteLessonIds: [],
    estimatedDurationMinutes: 20,
    content: `HyperText Markup Language (HTML) provides the structural meaning and accessibility tree of the World Wide Web. Prior to HTML5, developers relied almost exclusively on \`<div>\` elements with arbitrary class names, rendering documents opaque to screen readers and search spiders.

### Core Semantic Landmarks
- \`<header>\`: Introductory content or navigational branding for a page or section.
- \`<nav>\`: A section containing major navigational links.
- \`<main>\`: The dominant, non-repeated content of the document (must only appear once per page).
- \`<article>\`: A self-contained composition that can stand independently (e.g. blog post, card, forum entry).
- \`<section>\`: A thematic grouping of content, typically with a heading.
- \`<footer>\`: Concluding content, copyright, or contact links.

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Engineering Log</title>
</head>
<body>
  <header>
    <h1>KATALYST System Log</h1>
    <nav aria-label="Main Navigation">
      <a href="#metrics">Metrics</a>
      <a href="#logs">Logs</a>
    </nav>
  </header>
  <main>
    <article id="metrics">
      <h2>Cluster Health</h2>
      <p>Node availability is currently at 99.98%.</p>
    </article>
  </main>
  <footer>
    <p>&copy; 2026 KATALYST Engineering</p>
  </footer>
</body>
</html>
\`\`\``,
    theorySections: [
      {
        title: "The Accessibility Tree and Assistive Tech",
        id: "html-css-web-sec-1",
        content: `When a browser parses HTML, it constructs both the DOM tree and an Accessibility Tree. Semantic tags like <main>, <nav>, and <header> are automatically mapped to WAI-ARIA landmark roles (role="main", role="navigation"). Screen reader users can jump directly between these landmarks using keyboard shortcuts, saving enormous time compared to traversing nested <div> tags.`,
      },
      {
        title: "Heading Hierarchies (h1 through h6)",
        id: "html-css-web-sec-2",
        content: `Headings create a hierarchical table of contents. A page should possess exactly one <h1> representing the main topic. Subsections should follow strict nesting (<h1> -> <h2> -> <h3>) without skipping heading levels (e.g. going straight from <h2> to <h4>), which disorients assistive technologies.`,
      },
    ],
    codeExamples: [
      {
        title: "Semantic Card Layout",
        description: "Structures a blog preview card using semantic tags.",
        code: `<article class="card">
  <header>
    <span class="badge">Architecture</span>
    <h2>WASM Sandbox Security</h2>
  </header>
  <p>How isolated memory buffers protect local browsers from arbitrary code execution.</p>
  <footer>
    <time datetime="2026-03-15">March 15, 2026</time>
  </footer>
</article>`,
        language: "html",
      },
    ],
    exercise: exercise(
      "ex-html-semantic-structure",
      "Build a Semantic Article Document",
      "Write a complete HTML snippet containing `<header>`, `<main>`, and `<footer>` elements. Inside `<main>`, include an `<article>` with an `<h2>` heading reading 'Telemetry Dashboard' and a `<p>` paragraph.",
      `<header>
  <h1>KATALYST</h1>
</header>
<main>
  <article>
    <h2>Telemetry Dashboard</h2>
    <p>System metrics are operational.</p>
  </article>
</main>
<footer>
  <p>Local Runtime</p>
</footer>`,
      "web-semantic-html",
      "Semantic HTML document with header, main, article, and footer.",
      [
        "Use <header>, <main>, and <footer> tags.",
        "Nest an <article> inside <main>.",
        "Add an <h2>Telemetry Dashboard</h2> inside <article>.",
      ],
      "Beginner",
      `<!-- Write a semantic layout with header, main, article, and footer: -->
<header>
  <h1>KATALYST</h1>
</header>
<main>
  <article>
    <h2>Telemetry Dashboard</h2>
    <p>System metrics are operational.</p>
  </article>
</main>
<footer>
  <p>Local Runtime</p>
</footer>`,
      [
        {
          id: "tc-html-sem-1",
          label: "Contains semantic article and h2 heading",
          stdin: "",
          expectedStdout: "Telemetry Dashboard",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is <main> preferred over a generic <div id='main'>?",
      "It exposes an explicit landmark role in the browser accessibility tree, allowing screen reader users to navigate directly to primary content.",
    ),
    exampleRun: exampleRun("Telemetry Dashboard"),
  },
  {
    id: "html-accessible-forms",
    order: 2,
    title: "Accessible Forms, Labels, and Input Validation",
    summary: "Master core concepts and hands-on engineering techniques for accessible forms, labels, and input validation.",
    type: "guided-coding",
    objectiveIds: ["web-accessible-forms"],
    prerequisiteLessonIds: ["html-semantic-structure"],
    estimatedDurationMinutes: 25,
    content: `Forms are the primary interactive surface for data entry on the web. An inaccessible form prevents users with assistive devices or keyboard-only navigation from interacting with your system.

### Explicit Label Association
Every \`<input>\` must have an associated \`<label>\`. Linking can be done explicitly via \`id\` and \`for\` attributes:
\`\`\`html
<label for="user-email">Email Address</label>
<input 
  type="email" 
  id="user-email" 
  name="email" 
  required 
  placeholder="name@company.com" 
  autocomplete="email"
/>
\`\`\`
Clicking the label expands the clickable hit target and automatically transfers keyboard focus to the input.

### Browser Constraint Validation
HTML5 includes built-in declarative validation attributes:
- \`required\`: Prevents form submission if empty.
- \`minlength\` / \`maxlength\`: Enforces text length bounds.
- \`min\` / \`max\` / \`step\`: Restricts numeric ranges.
- \`pattern\`: Enforces a regular expression.`,
    theorySections: [
      {
        title: "Keyboard Navigation and Tabindex",
        id: "html-css-web-sec-3",
        content: `All native form controls (<input>, <button>, <select>, <textarea>) participate naturally in the keyboard tab sequence. Custom interactive controls built with <div> or <span> require tabindex="0" and explicit keydown handlers (Enter and Space) to match native accessibility.`,
      },
      {
        title: "ARIA Descriptions and Error States",
        id: "html-css-web-sec-4",
        content: `When validation fails or input instructions exist, link the descriptive text to the input using aria-describedby="help-id". When the input gains focus, screen readers automatically announce the label followed by the description.`,
      },
    ],
    codeExamples: [
      {
        title: "Accessible Authentication Form",
        description: "A secure form with autocomplete hints and validation.",
        code: `<form action="/login" method="POST">
  <div class="field">
    <label for="username">Developer Handle</label>
    <input type="text" id="username" name="username" required autocomplete="username" />
  </div>
  <div class="field">
    <label for="apikey">API Key</label>
    <input type="password" id="apikey" name="apikey" required minlength="16" />
  </div>
  <button type="submit">Authenticate</button>
</form>`,
        language: "html",
      },
    ],
    exercise: exercise(
      "ex-html-accessible-forms",
      "Build an Accessible Deployment Form",
      "Create an HTML form with: 1) A text input with `id='cluster-name'` and a linked `<label for='cluster-name'>Cluster Name</label>`. 2) A submit `<button type='submit'>Deploy</button>`.",
      `<form>
  <label for="cluster-name">Cluster Name</label>
  <input type="text" id="cluster-name" name="cluster_name" required />
  <button type="submit">Deploy</button>
</form>`,
      "web-accessible-forms",
      "Form created with accessible label and submit button.",
      [
        "Use <label for='cluster-name'>Cluster Name</label>",
        "Include <input type='text' id='cluster-name' ... />",
        "Add <button type='submit'>Deploy</button>",
      ],
      "Beginner",
      `<!-- Build an accessible form with linked label and input: -->
<form>
  <label for="cluster-name">Cluster Name</label>
  <input type="text" id="cluster-name" name="cluster_name" required />
  <button type="submit">Deploy</button>
</form>`,
      [
        {
          id: "tc-html-form-1",
          label: "Contains input with id cluster-name and linked label",
          stdin: "",
          expectedStdout: "Deploy",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What benefit does linking a <label for='id'> provide for mouse and touch users?",
      "It enlarges the interactive hit target, allowing users to focus the input by tapping or clicking anywhere on the label text.",
    ),
    exampleRun: exampleRun("Cluster Name Deploy"),
  },
  {
    id: "html-responsive-media",
    order: 3,
    title: "Responsive Media, Picture, and Native Lazy Loading",
    summary: "Master core concepts and hands-on engineering techniques for responsive media, picture, and native lazy loading.",
    type: "guided-coding",
    objectiveIds: ["web-responsive-media"],
    prerequisiteLessonIds: ["html-accessible-forms"],
    estimatedDurationMinutes: 20,
    content: `Modern websites must serve imagery across devices ranging from 375px mobile screens to high-density 4K retina displays. Serving a single desktop-sized image wastes user bandwidth and impairs Core Web Vitals (specifically Largest Contentful Paint).

### The \`<picture>\` Element and Art Direction
The \`<picture>\` element allows developers to define multiple source images based on media queries or supported formats (e.g. AVIF, WebP, JPEG):
\`\`\`html
<picture>
  <source srcset="hero-mobile.webp" media="(max-width: 600px)" type="image/webp" />
  <source srcset="hero-desktop.avif" type="image/avif" />
  <img src="hero-desktop.jpg" alt="Server rack architecture in datacenter" width="1200" height="600" loading="lazy" />
</picture>
\`\`\`

### Invariants for Performant Media
1. Always specify explicit \`width\` and \`height\` attributes to reserve layout space and eliminate Cumulative Layout Shift (CLS).
2. Set \`loading="lazy"\` on below-the-fold media to defer network requests until the user scrolls near the element.
3. Always supply meaningful \`alt\` text describing image content for accessibility.`,
    theorySections: [
      {
        title: "Cumulative Layout Shift (CLS) and Aspect Ratios",
        id: "html-css-web-sec-5",
        content: `When a browser downloads an image without dimensions, it initially renders it at 0x0 pixels. Once the image headers are downloaded, the browser suddenly expands the element, pushing subsequent content downward. Providing explicit width and height allows the browser to compute the CSS aspect-ratio upfront and hold the layout geometry stable.`,
      },
      {
        title: "Format Negotiation (AVIF vs WebP vs JPEG)",
        id: "html-css-web-sec-6",
        content: `AVIF provides up to 50% smaller file sizes than JPEG at equivalent visual quality. By listing AVIF first in <picture> <source>, modern browsers load the efficient format while legacy clients fall back to JPEG.`,
      },
    ],
    codeExamples: [
      {
        title: "High-Density Retina Image with srcset",
        description: "Serves 1x standard and 2x retina display variants.",
        code: `<img 
  src="diagram-1x.png" 
  srcset="diagram-1x.png 1x, diagram-2x.png 2x" 
  alt="Microservice dependency graph" 
  width="600" 
  height="400" 
/>`,
        language: "html",
      },
    ],
    exercise: exercise(
      "ex-html-responsive-media",
      "Declare a Responsive Picture Element",
      "Write a `<picture>` element with a `<source>` for mobile screens (`media='(max-width: 768px)'` with `srcset='mobile.webp'`) and an `<img>` fallback with `src='desktop.jpg'`, `alt='Engineering Workspace'`, and `loading='lazy'`.",
      `<picture>
  <source media="(max-width: 768px)" srcset="mobile.webp" />
  <img src="desktop.jpg" alt="Engineering Workspace" loading="lazy" width="800" height="400" />
</picture>`,
      "web-responsive-media",
      "Picture element configured with source and lazy img fallback.",
      [
        "Use <picture>",
        "Include <source media='(max-width: 768px)' srcset='mobile.webp' />",
        "Include <img src='desktop.jpg' alt='Engineering Workspace' loading='lazy' />",
      ],
      "Beginner",
      `<!-- Write a responsive picture element with mobile source and lazy fallback: -->
<picture>
  <source media="(max-width: 768px)" srcset="mobile.webp" />
  <img src="desktop.jpg" alt="Engineering Workspace" loading="lazy" width="800" height="400" />
</picture>`,
      [
        {
          id: "tc-html-media-1",
          label: "Picture contains lazy loading img with alt text",
          stdin: "",
          expectedStdout: "Engineering Workspace",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What core web vital does specifying width and height on <img> elements protect against?",
      "Cumulative Layout Shift (CLS), by allowing the browser to reserve the correct aspect ratio before image bytes download.",
    ),
    exampleRun: exampleRun("Engineering Workspace"),
  },

  // Module 2: Modern Layout Systems (Flexbox & Grid)
  {
    id: "css-box-model-flexbox",
    order: 4,
    title: "The CSS Box Model and Flexbox Alignment",
    summary: "Master core concepts and hands-on engineering techniques for the css box model and flexbox alignment.",
    type: "guided-coding",
    objectiveIds: ["web-flexbox-layouts"],
    prerequisiteLessonIds: ["html-responsive-media"],
    estimatedDurationMinutes: 25,
    content: `Every HTML element rendered in CSS generates a rectangular box consisting of:
\`content\` + \`padding\` + \`border\` + \`margin\`.

### Box-Sizing: Border-Box
The standard box model (\`box-sizing: content-box\`) adds padding and border to the specified width, causing unexpected overflow. Modern CSS universally resets this:
\`\`\`css
*, *::before, *::after {
  box-sizing: border-box;
}
\`\`\`
With \`border-box\`, an element with \`width: 200px; padding: 20px;\` remains exactly 200px wide.

### CSS Flexible Box Layout (Flexbox)
Flexbox manages 1-dimensional distribution along a **Main Axis** and a **Cross Axis**:
\`\`\`css
.nav-bar {
  display: flex;
  flex-direction: row;            /* Main axis: horizontal */
  justify-content: space-between; /* Main axis alignment */
  align-items: center;            /* Cross axis alignment */
  gap: 1rem;                      /* Spacing between items */
}
\`\`\`

### Flex Item Properties
- \`flex-grow: 1\`: Item expands to occupy remaining free space.
- \`flex-shrink: 0\`: Prevents item from contracting below its intrinsic size.
- \`flex-basis\`: Initial size along the main axis before distributing space.`,
    theorySections: [
      {
        title: "Main Axis vs Cross Axis Mechanics",
        id: "html-css-web-sec-7",
        content: `When flex-direction is 'row', the main axis runs horizontally (left-to-right) and the cross axis runs vertically. When changed to 'column', the main axis flips to vertical, meaning justify-content now controls vertical positioning and align-items controls horizontal alignment.`,
      },
      {
        title: "Margin Auto in Flex Containers",
        id: "html-css-web-sec-8",
        content: `Applying margin-left: auto to a flex child absorbs all remaining free space along the main axis, pushing that item and any subsequent siblings to the far edge. This eliminates the need for nested wrapper divs when creating split toolbars or navigation bars.`,
      },
    ],
    codeExamples: [
      {
        title: "Centered Modal Layout with Flexbox",
        description: "Perfect horizontal and vertical centering.",
        code: `.modal-backdrop {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.modal-dialog {
  width: 100%;
  max-width: 480px;
}`,
        language: "html",
      },
    ],
    exercise: exercise(
      "ex-css-box-model-flexbox",
      "Build a Flexbox Navigation Bar",
      "Create a CSS snippet for `.navbar` that uses `display: flex`, aligns items vertically in the center (`align-items: center`), spaces items evenly across the main axis (`justify-content: space-between`), and sets a `gap: 16px`.",
      `.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}`,
      "web-flexbox-layouts",
      "Flexbox navigation bar with alignment and gap properties.",
      [
        "Set display: flex;",
        "Add align-items: center;",
        "Add justify-content: space-between;",
        "Set gap: 16px;",
      ],
      "Beginner",
      `/* Write the CSS rules for .navbar using Flexbox: */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}`,
      [
        {
          id: "tc-css-flex-1",
          label: "Navbar uses flexbox alignment properties",
          stdin: "",
          expectedStdout: "space-between",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the difference between justify-content and align-items in a flex container?",
      "justify-content aligns items along the main axis, while align-items aligns items across the cross axis.",
    ),
    exampleRun: exampleRun(".navbar { display: flex; justify-content: space-between; }"),
  },
  {
    id: "css-grid-architecture",
    order: 5,
    title: "CSS Grid Layout Architecture",
    summary: "Master core concepts and hands-on engineering techniques for css grid layout architecture.",
    type: "guided-coding",
    objectiveIds: ["web-css-grid"],
    prerequisiteLessonIds: ["css-box-model-flexbox"],
    estimatedDurationMinutes: 30,
    content: `While Flexbox specializes in 1-dimensional layouts (rows OR columns), **CSS Grid** is a 2-dimensional system capable of controlling rows AND columns simultaneously.

### The Fractional Unit (\`fr\`)
The \`fr\` unit represents a fraction of available free space in the grid container:
\`\`\`css
.dashboard {
  display: grid;
  grid-template-columns: 240px 1fr 320px; /* Sidebar, Fluid Main, Telemetry */
  gap: 1.5rem;
}
\`\`\`

### The Responsive Holy Grail: \`auto-fit\` and \`minmax()\`
You can create an intrinsically responsive card grid **without writing a single media query** using \`repeat()\` with \`auto-fit\` and \`minmax()\`:
\`\`\`css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}
\`\`\`
1. \`minmax(280px, 1fr)\`: Cards are at least 280px wide, but stretch to fill leftover space.
2. \`auto-fit\`: The browser fits as many 280px columns as possible across the container width. If screen size decreases, columns naturally wrap.`,
    theorySections: [
      {
        title: "auto-fit vs auto-fill",
        id: "html-css-web-sec-9",
        content: `When there are fewer items than available column slots:
- auto-fill creates empty phantom grid tracks, keeping items at their minimum size.
- auto-fit collapses empty tracks to 0px, causing the existing items to expand across the entire container width. For card grids, auto-fit is almost always desired.`,
      },
      {
        title: "Named Grid Areas",
        id: "html-css-web-sec-10",
        content: `Grid supports ASCII-art layout definitions:
grid-template-areas:
  "header header"
  "sidebar main"
  "footer footer";
Assigning elements via grid-area: sidebar decouples HTML source ordering from visual display.`,
      },
    ],
    codeExamples: [
      {
        title: "Responsive Card Grid",
        description: "Intrinsically fluid grid that reflows automatically on small screens.",
        code: `.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}`,
        language: "html",
      },
    ],
    exercise: exercise(
      "ex-css-grid-architecture",
      "Create an Auto-Fit Responsive Grid",
      "Write a CSS rule for `.cluster-grid` that defines a grid with `display: grid;`, sets columns to `repeat(auto-fit, minmax(300px, 1fr));`, and adds a `gap: 24px;`.",
      `.cluster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}`,
      "web-css-grid",
      "CSS Grid defined with auto-fit, minmax, and gap.",
      [
        "Use display: grid;",
        "Set grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));",
        "Add gap: 24px;",
      ],
      "Developing",
      `/* Write the CSS rules for .cluster-grid: */
.cluster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}`,
      [
        {
          id: "tc-css-grid-1",
          label: "Cluster grid uses auto-fit minmax columns",
          stdin: "",
          expectedStdout: "minmax(300px, 1fr)",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the role of 1fr in a CSS Grid template definition?",
      "It allocates one proportional share of the container's remaining free space after fixed and content-sized tracks are calculated.",
    ),
    exampleRun: exampleRun(".cluster-grid { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }"),
  },
  {
    id: "css-responsive-media-queries",
    order: 6,
    title: "Mobile-First Media Queries and Viewport Breakpoints",
    summary: "Master core concepts and hands-on engineering techniques for mobile-first media queries and viewport breakpoints.",
    type: "guided-coding",
    objectiveIds: ["web-media-queries"],
    prerequisiteLessonIds: ["css-grid-architecture"],
    estimatedDurationMinutes: 25,
    content: `Responsive web design adapts UI layout and typography across varying viewport widths. 

### Mobile-First Philosophy
In a **Mobile-First** architecture:
1. Base styles outside of any media query define the mobile layout (single column, full width, stacked navigation).
2. Media queries use \`min-width\` to layer on enhancements as screen real estate increases:

\`\`\`css
/* Base styles: Mobile (< 640px) */
.page-container {
  padding: 1rem;
}
.sidebar {
  display: none; /* Hidden on mobile */
}

/* Tablet: >= 640px */
@media (min-width: 640px) {
  .page-container {
    padding: 2rem;
  }
}

/* Desktop: >= 1024px */
@media (min-width: 1024px) {
  .page-layout {
    display: flex;
  }
  .sidebar {
    display: block;
    width: 260px;
  }
}
\`\`\`

Why mobile-first? Mobile devices typically have less CPU power and bandwidth; keeping base rules lightweight ensures fastest rendering for mobile clients.`,
    theorySections: [
      {
        title: "Standard Breakpoint Conventions",
        id: "html-css-web-sec-11",
        content: `Standard breakpoints typically align with device boundaries:
- sm: 640px (large smartphones, landscape phones)
- md: 768px (tablets, iPads)
- lg: 1024px (laptops, desktops)
- xl: 1280px (widescreen monitors)
Avoid designing for exact device pixels; design around content break points where typography or layout feels constrained.`,
      },
      {
        title: "Viewport Meta Tag Prerequisite",
        id: "html-css-web-sec-12",
        content: `Without <meta name="viewport" content="width=device-width, initial-scale=1.0">, mobile browsers assume a legacy desktop website and zoom out to a 980px virtual canvas, rendering min-width media queries ineffective.`,
      },
    ],
    codeExamples: [
      {
        title: "Responsive Navigation Switch",
        description: "Switches from mobile hamburger bar to inline desktop list.",
        code: `.nav-links {
  display: none;
}
@media (min-width: 768px) {
  .nav-links {
    display: flex;
    gap: 1.5rem;
  }
  .hamburger-btn {
    display: none;
  }
}`,
        language: "html",
      },
    ],
    exercise: exercise(
      "ex-css-responsive-media-queries",
      "Write a Mobile-First Media Query",
      "Write CSS where `.container` has a base `padding: 12px;`, and within an `@media (min-width: 768px)` media query, expands to `padding: 32px;`.",
      `.container {
  padding: 12px;
}

@media (min-width: 768px) {
  .container {
    padding: 32px;
  }
}`,
      "web-media-queries",
      "Mobile-first responsive container padding.",
      [
        "Define .container { padding: 12px; } outside media queries.",
        "Add @media (min-width: 768px) { .container { padding: 32px; } }",
      ],
      "Beginner",
      `/* Base mobile style: */
.container {
  padding: 12px;
}

/* Tablet/Desktop enhancement: */
@media (min-width: 768px) {
  .container {
    padding: 32px;
  }
}`,
      [
        {
          id: "tc-css-mq-1",
          label: "Media query uses min-width 768px",
          stdin: "",
          expectedStdout: "min-width: 768px",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is min-width preferred over max-width in responsive CSS architecture?",
      "min-width enforces mobile-first styling, where mobile devices parse baseline rules without overriding unnecessary desktop overrides.",
    ),
    exampleRun: exampleRun("@media (min-width: 768px) { .container { padding: 32px; } }"),
  },

  // Module 3: Modern CSS Architecture & Animations
  {
    id: "css-custom-properties-themes",
    order: 7,
    title: "CSS Custom Properties and Theming Tokens",
    summary: "Master core concepts and hands-on engineering techniques for css custom properties and theming tokens.",
    type: "guided-coding",
    objectiveIds: ["web-custom-properties"],
    prerequisiteLessonIds: ["css-responsive-media-queries"],
    estimatedDurationMinutes: 25,
    content: `CSS Custom Properties (commonly called CSS Variables) allow developers to declare reusable design tokens that cascade naturally through the DOM tree.

### Declaring and Using Variables
\`\`\`css
:root {
  --color-primary: #2563eb;
  --color-surface: #ffffff;
  --color-text: #0f172a;
  --space-unit: 8px;
  --radius-md: 6px;
}

.button {
  background-color: var(--color-primary);
  color: #ffffff;
  padding: calc(var(--space-unit) * 1.5) calc(var(--space-unit) * 2);
  border-radius: var(--radius-md);
}
\`\`\`

### Seamless Dark Mode Theming
Because custom properties dynamically cascade, switching themes simply requires updating property definitions:
\`\`\`css
/* Dark theme tokens */
[data-theme="dark"] {
  --color-surface: #090d16;
  --color-text: #f8fafc;
  --color-primary: #3b82f6;
}

/* System dark mode preference */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-surface: #090d16;
    --color-text: #f8fafc;
  }
}
\`\`\`
Every UI component referencing \`var(--color-surface)\` updates instantaneously with zero JavaScript reflows!`,
    theorySections: [
      {
        title: "Cascade and Lexical Scope in Custom Properties",
        id: "html-css-web-sec-13",
        content: `Sass variables ($color: blue) are evaluated once at compile time into static CSS strings. CSS Custom Properties (--color: blue) live in the live DOM. They can be redefined on specific components or modified at runtime via element.style.setProperty('--color', newColor), enabling dynamic theming.`,
      },
      {
        title: "Fallback Values in var()",
        id: "html-css-web-sec-14",
        content: `The var() function accepts an optional second parameter: var(--font-brand, sans-serif). If --font-brand is undefined or invalid, the browser gracefully applies the fallback without breaking layout rendering.`,
      },
    ],
    codeExamples: [
      {
        title: "Theme Token Declaration",
        description: "Declares root theme tokens and a scoped dark theme override.",
        code: `:root {
  --bg-primary: #f8fafc;
  --text-primary: #0f172a;
}
[data-theme="dark"] {
  --bg-primary: #0b0f19;
  --text-primary: #f1f5f9;
}
body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}`,
        language: "html",
      },
    ],
    exercise: exercise(
      "ex-css-custom-properties-themes",
      "Declare and Consume Theme Custom Properties",
      "Declare `:root` with `--accent-color: #2563eb;` and a dark override `[data-theme='dark']` with `--accent-color: #60a5fa;`. Then style `.btn-primary` with `background-color: var(--accent-color);`.",
      `:root {
  --accent-color: #2563eb;
}

[data-theme="dark"] {
  --accent-color: #60a5fa;
}

.btn-primary {
  background-color: var(--accent-color);
}`,
      "web-custom-properties",
      "CSS variables declared for light/dark themes and consumed in button.",
      [
        "Define :root { --accent-color: #2563eb; }",
        "Define [data-theme='dark'] { --accent-color: #60a5fa; }",
        "Consume with background-color: var(--accent-color); inside .btn-primary",
      ],
      "Beginner",
      `/* Declare tokens: */
:root {
  --accent-color: #2563eb;
}

[data-theme="dark"] {
  --accent-color: #60a5fa;
}

/* Consume token: */
.btn-primary {
  background-color: var(--accent-color);
}`,
      [
        {
          id: "tc-css-vars-1",
          label: "Consumes var(--accent-color)",
          stdin: "",
          expectedStdout: "var(--accent-color)",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the key advantage of CSS custom properties over Sass/Less preprocessor variables?",
      "CSS custom properties live in the browser DOM and update dynamically at runtime through cascading scopes and JavaScript.",
    ),
    exampleRun: exampleRun(".btn-primary { background-color: var(--accent-color); }"),
  },
  {
    id: "css-transitions-animations",
    order: 8,
    title: "CSS Transitions, Transforms, and Keyframe Animations",
    summary: "Master core concepts and hands-on engineering techniques for css transitions, transforms, and keyframe animations.",
    type: "guided-coding",
    objectiveIds: ["web-transitions-motion"],
    prerequisiteLessonIds: ["css-custom-properties-themes"],
    estimatedDurationMinutes: 25,
    content: `Motion communicates state changes, confirms user actions, and establishes visual hierarchy. However, poorly authored animations trigger expensive browser layout and paint passes, causing stuttering and drained battery life.

### The Composite-Only Animation Rule
For buttery 60fps performance, **only animate composite properties**:
1. \`transform\` (\`translate\`, \`scale\`, \`rotate\`)
2. \`opacity\`

Animating layout properties (e.g. \`width\`, \`height\`, \`top\`, \`left\`, \`margin\`) forces the browser to recalculate layout geometry for all neighboring elements!

### CSS Transitions
\`\`\`css
.card {
  transform: translateY(0);
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.2);
}
\`\`\`

### Keyframe Animations
\`\`\`css
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

.pulsing-indicator {
  animation: pulse 2s infinite ease-in-out;
}
\`\`\``,
    theorySections: [
      {
        title: "Browser Rendering Pipeline: Layout vs Paint vs Composite",
        id: "html-css-web-sec-15",
        content: `The browser pipeline consists of: DOM -> Layout (Geometry) -> Paint (Rasterization) -> Composite (Layer positioning on GPU). Changing 'left' forces Layout + Paint + Composite. Changing 'transform' bypasses Layout and Paint entirely, moving the pre-rasterized layer directly on the GPU compositor thread.`,
      },
      {
        title: "Accessibility: prefers-reduced-motion",
        id: "html-css-web-sec-16",
        content: `Animations can trigger vertigo and motion sickness for users with vestibular disorders. Always respect system accessibility preferences:
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}`,
      },
    ],
    codeExamples: [
      {
        title: "Spinner Loading Animation",
        description: "A continuous 360-degree rotation spinner.",
        code: `@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #3b82f6;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}`,
        language: "html",
      },
    ],
    exercise: exercise(
      "ex-css-transitions-animations",
      "Build a GPU-Accelerated Button Interaction",
      "Write CSS for `.action-btn` that has a `transition: transform 150ms ease;`. On `:hover`, it scales up with `transform: scale(1.05);`, and on `:active`, it scales down with `transform: scale(0.95);`.",
      `.action-btn {
  transition: transform 150ms ease;
}

.action-btn:hover {
  transform: scale(1.05);
}

.action-btn:active {
  transform: scale(0.95);
}`,
      "web-transitions-motion",
      "Hardware-accelerated scale transition on button interaction.",
      [
        "Add transition: transform 150ms ease; to .action-btn",
        "Add transform: scale(1.05); to .action-btn:hover",
        "Add transform: scale(0.95); to .action-btn:active",
      ],
      "Beginner",
      `/* Write GPU-accelerated interaction for .action-btn: */
.action-btn {
  transition: transform 150ms ease;
}

.action-btn:hover {
  transform: scale(1.05);
}

.action-btn:active {
  transform: scale(0.95);
}`,
      [
        {
          id: "tc-css-trans-1",
          label: "Action button uses transform transitions",
          stdin: "",
          expectedStdout: "scale(1.05)",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Which two CSS properties can be animated strictly on the GPU compositor thread without triggering layout reflows?",
      "transform and opacity.",
    ),
    exampleRun: exampleRun(".action-btn:hover { transform: scale(1.05); }"),
  },
];

// Module Groupings
export const htmlCssWebModules: LearningModule[] = [
  moduleData(
    "html-module-semantic-flow",
    1,
    "Semantic Structure & Document Flow",
    "Master semantic HTML landmarks, document outlines, accessible form controls, and responsive media delivery.",
    htmlCssWebLessons.slice(0, 3),
  ),
  moduleData(
    "css-module-layout-systems",
    2,
    "Modern Layout Systems (Flexbox & Grid)",
    "Build fluid 1D layouts with Flexbox and 2D auto-fit grids with fractional fr units and minmax().",
    htmlCssWebLessons.slice(3, 6),
  ),
  moduleData(
    "css-module-architecture-motion",
    3,
    "CSS Architecture, Tokens & Motion",
    "Architect design systems with CSS custom property tokens, zero-runtime dark mode, and 60fps GPU-accelerated motion.",
    htmlCssWebLessons.slice(6, 8),
  ),
];

export const htmlCssWebPath: LearningCourse = {
  id: "html-css-web",
  subjectId: htmlCssWebSubject.id,
  title: "Modern HTML5 & Responsive CSS Architecture",
  description: "Semantic markup, accessible forms, Flexbox, Grid, custom properties, and GPU-accelerated motion.",
  level: "Beginner",
  version: "1.0.0",
  prerequisites: [
      "Basic computer and browser navigation skills."
  ],
  objectives: htmlCssWebObjectives,
  learningOutcomes: [
      "Structure accessible documents using semantic HTML5 elements and landmarks.",
      "Build accessible web forms with associated labels and constraint validation.",
      "Deliver responsive images with picture, srcset, and native lazy loading.",
      "Construct 1-dimensional layouts with Flexbox and 2-dimensional layouts with CSS Grid.",
      "Architect maintainable design systems with scoped CSS custom properties.",
      "Deliver smooth 60fps micro-interactions using GPU-accelerated CSS transitions."
  ],
  estimatedDurationMinutes: 360,
  publicationStatus: "published",
  modules: htmlCssWebModules,
};
