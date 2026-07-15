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
├── index.html          # Home (hero, services, process, team, client stories, blog preview)
├── about.html          # About / team / values
├── insurance.html      # Service detail
├── real-estate.html    # Service detail
├── tax-services.html   # Service detail
├── immigration.html    # Service detail (includes non-attorney disclaimer)
├── blog.html           # Blog listing (search + category filter, sidebar, pagination)
├── blog-single.html    # Full article + sidebar + prev/next + author box
├── faq.html            # FAQ grouped by service
├── contact.html        # 3 numbered info cards, Google Map, Web3Forms form
├── css/custom.css      # Color palette (CSS vars) + all animations/overrides
├── js/main.js          # All behavior (nav, sliders, counters, forms, blog filter, etc.)
├── favicon.svg         # "PLS" monogram with gold arrow motif
├── _headers            # Cloudflare Pages security + cache headers
└── README.md
```

**10 pages total.** The **header and footer markup is byte-identical across every page**
(verified via MD5 checksum). To change the nav/footer, edit it once in `index.html`,
then run your propagation script (a temporary `propagate.py` was used during the build:
it extracts the blocks between the `HEADER`/`END HEADER` and `FOOTER`/`END FOOTER`
marker comments in `index.html` and injects them into every other page). Every page
keeps those four marker comments so the blocks can be re-propagated any time.

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

## ⚠️ Placeholders to replace before launch

1. **Web3Forms access key** — get a free key at <https://web3forms.com>, then set
   `WEB3FORMS_ACCESS_KEY` at the top of `js/main.js`. It auto-fills the hidden
   `access_key` input on **both** the contact form and the footer newsletter form (the
   literal `YOUR_WEB3FORMS_ACCESS_KEY` in the markup is only a fallback).
2. **Email address** — replace `positivelegacysolutions@gmail.com` sitewide
   (`grep -r positivelegacysolutions@gmail.com`).
3. **Owner name** — set `OWNER_NAME` in `js/main.js`, or search-replace `Etienne` in
   `about.html`. (Body copy otherwise uses "The PLS Team".)
4. **Social media URLs** — replace the `#` placeholders on the footer social buttons
   (Facebook, Instagram, WhatsApp, X) and the team-card / blog share icons.
5. **Download files** — add real `PLS Services Brochure.pdf` (≈78 KB) and
   `New Client Checklist.pdf` (≈58 KB) and point the blog sidebar "Downloads" `#` links
   at them.
6. **Privacy Policy** — the footer "Privacy Policy" link is a `#` placeholder; add a
   `privacy.html` page (or external URL) when ready.

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
