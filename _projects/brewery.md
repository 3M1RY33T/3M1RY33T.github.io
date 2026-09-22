---
title: Brewery
tagline: A native Homebrew client that shows you what depends on what
summary: >
  A SwiftUI app for macOS. Browse the catalog like an app store, see the
  dependency graph before you uninstall anything, and confirm every
  mutating command in full before it runs.
problem: >
  brew uninstall tells you what you asked for, not what breaks. Brewery
  builds the dependent graph in memory from Homebrew's own JSON and puts
  "what breaks if this goes" directly beside the Uninstall button, which is
  the only place that answer is any use.
order: 5
date: 2026-06-01
status: active
stack: [Swift, SwiftUI, macOS]
platforms: [macOS]

links:
  github: https://github.com/3M1RY33T/brewery
  download: https://github.com/3M1RY33T/brewery/releases

install_note: >
  Brewery is not signed or notarized yet. On first launch macOS will refuse
  to open it: open it from Finder with Control-click, then Open, and confirm
  once. Homebrew itself must already be installed.

metrics_verified: 2026-09-22
metrics:
  - { label: Release, value: "v1.0.0" }
  - { label: Source, value: "5,499 lines Swift across 32 files" }
  - { label: Tests, value: "45 defined, 820 lines" }
  - { label: Requires, value: "macOS, with Homebrew installed" }

capabilities:
  - title: The catalog as shelves
    body: >
      Every official formula and cask laid out as category shelves with real
      app icons, ranked by Homebrew's own install analytics for the last
      year. Casks show the icon of the app they install; formulae and fonts
      get a glyph.
  - title: Dependents, not just dependencies
    body: >
      The graph is built in memory from Homebrew's JSON and traversed both
      ways, so the question that actually matters before an uninstall is
      answered on the same screen as the button that performs it.
  - title: Nothing runs unconfirmed
    body: >
      Every mutating command is shown in full and confirmed before it
      executes, and the command log is kept. An app that wraps a shell tool
      should never be vaguer about what it ran than the shell would be.
  - title: Still opens when the network does not
    body: >
      The catalog is cached locally, so a failed refresh degrades the data
      rather than the app. Diagnostics runs Homebrew's own health checks
      when you want them.

showcase_title: The three pages
showcase:
  - image: /assets/img/brewery-browse.png
    caption: "Browse: a Most Installed carousel, category tiles, and Top Charts drawn from Homebrew's install analytics."
    alt: Brewery's browse page showing a carousel and category tiles
  - image: /assets/img/brewery-library.png
    caption: "Library: what is installed, outdated first, with dependents beside the Uninstall button."
    alt: Brewery's library page listing installed packages
  - image: /assets/img/brewery-confirm.png
    caption: Every mutating command is shown in full and confirmed before it runs.
    alt: A confirmation sheet showing the exact brew command to be run
  - image: /assets/img/brewery-diagnostics.png
    caption: "Diagnostics: Homebrew's own health checks, plus the command log."
    alt: Brewery's diagnostics page showing health check results

post_match: [brewery]
---
