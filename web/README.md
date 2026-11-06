# AuraOS web

A standalone Next.js App Router site for AuraOS. The original root `index.html` is preserved.

## Run locally

```sh
cd web
npm install
npm run dev
```

Open the address printed by Next.js. To use another port: `npm run dev -- --port 3100`.

## Production

```sh
npm run build
npm start
```

`npm run typecheck` checks TypeScript without emitting files.

## Structure

- `app/page.tsx` — route entry
- `components/home.tsx` — AuraOS content, menus, documentation search, clipboard actions, interactive product preview, FAQ, and walkthrough player
- `app/globals.css` — typography, responsive layout, transitions, scroll reveals, and reduced-motion behavior
- `public/fonts/` — the AWS Diatype, AWS Diatype Rounded Semi Mono, and Fragment Mono font files served by the reference site
- `public/media/aura-walkthrough.webm` — locally generated 14-second AuraOS illustrative workflow video

## Design and media

The visual reference is https://kiro.dev/: black background, rounded semi-monospace typography, violet actions, lilac product stage, overlapping terminal, alternating feature content, guide cards, questions, and a large closing panel. Fonts were obtained from the reference site's `/styles/fonts/` assets. The page does not embed Kiro scripts, tracking, product screenshots, or Kiro-branded demonstrations.

AuraOS artwork, the animated terminal, memory bitmap, technology tiles, and walkthrough are purpose-built illustrations. The page labels its demonstrations as illustrative; it does not boot a kernel or connect to an AI service. Source and setup links point to the real project. Desktop screenshot processing is described as cloud inference through Groq.

The page respects reduced-motion preferences. Video runs only after the visitor opens the walkthrough; terminal playback can be paused. Search opens with the search button or Command/Ctrl+K, and Escape closes the menus and dialogs.
