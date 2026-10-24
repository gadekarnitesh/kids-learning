# Adding learning content

Data is stored by class, then week, then activity type:
`data/jr/week-1/drag-drop/number-sequencing.json`.

To add a new section, copy a week folder inside both `data/jr/` and `data/sr/`, add its overview JSON, then add an entry in that class's `sections.json`. Set `enabled` to `true` when it should appear on the class landing page.

To add another activity, create a JSON file in the relevant `click-reveal`, `match-the-pair`, or `drag-drop` folder and add a matching entry in that week’s `activities.json` catalog. File names directly determine which JSON file the activity loads.

Learning and challenge files are deliberately separate: use `example.json` and `example-challenge.json`.

New activity folders follow the same rule: `sequence-ordering/`, `fill-in-the-blanks/`, and `games/`. Each sidebar `data-file` maps directly to `<file>.json` in its activity folder. A game JSON can set `durationSeconds`; if omitted, use the section's `defaultGameDurationSeconds` as the configured default. For colour games, configure `targetColor`, `colors`, `spawnDelayMs`, and `flyDurationMs`.

## Jr Advance activities

Advance is the final section in each Jr week's `activities.json`. Add an entry
with `"type": "advance"` and `"file": "your-file-name"`, then create
`data/jr/week-N/advance/your-file-name.json`.

The shared renderer shows two questions per page. Each question has exactly one
`"?"` in its `sequence`, an `answer`, and a list of `choices`. Numbers can be
stored as strings. All questions and choices are editable in JSON.

```json
{
  "title": "Addition · Missing Number",
  "instruction": "Drag the missing number to make the equation correct.",
  "presentation": "equation",
  "questionsPerPage": 2,
  "questions": [
    {"sequence": ["12", "+", "?", "=", "36"], "answer": "24", "choices": ["24", "25", "23"]},
    {"sequence": ["13", "+", "?", "=", "37"], "answer": "24", "choices": ["25", "23", "24"]}
  ]
}
```

Use `"presentation": "equation"` for arithmetic (operators are sequence items).
Use `"presentation": "sequence"` or omit it for comma-separated before, after,
and in-between questions, such as `["26", "?", "28"]`.

- Weeks 4–6: single-digit addition and subtraction.
- Weeks 7–12: two-digit addition and subtraction.
- Weeks 6–12: in-between numbers and alphabets, using curriculum ranges.
- Week 7 alphabet in-between includes W–X review alongside Y–Z because a
  three-letter sequence needs more than the two new letters.
- Weeks 8–12: missing-number addition and subtraction with two-digit operands.

### Word initials, number ordering, and vertical arithmetic

- Set `"highlightFirstLetter": true` in alphabet `match-the-pair` JSON to
  emphasize the initial letter in each word on the right. Other matching
  activities keep their usual text styling.
- Number Learning uses `"type": "numberorder"` with
  `sequence-ordering/drag-number-order.json`. Its `tasks` array contains
  `{ "sequence": ["16", "17", "18", "19", "20"], "choices": ["18", "19", "20", "16", "17"] }`.
  `sequence` defines the correct order; `choices` defines the draggable bank.
  Multiple tasks appear as rounds, used for the 1–50 review weeks.
- Arithmetic JSON can set `"layout": "vertical"` with
  `"presentation": "equation"` to show paper-style calculations in two columns.
  The existing `[first, operator, second, "=", result]` sequence is unchanged;
  replace any one operand or result with `"?"` for its dotted answer box.
- Week-boundary navigation reads enabled weeks, in order, from the class's
  `sections.json`. At the last activity, Next week opens the next enabled week;
  at the first activity, Previous week opens the previous week's last activity.

### Picture comparisons and shape matching

Weeks 8–12 have a `Compare Pictures` section backed by `picture-choice/*.json`.
Each question sets `prompt`, `answer` (a choice ID), optional `success` text,
and `choices: [{ "id": "big", "image": "assets/images/comparisons/big.svg", "alt": "Big ball" }, ...]`.
The entire picture is a selectable button. Correct choices receive a tick;
incorrect choices remain available to retry. The renderer shows two questions
per page and supports additional pages if you add questions.

Weeks 9–12 add `match-the-pair/shape-pairs.json` to Match & Connect. Matching
items may be plain strings or objects with `image`, `alt`, and optional `text`.
The existing `answers` mapping still connects left numeric keys to right letter
keys. All illustrations are local SVG files, so these activities do not depend
on an external image service.
