# UI & Accessibility Standards: {{PROJECT_NAME}}

This document establishes the user interface design tokens, responsive layout rules, accessibility requirements (WCAG 2.1 AA), and animation principles for {{PROJECT_NAME}}.

---

## 1. Design System & Visual Foundations

- **Color Palette & Contrast**:
  - Maintain a minimum contrast ratio of **4.5:1** for normal text and **3:1** for large text against background colors.
  - Semantic colors must remain clear and distinct in both Dark and Light themes.
  - Never convey critical information using color alone (pair with text labels or icons).
- **Typography**:
  - Consistent type scale with proportional line-heights (`leading-relaxed` for prose, `leading-tight` for headlines).
  - Use tabular numbers (`font-mono` or `tabular-nums`) for counters, financial figures, and timestamps.
- **Spacing Scale**:
  - Use an 8pt / 4px modular spacing grid (`p-2`, `p-4`, `p-6`, `p-8`).

---

## 2. Responsive Layout & Breakpoints

- Mobile-first CSS architecture:
  - `sm`: 640px (large mobile / small tablet)
  - `md`: 768px (tablet portrait)
  - `lg`: 1024px (desktop / laptop)
  - `xl`: 1280px (wide desktop)
- Full width layouts should protect against excessive stretching using bounded containers (e.g. `max-w-7xl mx-auto px-4 sm:px-6`).

---

## 3. Accessibility Invariants (WCAG 2.1 AA)

1. **Keyboard Operability**:
   - Every interactive control must be reachable and triggerable using `Tab`, `Enter`, and `Space`.
   - Never suppress visible focus rings without supplying a high-contrast custom outline (`focus-visible:ring-2`).
2. **Form Accessibility**:
   - All inputs must have associated `<label>` tags with matching `htmlFor` / `id` pairs or `aria-label`.
   - Validation errors must be linked to inputs via `aria-describedby` and marked `aria-invalid="true"`.
3. **Screen Readers & ARIA**:
   - Use native semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<dialog>`) before reaching for ARIA role attributes.
   - Decorative icons must carry `aria-hidden="true"`.

---

## 4. Motion, Physics & Performance

- **Frame Budget**:
  - Animate only composite properties (`transform`, `opacity`). Never animate layout triggers (`width`, `height`, `top`, `margin`).
- **Reduced Motion**:
  - Respect user motion preferences:
    ```css
    @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
    ```
- **Micro-Interactions**: Keep button and popover transitions snappy (150ms–250ms with ease-out curve).

---

## 5. Verification Protocol

- Use **Chrome DevTools MCP** to inspect DOM nodes, capture rendered screenshots, and verify zero console errors during UI development.
