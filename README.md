# Roman Urdu: learn Urdu in English letters

A small offline web app for learning Urdu written only in English letters (Roman Urdu), for example *love* = **mohabbat** and *remorse* = **nadaamat**.

**Online:** https://abh1shxk.github.io/roman-urdu/ opens in any browser, phones included.

## How to open it locally

Double-click **`index.html`**. There's nothing to install and no internet needed. Without internet the app falls back to system fonts.

## What's inside

| Screen | What it does |
|---|---|
| **Home** | Search box, today's goal, a word of the day and a pure Urdu word of the day, quick actions, and every category with progress |
| **Search** | Type an English word to get the Roman Urdu, or type Roman Urdu to get the English. Handles typos (beautifull) and spelling variants (mohabat). Shows pure Urdu synonyms and remembers recent searches. Press `/` anywhere to jump here. |
| **Everyday words** | 543 words and phrases in 16 categories. Filter by not started, learning, learned or saved. Tap a card for full details. |
| **Pure Urdu** | 163 literary (adabi) words of Persian and Arabic origin in 8 themes: Love & Longing, Sorrow & Regret, Nature & Sky, Soul & Faith, Poetry & Speech, Mind & Feeling, Character & Virtue, Time & Life. Each shows the everyday word it replaces (dukh → ranj), and many have an example sentence. |
| **Flashcards / Quiz** | Spaced-repetition flashcards, and quizzes in both directions with multiple choice or typed answers. Typed answers accept common spellings (bahut, bohat, bohot). Practise any category, the whole pure Urdu set, or your saved words. |
| **Sounds guide** | How the spellings map to sounds (aa / ee / oo, the two kinds of kh and gh, h for a puff of breath, curled t/d/r, nasal n, q), plus grammar basics |
| **Progress** | Streak, words learned, accuracy, the last 45 days of activity, progress by category, daily goal, and export / import / reset |

Tap the ☆ on any word to save it, then practise saved words from Flashcards or Quiz.

## Progress

Progress is saved in each browser (local storage). Use **Progress → Export progress** to back it up or move it to another device. The claude.ai version also syncs progress to the viewer's account.

## Updating the online version

Commit your changes and push to GitHub. GitHub Pages redeploys within a minute or two.

## Files

```
index.html            the app (open this)
css/style.css         theme tokens (light and dark), layout, shared components
css/views.css         styles for each screen
js/data-1..4.js       everyday vocabulary
js/data-5..6.js       pure (adabi) Urdu vocabulary
js/core.js            progress, spaced repetition, spelling-tolerant answer checking, dictionary search
js/ui.js              icons, word cards, word detail sheet
js/view-*.js          one file per screen
js/main.js            navigation and theme
```

To add words, append entries to a category in `js/data-*.js`:
`["roman", "english meaning", "sounds-like hint", "other|spellings", "optional note"]`. Pure Urdu entries also take an everyday equivalent and an `"example|translation"`.
