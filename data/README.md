# Adding learning content

## Olympiad

The main Olympiad section opens at `olympiad.html`, with a dedicated entry on
the home page and the existing learner profile flow. Its 14 lessons and 38
practice patterns are described in `olympiad/catalog.json`. Topic banks contain
1,368 questions (36 per pattern; 12 each at levels 2, 3 and 4).

The source and semantic validator are in `scripts/olympiad_curriculum.py`:

```sh
python3 scripts/olympiad_curriculum.py          # regenerate all four JSON files
python3 scripts/olympiad_curriculum.py --check  # validate without changing files
```

Change content in the generator, then regenerate. `assets/js/olympiad.js`
provides choice, matching-pairs and quantity-building activities;
`assets/js/olympiad-visuals.js` draws the shared SVG pictures. Stable option IDs
keep answers valid when options are shuffled. Practice prioritizes unexplored
questions and uses six activities per session. Named learners' progress is
saved separately from Maths in `kids-olympiad-progress:v1:<normalized name>`;
guest progress lasts for the browser tab's session. Storage failure does not
prevent practice. No server, build step or new runtime dependency is required.

The home page, topic cards, concepts, levels, and practice patterns show
**Not started / In progress / Completed** with completed/total counts.
Pattern counts follow the selected difficulty. Practice shows a cumulative
count that updates immediately after each correct answer. Opened questions
are recorded in `started`, so an unfinished activity remains In progress
after returning. Existing v1 answers and lessons are preserved. Repeating a
completed question never counts it twice. The learner name is normalized
without using age, and each name has a separate saved record.

See `docs/olympiad-patterns.md` for the complete reference-paper analysis,
question-to-pattern map and syllabus decisions.

Optional browser integration checks use Python Playwright and Chromium:

```sh
python3 -m http.server 8088
# In another terminal, with Playwright installed:
python3 scripts/verify_olympiad.py
python3 scripts/verify_olympiad_progress.py  # saved status, name isolation and live counts
```

`CHROMIUM_PATH` can point to an existing Chromium binary. Screenshots go to
`/tmp/kids-olympiad-verification` by default; `OLYMPIAD_ARTIFACTS` overrides it.

## Weekly activities

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

The shared renderer uses `questionsPerPage` (one or two, default two). Each question has exactly one
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

### Gradual picture learning and reports

The comparison progression is now incremental (superseding the earlier all-at-once
comparison setup): Week 8 big/small; Week 9 adds tall/short; Week 10 adds wide/narrow;
Week 11 adds heavy/light; Week 12 adds full/empty. Each concept has six questions
(three pages), with a new set of objects each week. See `jr/picture-progression.json`
for the plan; weekly `activities.json` catalogs and `picture-choice/*.json` are
what the UI loads. Images are local SVGs in `assets/images/learning-pictures/`.

Weeks 9–12 also register `shadow-shapes.json` and `shadow-pictures.json` under
Match & Connect, covering animals/birds, vehicles, nature, and mixed review.
Right-hand match items and answer banks are shuffled by `activity-utils.js`.
Choices remain stable within the current attempt; reopening or restarting gives
a new arrangement, while answer keys continue to refer to item IDs/values.

Tracking now records class, week and section separately for each activity.
The summary groups these records by section and shows each activity's week,
time and retries. Older session records without this metadata are retained under
“Earlier activities (section not recorded)” because their week cannot be recovered.

## Stable activity codes (Jr)

Every Jr weekly catalog entry has a permanent `code`, for example `JR-W09-001`:
JR = class, W09 = week, 001 = allocated identifier (not the current menu position).
Codes are shown in the activity menu, tablet heading, and new summary records.
Renaming or reordering activities must **not** change their codes.

Find the exact file to edit:

```sh
python3 scripts/activity_codes.py JR-W09-001
```

Or look up the code in `data/jr/activity-index.json`. Each entry includes its
section, label, mode, catalog file, content file, visibility, and direct URL:
`activities.html?class=jr&week=week-9&activity=JR-W09-001`.

- Change questions/options/images in the indexed `content` JSON.
- Change menu labels, section placement, or `enabled` in the indexed `catalog`.
- Content JSON has `activityCodes`, listing all entries using that file. Learn
  and Challenge have distinct codes but may share the same question file;
  editing that file affects both.
- To add an activity, create its content and add a catalog entry without a code,
  then run `python3 scripts/activity_codes.py --sync`. It allocates a new unused
  code and refreshes the lookup. Run `--sync` after edits so index titles stay current.
- Do not reuse deleted codes. The index retains counters and retired codes.
- Hidden activities retain their codes; `enabled: false` keeps them out of the UI.
- Jr menus now load their entries directly from weekly catalogs, including
  Alphabet Word Match and Find Same activities previously inserted by JavaScript.

## Maths course

`activities.html?class=maths` uses the same activity tablet, sidebar, footer,
and advance renderer as JR-KG. `maths.html` redirects to this shared page.
The catalog is `maths/operations/activities.json`; level questions live in
`maths/operations/advance/<topic>-level-<number>.json`.

There are 24 levels with 24 questions each. Level 1 shows two questions per
page; higher levels show one. `shuffleQuestions` randomizes question order,
answer choices are shuffled by the shared renderer, and `levelColor` sets
the level's accent. Division level 3 uses answers such as `9 R 1`, where R
means remainder. Topics and levels use the tablet footer; questions use
Previous/Next inside the activity, matching JR-KG navigation.

Edit the JSON directly, or regenerate the default question sets with
`python3 scripts/maths_curriculum.py` (this overwrites the Maths JSON files).

Maths progress is saved in `localStorage` under `kids-maths-progress:v2:`
for the normalized learner name only (case and repeated spaces are ignored).
Changing age does not create another Maths learner. Logging out removes the session
profile but preserves these saved answers in the same browser. The shared
advance renderer records only correct answers, identified by their sequence
and answer rather than their shuffled position. Reopening a level filters
out those answers and resumes the remembered unanswered question.

On first use, old `v1` name-and-age records for the same name are merged into
one `v2` record. Completed answers are combined without duplicates and the
most recent activity is resumed. Original records remain as backups; the
migration runs only if no valid name-based record exists, so restarting a
level does not bring old answers back.

The sidebar shows level names with completion ticks, and topics with compact
completed-level counts. The selected level's question count, such as `(2/24)`,
appears on the right of the tablet heading and updates
after each correct answer. Finished levels remain available for review, while automatic resume
and Previous/Next skip them. `Practice this level again` clears progress
for that level only. Other learners, other levels,
and JR/SR activities are unaffected. `questionCount` in the Maths catalog
must match the number of questions in each level JSON.

Completed level links use stronger green styling and a filled circular tick
beside the level label, including their selected and hover states.
Each operation/topic shows its completed level count; its heading turns green
with a tick only when every enabled level is complete. Progress labels use
only `(done/total)` for questions, levels and topics. There is no separate
overall progress panel or completed-level filter.
These statuses are derived from the saved answers and update immediately,
including when practicing a completed level again.
