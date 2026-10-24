# Adding learning content

Data is stored by class, then week, then activity type:
`data/jr/week-1/drag-drop/number-sequencing.json`.

To add a new section, copy a week folder inside both `data/jr/` and `data/sr/`, add its overview JSON, then add an entry in that class's `sections.json`. Set `enabled` to `true` when it should appear on the class landing page.

To add another activity, create a JSON file in the relevant `click-reveal`, `match-the-pair`, or `drag-drop` folder and add a matching sidebar button in `activities.html`. File names directly determine which JSON file the activity loads.

Learning and challenge files are deliberately separate: use `example.json` and `example-challenge.json`.

New activity folders follow the same rule: `sequence-ordering/`, `fill-in-the-blanks/`, and `games/`. Each sidebar `data-file` maps directly to `<file>.json` in its activity folder. A game JSON can set `durationSeconds`; if omitted, use the section's `defaultGameDurationSeconds` as the configured default. For colour games, configure `targetColor`, `colors`, `spawnDelayMs`, and `flyDurationMs`.
