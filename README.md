# Positive Legacy Solutions LLC — Website

Production-ready static marketing site for **Positive Legacy Solutions LLC (PLS)**, a
multi-service business in Jacksonville, FL (Insurance, Real Estate, Tax, Immigration,
plus Notary & Translation).

**Tagline:** *Building Your Legacy, Securing Your Future.*

Pure **HTML + Tailwind CSS (CDN) + vanilla JavaScript** — no build step, no framework.

---

## File structure

```
pls-website/
├── index.html          # Home
├── about.html          # About / team / values
├── insurance.html      # Service detail
├── real-estate.html    # Service detail
├── tax-services.html   # Service detail
├── immigration.html    # Service detail (includes non-attorney disclaimer)
├── faq.html            # FAQ grouped by service
├── contact.html        # Contact info, Google Map, Web3Forms form
├── css/custom.css      # Color palette (CSS vars) + all animations/overrides
├── js/main.js          # All behavior (nav, slider, counters, form, etc.)
├── favicon.svg         # "PLS" monogram with gold arrow motif
├── _headers            # Cloudflare Pages security + cache headers
└── README.md
```

The **header and footer markup is byte-identical across every page** (verified via
checksum). Propagate nav changes to all pages at once with your Python script.

---

## Color palette (Legacy Navy & Gold)

Defined as CSS variables in `:root` (`css/custom.css`):

| Variable | Hex | Use |
|---|---|---|
| `--navy-900` | `#0B1D3A` | Hero overlays, dark sections, footer |
| `--navy-800` | `#12294E` | Cards on dark sections |
| `--navy-700` | `#1B3A6B` | Hover states |
| `--gold-500` | `#C9A227` | Buttons, icons, numbers, links |
| `--gold-400` | `#E0B94B` | Hover accent, progress bars |
| `--cream-50` | `#FAF7F0` | Light section backgrounds |
| `--gray-600` | `#5B6B7F` | Body text on light |
| `--gray-300` | `#C9D2DE` | Body text on dark |

---

## ⚠️ Three placeholders to replace before launch

1. **Web3Forms access key** — get a free key at <https://web3forms.com>, then set
   `WEB3FORMS_ACCESS_KEY` at the top of `js/main.js` (it auto-fills the form's hidden
   `access_key` input; the literal in `contact.html` is a fallback).
2. **Email address** — replace `positivelegacysolutions@gmail.com` sitewide
   (`grep -r positivelegacysolutions@gmail.com`).
3. **Owner name** — set `OWNER_NAME` in `js/main.js` and re-run the page generator, or
   search-replace `Etienne` in `about.html`. (Copy currently uses "The PLS Team".)

---

## Local preview

Any static server works (needed so the fonts/CDN and form fetch behave):

```bash
npx serve .
# or
python -m http.server 8000
```

Then open <http://localhost:8000>.

---

## Deploy on Cloudflare Pages

Connect the repo, or drag-and-drop the folder. Settings:

- **Framework preset:** None
- **Build command:** *(leave empty)*
- **Build output directory:** `/`

`_headers` is applied automatically by Cloudflare Pages (security + long-cache for
`/css` and `/js`). No environment variables required.

---

## Responsiveness & accessibility

- Mobile-first; tested breakpoints at 375 / 768 / 1024 / 1440 px.
- Semantic HTML5, one `<h1>` per page, descriptive `alt` text, ARIA labels on controls.
- All motion respects `prefers-reduced-motion`.
- Placeholder imagery is hotlinked from Unsplash — swap for owned/licensed photos
  before or shortly after launch.

---

© 2026 Positive Legacy Solutions LLC.
