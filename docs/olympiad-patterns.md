# Olympiad reference analysis and implementation plan

## Sources inspected

Both local PDFs were read in full, including their rendered illustrations, answer
choices, syllabus pages, and answer keys: **50 questions across 13 PDF pages**.
Question numbers below refer to the printed questions, not PDF page numbers.

| Paper | Comparison questions | Number questions | Shape questions |
| --- | --- | --- | --- |
| `ref/CMO-Sample-Paper-for-Nursery.pdf` (7 pages) | 1 big fruit; 2 short building; 3 sitting cat; 4 tall tree; 5 closed door; 6 different flower; 7 small insect; 8 matching balloon; 21 tiny animal fits a cup; 22 long pencil | 9 count apples; 10 thirteen → numeral; 11 after 3 on stepping stones; 12 before 10 on a caterpillar; 13 count scattered bees; 14 after 14 on a train; 23 missing number on a vertical block tower; 24 jar containing an exact quantity | 15 circular treat; 16 square object; 17 triangular instrument; 18 rectangular object; 19 identify a flat circle; 20 name the sun's central shape; 25 triangular tent |
| `ref/CMO-Sample-Paper-for-Junior-KG.pdf` (6 pages) | 1 heavy animal; 2 empty jar; 3 small fruit; 4 different toy; 5 short object; 6 light object; 7 full glass; 8 exact balloon match including its pattern; 21 big box; 22 tall building | 9 after 19 on a number line; 10 before 30 in number boxes; 11 group with more balloons; 12 number less than 45; 13 equal biscuit quantities with a different arrangement; 14 numeral → number name; 23 written number → numeral; 24 Fifteen → numeral | 15 oval object; 16 heart balloon; 17 star cookie; 18 circular button; 19 rectangular item; 20 square frame; 25 triangular food |

## What the illustrations teach

- Children compare a visible property, rather than recall an isolated word.
  Big/small changes overall size; tall/short changes height on a shared baseline.
- Some pairs depict different familiar objects; others depict the same kind of
  object with a different property. Colour and answer position are incidental.
- Exact matching includes colour and decoration. Odd-one-out groups contain
  several identical members and one unmistakably different member.
- Full/empty pictures require visible contents. An intermediate fill level is
  a useful distractor, but must never also qualify as full or empty.
- Quantities appear in containers, rows, clusters, and scattered arrangements.
  Equal quantities can have different colours, objects, or spacing.
- Neighbouring numbers appear on stones, trains, number lines, and vertical
  towers. Towers must have an explicit reading direction.
- Shapes appear both as flat geometry and as the outlines of familiar objects.
  Decorations must not make the requested outline ambiguous.
- Achiever questions reuse the same concepts in a new setting. They do not
  require introducing arithmetic, time, fractions, or an unrelated topic.

## Syllabus decisions

The user's syllabus is authoritative. Numbers are **1–50**, names **one–twenty**,
and shapes **circle, square, triangle, rectangle, heart, star, oval**. The Junior
KG paper's Q23 uses “thirty seven” and an out-of-range distractor, 73; neither
is carried into the new name practice. Nursery Q22 tests length; this is adapted
to upright pencils under tall/short, rather than adding a separate length topic.
Open/close and sit/stand come from the Nursery paper. Greater-than, equal-to,
and several shape activities extend the observed mechanisms within the user's
explicit syllabus. No source illustration or question is copied into the bank.

## Pattern map

Each row below is a separately selectable pattern with **36 authored generator
variations**, split equally between Easy Practice, More Practice, and Think.
Learn is a visual lesson preceding those three practice levels.

