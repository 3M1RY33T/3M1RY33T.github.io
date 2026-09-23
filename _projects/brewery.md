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
accent: "#FBBF24"
accent_wash: "rgba(251,191,36,0.14)"
icon: "/assets/img/projects/brewery.png"
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
tabs:
  - id: overview
    label: Overview
    bands: [problem, capabilities]
    notes:
      - title: The graph is built once, then walked both ways
        body: >
          Both adjacency maps are built at load from a single
          "brew info --json=v2 --installed" call, so asking what depends on
          a package costs a dictionary hit rather than another shell out.
          Every entry is clickable, so the graph walks in either direction.
      - title: Nothing runs until you read it
        body: >
          Install, upgrade, uninstall and cleanup all stop at a sheet that
          prints the exact brew command. It is a rule of the app rather
          than a preference you can switch off.
      - title: Logic and interface are separate targets
        body: >
          The dependency graph and the JSON parsing live in a headless
          target, which is why the whole suite runs without launching any
          UI at all.
        evidence: 45 tests in 0.044s, no UI
  - id: look
    label: A look at it
    bands: [showcase]
  - id: measured
    label: Measured
    bands: [metrics]

metrics:
  - { label: Release, value: "v1.0.0", detail: "27 commits since 1 June" }
  - { label: Source, value: "5,499", detail: "lines of Swift, 32 files" }
  - { label: Tests, value: "45", detail: "defined, 820 lines" }
  - { label: Requires, value: "macOS", detail: "with Homebrew installed" }

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
  - image: /assets/img/brewery-browse-dark.png
    image_light: /assets/img/brewery-browse-light.png
    caption: "Browse: a Most Installed carousel, category tiles, and Top Charts drawn from Homebrew's install analytics."
    alt: "Brewery's Browse page: a Most Installed carousel with app icons, a grid of category tiles such as AI, Developer Tools and Security, and Top Charts for casks and formulae"
  - image: /assets/img/brewery-library-dark.png
    image_light: /assets/img/brewery-library-light.png
    caption: "Library: what is installed, outdated first, with dependents beside the Uninstall button."
    alt: "Brewery's Library page with cmake selected: installed casks as cards, formulae as a list with their pending versions, and a detail pane showing versions, tap, caveats, dependencies and dependents"
  - image: /assets/img/brewery-confirm-dark.png
    image_light: /assets/img/brewery-confirm-light.png
    caption: Every mutating command is shown in full and confirmed before it runs.
    alt: "A confirmation sheet titled Uninstall expat, showing the exact command brew uninstall expat with Cancel and Run Command buttons"
  - image: /assets/img/brewery-diagnostics-dark.png
    image_light: /assets/img/brewery-diagnostics-light.png
    caption: "Diagnostics: Homebrew's own health checks, plus the command log."
    alt: "Brewery's Diagnostics page showing Homebrew version and configuration above the command log"

post_match: [brewery]
---