| Concept | Pattern IDs | Reference basis |
| --- | --- | --- |
| Big and small | `size-big`, `size-small`, `size-fit` | Nursery 1, 7, 21; Junior KG 3, 21 |
| Tall and short | `height-tall`, `height-short` | Nursery 2, 4, 22; Junior KG 5, 22 |
| Heavy and light | `weight-heavy`, `weight-light` | Junior KG 1, 6; balance guidance makes weight visible |
| Full and empty | `fill-full`, `fill-empty` | Junior KG 2, 7 |
| Open and closed | `state-open`, `state-closed` | Nursery 5; reverse property extends it |
| Sit and stand | `posture-sit`, `posture-stand` | Nursery 3; reverse property extends it |
| Same and different | `same-match`, `different-object` | Nursery 6, 8; Junior KG 4, 8 |
| Numeral recognition | `number-identify` | Nursery 10; numeral matching extension within 1–50 |
| Counting | `number-count`, `number-build` | Nursery 9, 13, 24; build a group is a hands-on extension |
| Number and quantity | `quantity-match`, `quantity-more`, `quantity-less`, `quantity-equal`, `number-pairs` | Nursery 24; Junior KG 11, 13; less reverses more; pairs extends matching |
| Compare numbers | `number-greater`, `number-less`, `number-equal` | Junior KG 12; user's greater/equal syllabus |
| Before and after | `number-before`, `number-after`, `number-missing` | Nursery 11, 12, 14, 23; Junior KG 9, 10 |
| Number names | `name-to-number`, `number-to-name` | Nursery 10; Junior KG 14, 24 (Q23 mechanism restricted to 1–20) |
| Shapes | `shape-identify`, `shape-object`, `object-shape`, `shape-match`, `shape-different`, `shape-count`, `shape-pairs` | Nursery 15–20, 25; Junior KG 15–20, 25; matching/odd/count/pairs extend observed visual mechanisms |

This yields **38 patterns and 1,368 questions**, plus 14 visual lessons. Extra
activity types are deliberate syllabus extensions, not claims about additional
questions in the PDFs.

## Reusable architecture

- Retain the project's static HTML/CSS/JavaScript architecture and Fredoka theme.
- `olympiad.html`: a main section, topic picker, lessons, practice, and recap.
- `data/olympiad/catalog.json`: topics, concepts, lessons, and pattern metadata.
- `data/olympiad/{comparison,numbers,shapes}.json`: structured question banks.
- `assets/js/olympiad-visuals.js`: deterministic SVG illustrations, shape
  silhouettes, quantity arrangements, balances, and directional sequences.
- `assets/js/olympiad.js`: shared choice, pair-matching, and quantity-building
  interactions; shuffle; hints; retry; short sessions; saved learner progress.
- `scripts/olympiad_curriculum.py`: reproducible bank generation and semantic
  validation; content and answers are independent of the DOM renderer.

Answer keys use stable option IDs, so shuffling cannot change correctness.
Practice sessions shuffle unseen questions first, include 6 questions, and
save completion by learner name in a dedicated Olympiad storage namespace.
No timed exams, penalties, or forced advancement after an incorrect answer.

## Validation

Validate every generated question's meaning, not just its JSON fields: property
extrema, exact matching, odd-one-out uniqueness, numeric relations, counts,
shape outlines, number names, neighbours, pair targets, and builder quantities.
Also check option uniqueness, one correct answer, 36 unique variations per
pattern, bounds, all level coverage, and answer-position distribution.
Browser checks cover every visual/activity kind, retry, hints, keyboard/touch,
progress isolation, lesson navigation, and 320px/mobile/tablet/desktop layouts.
The application has no bundler or build step; static serving and browser checks
are the appropriate integration checks.

Completed checks: all 1,368 questions pass semantic validation; all 4,788 bank
visual entries parse and render as SVG/HTML; all 114 pattern/level combinations
accept the right answer and support another attempt after a wrong answer.
The integration script also checks all 14 lessons, complete sessions, unseen
question selection, name normalization, learner isolation, storage denial,
the existing Maths/JR-KG routes, and widths of 320, 390, 768 and 1,440 pixels.

Rectangles are described with two long and two short sides when a square may
appear nearby. Word-answer questions do not offer “rectangle” as an alternative
name for a square, avoiding ambiguity from the inclusive mathematical definition.
