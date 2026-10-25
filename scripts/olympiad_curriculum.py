#!/usr/bin/env python3
"""Build and independently validate the static Olympiad curriculum.

Run: python3 scripts/olympiad_curriculum.py [--check]
No third-party packages or browser runtime are needed for the bank.
"""
import argparse
from collections import Counter
import json
from pathlib import Path
import random

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'data' / 'olympiad'
COLORS = ['#ed6688', '#587cdb', '#e6a62e', '#39a98a', '#9764ce', '#e98241']
SHAPES = ['circle', 'square', 'triangle', 'rectangle', 'heart', 'star', 'oval']
NAMES = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
         'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
         'seventeen', 'eighteen', 'nineteen', 'twenty']
OBJECTS = ['ball', 'apple', 'flower', 'tree', 'building', 'pencil', 'fish',
           'car', 'gift', 'kite', 'butterfly', 'bear']
COUNTERS = ['apple', 'fish', 'ball', 'flower', 'star', 'car', 'butterfly',
            'pear', 'strawberry', 'duck', 'bee', 'cookie', 'leaf', 'boat', 'cat', 'rocket']
ARRANGEMENTS = ['rows', 'scatter', 'ring', 'basket']
CONTEXTS = ['plain', 'cookie', 'balloon', 'frame', 'button', 'tile']
SUPPORTED_OBJECTS = set(OBJECTS + COUNTERS + [
    'elephant', 'feather', 'brick', 'balloon', 'rock', 'pumpkin', 'cotton',
    'watermelon', 'book', 'jar', 'glass', 'cup', 'bottle', 'door', 'window',
    'box', 'child', 'robot', 'candle'])


def obj(name='ball', color=COLORS[0], **props):
    return dict(kind='object', object=name, color=color, **props)


def num(value, style='card'):
    return dict(kind='number', value=value, style=style)


def word(value):
    return dict(kind='word', value=value)


def shape(name, color=COLORS[0], context='plain'):
    return dict(kind='shape', shape=name, color=color, context=context)


def group(count, item='apple', color=COLORS[0], layout='rows'):
    return dict(kind='quantity', count=count, item=item, color=color, layout=layout)


def series(values, layout='path'):
    return dict(kind='sequence', values=values, layout=layout)


def sequence_example(n=5):
    return series([n - 1, n, n + 1, n + 2])


def lesson(title, text, visuals, labels, tip):
    return dict(title=title, text=text, visuals=visuals, labels=labels, tip=tip)


CONCEPTS = [
    ('size', 'comparison', 'Big and Small', '🐘', [
        lesson('Look at the space it takes up', 'Big takes up more space. Small takes up less space.',
               [obj('ball', size=112), obj('ball', COLORS[1], size=48)], ['BIG', 'SMALL'], 'Look at the whole object.'),
        lesson('The words can look different', 'BIG, Big and big mean the same thing.',
               [obj('gift', COLORS[2], size=110), obj('gift', COLORS[3], size=45)], ['Big = BIG = big', 'Small = SMALL = small'], 'A small toy can fit through a small opening.')]),
    ('height', 'comparison', 'Tall and Short', '🌳', [
        lesson('Start at the same ground line', 'Tall reaches up higher. Short does not reach as high.',
               [obj('tree', COLORS[3], height=118), obj('tree', COLORS[3], height=55)], ['TALL', 'SHORT'], 'Look from the ground to the top.'),
        lesson('Try a different picture', 'Trees, buildings and upright pencils can be tall or short.',
               [obj('pencil', COLORS[2], height=60), obj('pencil', COLORS[4], height=120)], ['short', 'tall'], 'Colour does not tell you the height.')]),
    ('weight', 'comparison', 'Heavy and Light', '⚖️', [
        lesson('Watch the balance', 'The heavy side goes down. The light side goes up.',
               [dict(kind='balance', left=obj('rock', mass=9), right=obj('feather', mass=1))], ['HEAVY ↓                 LIGHT ↑'], 'A picture can look big and still be light.'),
        lesson('Use the balance to help', 'Follow the lower pan to find the heavier object.',
               [dict(kind='balance', left=obj('balloon', mass=1), right=obj('brick', mass=9))], ['LIGHT ↑                 HEAVY ↓'], 'Heavy = HEAVY. Light = LIGHT.')]),
    ('fill', 'comparison', 'Full and Empty', '🥛', [
        lesson('Look inside', 'Full has contents up to the top. Empty has nothing inside.',
               [obj('jar', fill=1), obj('jar', fill=0)], ['FULL', 'EMPTY'], 'A little bit inside is not empty.'),
        lesson('Some is different from full', 'This cup has some juice. The other cup is full.',
               [obj('glass', COLORS[2], fill=.4), obj('glass', COLORS[2], fill=1)], ['SOME', 'FULL'], 'Look for the fill line near the top.')]),
    ('state', 'comparison', 'Open and Closed', '🚪', [
        lesson('Can you see an opening?', 'Open leaves a space. Closed shuts the opening.',
               [obj('door', COLORS[2], state='open'), obj('door', COLORS[2], state='closed')], ['OPEN', 'CLOSED'], 'Look at the gap.'),
        lesson('Try a book', 'An open book shows its pages. A closed book has its cover shut.',
               [obj('book', COLORS[1], state='open'), obj('book', COLORS[4], state='closed')], ['open', 'closed'], 'Close is the action. Closed tells us how it looks now.')]),
    ('posture', 'comparison', 'Sit and Stand', '🧒', [
        lesson('Look at the legs', 'Sitting bends the legs on a seat. Standing has straight legs on the ground.',
               [obj('child', posture='sit'), obj('child', COLORS[1], posture='stand')], ['SIT / SITTING', 'STAND / STANDING'], 'Find the seat and the bent knees.')]),
    ('same', 'comparison', 'Same and Different', '🦋', [
        lesson('Look at every detail', 'Same pictures match in shape, colour and pattern.',
               [obj('ball', COLORS[1], decoration='dots'), obj('ball', COLORS[1], decoration='dots'), obj('ball', COLORS[0], decoration='stripe')], ['SAME', 'SAME', 'DIFFERENT'], 'Check the colour and the decoration.'),
        lesson('Find the one that does not match', 'Three pictures match. One picture is different.',
               [dict(kind='collection', items=[obj('fish'), obj('fish'), obj('flower'), obj('fish')])], ['The flower is different.'], 'Look for the picture that appears only once.')]),
    ('numerals', 'numbers', 'Numbers 1–50', '🔢', [
        lesson('Look at each digit', 'Match the number, even on a different card.',
               [num(24, 'screen'), num(24, 'star')], ['24', '24'], 'Read a two-digit number from left to right.'),
        lesson('Numbers keep their meaning', 'Colour and decoration do not change the number.',
               [num(7, 'star'), num(19, 'screen'), num(50)], ['7', '19', '50'], 'Take your time to look at both digits.')]),
    ('counting', 'numbers', 'Count and Build', '🍎', [
        lesson('Touch each picture once', 'Count: one, two, three, four. There are 4 apples.',
               [group(4), num(4)], ['1 · 2 · 3 · 4', '4'], 'Tap pictures during practice to help you keep track.'),
        lesson('Make your own group', 'Add one picture at a time. Stop when the group has 5.',
               [group(5, 'fish', COLORS[1]), num(5)], ['5 fish', '5'], 'You can take one away if you add too many.')]),
    ('quantity', 'numbers', 'Groups and Quantities', '🧺', [
        lesson('More, fewer, or the same?', 'Count each group. More has a bigger count.',
               [group(3, 'flower'), group(6, 'flower')], ['3 · FEWER', '6 · MORE'], 'The size of each picture does not change how many there are.'),
        lesson('Different arrangements, same count', 'Both groups have 4. Their quantities are equal.',
               [group(4, 'ball', COLORS[1], 'ring'), group(4, 'ball', COLORS[2], 'rows')], ['4', '4'], 'Equal means the same number of things.')]),
    ('compare', 'numbers', 'Greater, Less and Equal', '⚖️', [
        lesson('Compare the counts', '6 is greater than 3. 3 is less than 6.',
               [group(6, 'apple'), group(3, 'apple')], ['6 > 3', '3 < 6'], 'The open mouth of > or < points at the greater number.'),
        lesson('Equal means the same', 'Both sides have the same value.',
               [num(12), num(12, 'screen')], ['12', '= 12'], 'Matching numbers are equal, even on different cards.')]),
    ('neighbours', 'numbers', 'Before and After', '🚂', [
        lesson('Follow the counting path', 'Before 5 is 4. After 5 is 6.',
               [sequence_example(5)], ['4 → 5 → 6 → 7'], 'Before is one step back. After is one step forward.'),
        lesson('Find the missing block', 'Count from the bottom up: 16, 17, 18, 19.',
               [series([16, 17, '?', 19], 'tower')], ['The missing block is 18.'], 'The arrow shows which way to count.')]),
    ('names', 'numbers', 'Number Names 1–20', '💬', [
        lesson('A number has a word name', 'The numeral 12 and the word twelve mean the same amount.',
               [num(12), word('twelve'), group(12, 'ball', COLORS[1])], ['12', 'twelve', '12 balls'], 'Say the word and count the pictures.'),
        lesson('Capital letters keep the same name', 'FIVE, Five and five all mean 5.',
               [word('FIVE'), word('Five'), word('five')], ['5', '5', '5'], 'Practice uses names from one through twenty.')]),
    ('shapes', 'shapes', 'Shape Explorers', '🔺', [
        lesson('Meet the shapes', 'Look at the outline of each shape.',
               [shape(s, COLORS[i % 6]) for i, s in enumerate(SHAPES)], [s.title() for s in SHAPES], 'A circle is round. An oval is stretched.'),
        lesson('Shapes hide in everyday things', 'A cookie, a frame, or a balloon can have a shape you know.',
               [shape('star', COLORS[2], 'cookie'), shape('square', COLORS[1], 'frame'), shape('heart', COLORS[0], 'balloon')], ['STAR', 'SQUARE', 'HEART'], 'Look at the outside edge, then match the shape.')]),
]

PATTERNS = []


def register(pid, concept, label, source):
    PATTERNS.append(dict(id=pid, concept=concept, label=label, source=source, count=36))


for pid, concept, label, source in [
    ('size-big', 'size', 'Find the bigger picture', 'Nursery 1; Junior KG 21'),
    ('size-small', 'size', 'Find the smaller picture', 'Nursery 7; Junior KG 3'),
    ('size-fit', 'size', 'What fits through the opening?', 'Nursery 21'),
    ('height-tall', 'height', 'Find the taller object', 'Nursery 4; Junior KG 22'),
    ('height-short', 'height', 'Find the shorter object', 'Nursery 2, 22; Junior KG 5'),
    ('weight-heavy', 'weight', 'Find the heavier object', 'Junior KG 1'),
    ('weight-light', 'weight', 'Find the lighter object', 'Junior KG 6'),
    ('fill-full', 'fill', 'Find the full container', 'Junior KG 7'),
    ('fill-empty', 'fill', 'Find the empty container', 'Junior KG 2'),
    ('state-open', 'state', 'Find what is open', 'Nursery 5, reverse property'),
    ('state-closed', 'state', 'Find what is closed', 'Nursery 5'),
    ('posture-sit', 'posture', 'Find who is sitting', 'Nursery 3'),
    ('posture-stand', 'posture', 'Find who is standing', 'Nursery 3, reverse property'),
    ('same-match', 'same', 'Match every detail', 'Nursery 8; Junior KG 8'),
    ('different-object', 'same', 'Find the different picture', 'Nursery 6; Junior KG 4'),
    ('number-identify', 'numerals', 'Match the number card', 'Nursery 10, numeral recognition extension'),
    ('number-count', 'counting', 'Count the pictures', 'Nursery 9, 13'),
    ('number-build', 'counting', 'Build a group', 'Nursery 24, hands-on extension'),
    ('quantity-match', 'quantity', 'Match a number to a group', 'Nursery 24'),
    ('quantity-more', 'quantity', 'Find the group with more', 'Junior KG 11'),
    ('quantity-less', 'quantity', 'Find the group with fewer', 'Junior KG 11, reverse property'),
    ('quantity-equal', 'quantity', 'Find the equal group', 'Junior KG 13'),
    ('number-pairs', 'quantity', 'Pair numbers and quantities', 'Junior KG 13, matching extension'),
    ('number-greater', 'compare', 'Choose greater than', 'Junior KG 12; syllabus extension'),
    ('number-less', 'compare', 'Choose less than', 'Junior KG 12'),
    ('number-equal', 'compare', 'Choose equal to', 'Junior KG 13; syllabus extension'),
    ('number-before', 'neighbours', 'What comes before?', 'Nursery 12; Junior KG 10'),
    ('number-after', 'neighbours', 'What comes after?', 'Nursery 11, 14; Junior KG 9'),
    ('number-missing', 'neighbours', 'Fill the missing block', 'Nursery 23'),
    ('name-to-number', 'names', 'Match a word to a number', 'Nursery 10; Junior KG 24'),
    ('number-to-name', 'names', 'Match a number to a word', 'Junior KG 14'),
    ('shape-identify', 'shapes', 'Find the named shape', 'Nursery 19'),
    ('shape-object', 'shapes', 'Find a shape in an object', 'Nursery 15–18, 25; Junior KG 15–20, 25'),
    ('object-shape', 'shapes', 'Name an object’s shape', 'Nursery 20'),
    ('shape-match', 'shapes', 'Match shape outlines', 'Nursery 8, matching mechanism extension'),
    ('shape-different', 'shapes', 'Find the different shape', 'Nursery 6, odd-one-out mechanism extension'),
    ('shape-count', 'shapes', 'Count one kind of shape', 'Nursery 9, counting mechanism extension'),
    ('shape-pairs', 'shapes', 'Pair shapes and objects', 'Nursery 15–20; matching extension'),
]:
    register(pid, concept, label, source)


def form(text, level):
    return text.upper() if level == 3 else text.title() if level == 4 else text.lower()


def numeric_options(answer, count, rng, low=1, high=50):
    pool = [n for n in range(max(low, answer - 6), min(high, answer + 6) + 1) if n != answer]
    rng.shuffle(pool)
    return [num(answer)] + [num(n, ['card', 'star', 'screen'][i % 3]) for i, n in enumerate(pool[:count - 1])]


def question(pattern, i):
    pid, concept = pattern['id'], pattern['concept']
    level = 2 + i // 12
    rng = random.Random(f'{pid}:{i}:v1')
    color, other = COLORS[(i + i // 6) % 6], COLORS[(i + i // 6 + 2) % 6]
    k = 2 if level == 2 else 3 if level == 3 else 4
    item = OBJECTS[i % len(OBJECTS)]
    counter = COUNTERS[i % len(COUNTERS)]
    layout = ARRANGEMENTS[(i // 3) % 4]
    instruction = pattern['label']
    q = dict(id=f'{pid}-{i + 1:02}', topic=next(c[1] for c in CONCEPTS if c[0] == concept),
             concept=concept, pattern=pid, difficulty=level, activity='choice',
             instruction=instruction, visuals=[], hint='', explanation='')
    options = []
    answer_index = 0
    if pid.startswith('size-'):
        sizes = [42, 112] if k == 2 else [38, 75, 115] if k == 3 else [32, 58, 85, 116]
        if pid == 'size-fit':
            sizes = [36, 108] if k == 2 else [32, 88, 116] if k == 3 else [28, 86, 102, 120]
        options = [obj(item, COLORS[(i + j) % 6], size=s) for j, s in enumerate(sizes)]
        if pid == 'size-big':
            answer_index = len(sizes) - 1
            q.update(question=f'{["Which picture is", "Tap the", "Find the"][i % 3]} {form("biggest" if k > 2 else "bigger", level)}?', rule='max-size')
        elif pid == 'size-small':
            q.update(question=f'{["Which picture is", "Touch the", "Find the"][i % 3]} {form("smallest" if k > 2 else "smaller", level)}?', rule='min-size')
        else:
            q.update(question='Which toy fits through this opening?', rule='fits', opening=50,
                     visuals=[dict(kind='opening', width=50, height=50)])
        q.update(hint='Look at the whole picture. Compare the space each one takes up.',
                 explanation='The larger picture takes up more space. The smaller picture takes up less space.' if pid != 'size-fit' else 'Only this small toy is narrower and shorter than the opening.')
    elif pid.startswith('height-'):
        item = ['tree', 'building', 'pencil', 'flower', 'candle', 'bottle'][i % 6]
        heights = [52, 119] if k == 2 else [45, 80, 119] if k == 3 else [34, 60, 88, 120]
        options = [obj(item, COLORS[(i + j + i // 6) % 6], height=h) for j, h in enumerate(heights)]
        tall = pid == 'height-tall'
        answer_index = len(options) - 1 if tall else 0
        q.update(question=f'Find the {form(("tallest" if k > 2 else "taller") if tall else ("shortest" if k > 2 else "shorter"), level)} {item}.',
                 rule='max-height' if tall else 'min-height', hint='Start at the ground line and look up to the top.',
                 explanation='The tallest reaches highest above the ground. The shortest reaches the least high.')
    elif pid.startswith('weight-'):
        heavy, light = [('elephant', 'feather'), ('brick', 'balloon'), ('rock', 'leaf'), ('pumpkin', 'cotton'), ('watermelon', 'pencil'), ('book', 'butterfly')][i % 6]
        options = [obj(heavy, color, mass=9), obj(light, other, mass=1)]
        left, right = options if i % 2 else options[::-1]
        wants_heavy = pid == 'weight-heavy'
        answer_index = 0 if wants_heavy else 1
        q.update(question=f'Which object is {form("heavier" if wants_heavy else "lighter", level)}?',
                 rule='max-mass' if wants_heavy else 'min-mass', visuals=[dict(kind='balance', left=left, right=right)],
                 hint='The heavy pan goes down. The light pan goes up.',
                 explanation=f'The {heavy} is heavier: its pan is lower. The {light} is lighter: its pan is higher.')
    elif pid.startswith('fill-'):
        item = ['jar', 'glass', 'cup', 'bottle'][i % 4]
        fills = [0, 1] if k == 2 else [0, .45, 1] if k == 3 else [0, .25, .65, 1]
        options = [obj(item, color, fill=f) for f in fills]
        full = pid == 'fill-full'
        answer_index = len(options) - 1 if full else 0
        q.update(question=f'Tap the {form("full" if full else "empty", level)} {item}.', rule='full' if full else 'empty',
                 hint='Look inside each container, all the way to the top.',
                 explanation='Full has contents up to the top.' if full else 'Empty has no contents inside.')
    elif pid.startswith('state-'):
        item = ['door', 'window', 'book', 'box'][i % 4]
        options = [obj(item, color, state='open'), obj(item, color, state='closed')]
        wants_open = pid == 'state-open'
        answer_index = 0 if wants_open else 1
        q.update(question=f'Which {item} is {form("open" if wants_open else "closed", level)}?',
                 rule='state', target='open' if wants_open else 'closed', hint='Find the opening or the shut cover.',
                 explanation='Open leaves a gap or shows the inside.' if wants_open else 'Closed shuts the opening or cover.')
    elif pid.startswith('posture-'):
        item = ['child', 'robot', 'bear', 'cat'][i % 4]
        options = [obj(item, color, posture='sit'), obj(item, color, posture='stand')]
        sit = pid == 'posture-sit'
        answer_index = 0 if sit else 1
        q.update(question=f'Who is {form("sitting" if sit else "standing", level)}?', rule='posture', target='sit' if sit else 'stand',
                 hint='Look for a seat and bent legs, or straight legs on the ground.',
                 explanation='Sitting rests on a seat with bent knees.' if sit else 'Standing has straight legs and feet on the ground.')
    elif pid == 'same-match':
        target = obj(item, color, decoration='dots' if i % 2 else 'stripe')
        options = [target, obj(item, other, decoration=target['decoration'])]
        if k >= 3:
            options.append(obj(item, color, decoration='stripe' if i % 2 else 'dots'))
        if k == 4:
            options.append(obj(OBJECTS[(i + 1) % 12], color, decoration=target['decoration']))
        q.update(question=f'Find the picture that is {form("exactly the same", level)}.', rule='same', target=target, visuals=[target],
                 hint='Match the object, its colour, and the little decoration.', explanation='All the details match, even the colour and decoration.')
    elif pid in ('different-object', 'shape-different'):
        base = obj(item, color) if pid == 'different-object' else shape(SHAPES[i % 7], color)
        different = obj(OBJECTS[(i + 1) % 12], color) if pid == 'different-object' else shape(SHAPES[(i + 1) % 7], color)
        # Repeated pictures stay on the board; every answer option is a unique kind.
        items = [base, base, base, different]
        rng.shuffle(items)
        options = [base, different]
        answer_index = 1
        q.update(question=f'Tap the kind that is {form("different", level)}.', rule='odd', visuals=[dict(kind='collection', items=items)],
                 hint='One kind of picture appears only once. The other kind appears three times.', explanation='This is the only one of its kind in the group.')
    elif pid == 'number-identify':
        n = (i * 7) % 50 + 1
        options = numeric_options(n, k, rng)
        q.update(question='Match the number on the screen.', rule='number-value', target=n, visuals=[num(n, 'screen')],
                 hint='Look at each digit from left to right.', explanation=f'Both cards show {n}. The card design does not change the number.')
    elif pid in ('number-count', 'number-build'):
        n = 1 + i % (8 if level == 2 else 14 if level == 3 else 20)
        if pid == 'number-build':
            q.update(activity='build', question=f'Make a group of {n}.', rule='build', target=n,
                     item=counter, color=color, layout=layout, visuals=[num(n)],
                     hint=f'Add one at a time and count up to {n}.', explanation=f'You made exactly {n}! Each picture counts once.')
        else:
            options = numeric_options(n, k, rng, high=20)
            q.update(question='How many pictures can you count?', rule='count', visuals=[group(n, counter, color, layout)],
                     hint='Tap each picture once to mark it as counted.', explanation=f'There are {n} pictures. Count each one once.')
    elif pid in ('quantity-match', 'quantity-more', 'quantity-less', 'quantity-equal'):
        n = 2 + (i * 3) % 15
        counts = [n, n + 2] if k == 2 else [n, n + 1, n + 3] if k == 3 else [n, n + 1, n + 2, n + 4]
        options = [group(c, counter, COLORS[(i + j) % 6], ARRANGEMENTS[(i + j) % 4]) for j, c in enumerate(counts)]
        if pid == 'quantity-match':
            q.update(question=f'Which group has {n} pictures?', rule='quantity-target', target=n, visuals=[num(n)])
        elif pid == 'quantity-equal':
            q.update(question='Which group has the SAME number of pictures?', rule='quantity-target', target=n,
                     visuals=[group(n, COUNTERS[(i + 3) % 16], other, ARRANGEMENTS[(i + 2) % 4])])
        else:
            more = pid == 'quantity-more'
            answer_index = len(options) - 1 if more else 0
            q.update(question=f'Which group has {form(("the most" if k > 2 else "more") if more else ("the fewest" if k > 2 else "fewer"), level)}?', rule='max-count' if more else 'min-count')
        q.update(hint='Count each group. Ignore the colours and the space between pictures.',
                 explanation=f'This group has {options[answer_index]["count"]} pictures. The arrangement does not change the count.')
    elif pid in ('number-pairs', 'shape-pairs'):
        if pid == 'number-pairs':
            counts = rng.sample(range(1, 11 if level == 2 else 16 if level == 3 else 21), 3)
            pairs = [dict(id=f'p{j}', left=num(n), right=group(n, COUNTERS[(i + j) % 16], COLORS[(i + j) % 6], layout)) for j, n in enumerate(counts)]
        else:
            names = [SHAPES[(i + j) % 7] for j in range(3)]
            pairs = [dict(id=f'p{j}', left=shape(s, color), right=shape(s, COLORS[(i + j + 2) % 6], CONTEXTS[1 + (i + j) % 5])) for j, s in enumerate(names)]
        q.update(activity='pairs', question='Tap one on the left. Then tap its partner on the right.', rule='pairs', pairs=pairs,
                 hint='Match the count.' if pid == 'number-pairs' else 'Match the outside outline. Colours can change.',
                 explanation='Every pair has the same quantity.' if pid == 'number-pairs' else 'Every pair has the same shape outline.')
    elif pid in ('number-greater', 'number-less', 'number-equal'):
        target = 5 + (i * 7) % 40
        if pid == 'number-greater':
            values = [target + 1 + i % (50 - target)] + rng.sample(range(1, target + 1), k - 1)
            relation, symbol = 'greater', '>'
        elif pid == 'number-less':
            values = [1 + i % (target - 1)] + rng.sample(range(target, 51), k - 1)
            relation, symbol = 'less', '<'
        else:
            values = [target] + rng.sample([n for n in range(1, 51) if n != target], k - 1)
            relation, symbol = 'equal', '='
        options = [num(n) for n in values]
        q.update(question=f'Which number is {form(relation + " than" if relation != "equal" else "equal to", level)} {target}?',
                 rule=relation, target=target, visuals=[num(target, 'screen')],
                 hint='Greater means a bigger number. Less means a smaller number. Equal means the same number.',
                 explanation=f'{values[0]} {symbol} {target}. {values[0]} is {relation + " than" if relation != "equal" else "equal to"} {target}.')
    elif pid in ('number-before', 'number-after', 'number-missing'):
        if pid == 'number-missing':
            start = 1 + (i * 5) % 47
            values = list(range(start, start + 4))
            missing = 1 + i % 2
            answer = values[missing]
            values[missing] = '?'
            arrangement = ['tower', 'train', 'path'][i % 3]
            q.update(question='Which number fills the empty place?', rule='missing', visuals=[series(values, arrangement)])
        else:
            before = pid == 'number-before'
            target = 2 + (i * 7) % 49 if before else 1 + (i * 7) % 49
            answer = target - 1 if before else target + 1
            values = ['?', target] if before else [target, '?']
            q.update(question=f'What comes {form("just before" if before else "just after", level)} {target}?',
                     rule='before' if before else 'after', target=target, visuals=[series(values, ['path', 'train', 'tower'][i % 3])])
        options = numeric_options(answer, k, rng)
        q.update(hint='Follow the arrow. Count one step at a time.', explanation=f'The missing number is {answer}. The numbers go up by one in the arrow’s direction.')
    elif pid in ('name-to-number', 'number-to-name'):
        n = 1 + (i * 7) % 20
        name = form(NAMES[n - 1], level)
        if pid == 'name-to-number':
            options = numeric_options(n, k, rng, high=20)
            q.update(question='Which number matches this word?', rule='name-number', target=n, visuals=[word(name)])
        else:
            candidates = [n] + rng.sample([v for v in range(1, 21) if v != n], k - 1)
            options = [word(form(NAMES[v - 1], level)) for v in candidates]
            q.update(question='Which word names this number?', rule='number-name', target=n, visuals=[num(n, 'screen')])
        q.update(hint=f'Count the helper pictures to find the name: {name}.',
                 helper=group(n, counter, color, layout), explanation=f'{n} = {name}. They name the same amount.')
    elif pid.startswith('shape-') or pid == 'object-shape':
        target = SHAPES[i % 7]
        # Avoid the inclusive square/rectangle classification in word answers.
        excluded = {target}
        if pid == 'object-shape' and target in ('square', 'rectangle'):
            excluded.update({'square', 'rectangle'})
        candidates = [target] + rng.sample([s for s in SHAPES if s not in excluded], k - 1)
        if pid == 'shape-count':
            n = 1 + i % 7
            items = [shape(target, COLORS[j % 6]) for j in range(n)] + [shape(s, other) for s in candidates[1:]]
            rng.shuffle(items)
            options = numeric_options(n, k, rng, high=20)
            count_prompt = f'How many {form(target, level)} shapes are in the picture?' if target != 'rectangle' else 'Count rectangles with two long and two short sides.'
            q.update(question=count_prompt, rule='shape-count', target=target,
                     visuals=[dict(kind='collection', items=items)], explanation=f'There are {n} {target} shapes. Count only the requested outline.')
        elif pid == 'object-shape':
            options = [word(form(s, level)) for s in candidates]
            q.update(question='What is the shape of this object’s outline?', rule='shape-name', target=target,
                     visuals=[shape(target, color, CONTEXTS[1 + i % 5])], explanation=f'The outside outline is a {target}.')
        else:
            context = CONTEXTS[1 + i % 5] if pid == 'shape-object' else 'plain'
            options = [shape(s, COLORS[(i + j) % 6], context) for j, s in enumerate(candidates)]
            if pid == 'shape-match':
                q.update(question='Match this outline. Its colour can change.', rule='shape-target', target=target,
                         visuals=[shape(target, other, CONTEXTS[1 + i % 5])])
            else:
                prompt = f'Find the {form(target, level)}' + ('-shaped object.' if pid == 'shape-object' else '.')
                if target == 'rectangle':
                    prompt = 'Find the rectangle with two long and two short sides.'
                q.update(question=prompt, rule='shape-target', target=target)
            q['explanation'] = f'This outline is a {target}. Its colour or decoration does not change the shape.'
        q['hint'] = {'circle': 'A circle is round, with no corners.', 'square': 'A square has four equal sides.',
                     'triangle': 'A triangle has three straight sides.', 'rectangle': 'Look for four corners and two long sides.',
                     'heart': 'A heart has two round bumps and a point below.', 'star': 'A star has five points.',
                     'oval': 'An oval is stretched and round, with no corners.'}[target]
    else:
        raise ValueError(pid)
    if options:
        q['options'] = [dict(id=f'o{j}', visual=v) for j, v in enumerate(options)]
        q['answer'] = f'o{answer_index}'
        rng.shuffle(q['options'])
    return q


def signature(v):
    """Visual identity excludes presentation-only numeric card styling."""
    return json.dumps({k: val for k, val in v.items() if k != 'style'}, sort_keys=True)


def is_correct(q, v):
    r = q['rule']
    options = [o['visual'] for o in q.get('options', [])]
    extrema = {'max-size': ('size', max), 'min-size': ('size', min),
               'max-height': ('height', max), 'min-height': ('height', min),
               'max-mass': ('mass', max), 'min-mass': ('mass', min),
               'max-count': ('count', max), 'min-count': ('count', min)}
    if r in extrema:
        key, fn = extrema[r]
        return v[key] == fn(o[key] for o in options)
    if r == 'fits':
        return v['size'] <= q['opening']
    if r in ('full', 'empty'):
        return v['fill'] == (1 if r == 'full' else 0)
    if r in ('state', 'posture'):
        return v[r] == q['target']
    if r == 'same':
        return signature(v) == signature(q['target'])
    if r == 'odd':
        frequencies = Counter(signature(x) for x in q['visuals'][0]['items'])
        return frequencies[signature(v)] == 1
    if r in ('number-value', 'name-number', 'equal'):
        return v['value'] == q['target']
    if r == 'count':
        return v['value'] == q['visuals'][0]['count']
    if r == 'quantity-target':
        return v['count'] == q['target']
    if r == 'greater':
        return v['value'] > q['target']
    if r == 'less':
        return v['value'] < q['target']
    if r == 'before':
        return v['value'] == q['target'] - 1
    if r == 'after':
        return v['value'] == q['target'] + 1
    if r == 'missing':
        values = q['visuals'][0]['values']
        idx = values.index('?')
        return v['value'] == values[idx - 1] + 1 == values[idx + 1] - 1
    if r == 'number-name':
        return v['value'].lower() == NAMES[q['target'] - 1]
    if r == 'shape-count':
        return v['value'] == sum(x['shape'] == q['target'] for x in q['visuals'][0]['items'])
    if r == 'shape-name':
        return v['value'].lower() == q['target']
    if r == 'shape-target':
        return v['shape'] == q['target']
    raise ValueError(r)


def walk_visual(v):
    yield v
    for key in ('left', 'right'):
        if isinstance(v.get(key), dict):
            yield from walk_visual(v[key])
    for item in v.get('items', []):
        yield from walk_visual(item)


def validate(catalog, banks):
    assert len(catalog['patterns']) == 38
    all_q = [q for bank in banks.values() for q in bank['questions']]
    assert len({q['id'] for q in all_q}) == len(all_q) == 1368
    levels, positions = Counter(), Counter()
    for pattern in catalog['patterns']:
        subset = [q for q in all_q if q['pattern'] == pattern['id']]
        assert len(subset) == pattern['count'] == 36, pattern['id']
        assert Counter(q['difficulty'] for q in subset) == {2: 12, 3: 12, 4: 12}
        # Semantic/presentation signatures exclude IDs, prose, answer order, and explanations.
        fingerprints = [json.dumps([q['difficulty'], q.get('target'), q['visuals'],
                         sorted((signature(o['visual']) for o in q.get('options', []))),
                         q.get('pairs'), q.get('item'), q.get('color'), q.get('layout')], sort_keys=True) for q in subset]
        assert len(set(fingerprints)) == 36, ('duplicate', pattern['id'])
    for q in all_q:
        tag = q['id']
        assert all(q.get(k) for k in ('question', 'hint', 'explanation', 'concept', 'pattern')), tag
        visuals = list(q['visuals']) + ([q['helper']] if 'helper' in q else [])
        if q['activity'] == 'choice':
            options = q['options']
            assert 2 <= len(options) <= 4, tag
            assert len({o['id'] for o in options}) == len(options), tag
            assert len({signature(o['visual']) for o in options}) == len(options), tag
            valid = [o['id'] for o in options if is_correct(q, o['visual'])]
            assert valid == [q['answer']], (tag, valid)
            positions[next(i for i, o in enumerate(options) if o['id'] == q['answer'])] += 1
            visuals.extend(o['visual'] for o in options)
        elif q['activity'] == 'build':
            assert 1 <= q['target'] <= 20 and q['item'] in COUNTERS, tag
        elif q['activity'] == 'pairs':
            pairs = q['pairs']
            assert len({p['id'] for p in pairs}) == 3, tag
            assert len({signature(p['left']) for p in pairs}) == 3, tag
            for p in pairs:
                l, r = p['left'], p['right']
                assert l.get('value') == r['count'] if r['kind'] == 'quantity' else l['shape'] == r['shape'], tag
                visuals.extend([l, r])
        else:
            raise AssertionError(tag)
        if q['rule'] == 'name-number':
            assert q['visuals'][0]['value'].lower() == NAMES[q['target'] - 1], tag
        if q['rule'] == 'shape-name':
            assert q['visuals'][0]['shape'] == q['target'], tag
        if q['rule'] == 'quantity-target' and q['visuals'][0]['kind'] == 'quantity':
            assert q['target'] == q['visuals'][0]['count'], tag
        if q['rule'] in ('before', 'after'):
            values = q['visuals'][0]['values']
            assert values == (['?', q['target']] if q['rule'] == 'before' else [q['target'], '?']), tag
        if q['rule'] in ('max-mass', 'min-mass'):
            scale = q['visuals'][0]
            assert sorted(v['mass'] for v in (scale['left'], scale['right'])) == [1, 9], tag
        for root_v in visuals:
            for v in walk_visual(root_v):
                if v['kind'] == 'number':
                    assert type(v['value']) is int and 1 <= v['value'] <= 50, tag
                if v['kind'] == 'word' and q['concept'] == 'names':
                    assert v['value'].lower() in NAMES, tag
                if v['kind'] == 'quantity':
                    assert 1 <= v['count'] <= 20 and v['item'] in COUNTERS, tag
                if v['kind'] == 'shape':
                    assert v['shape'] in SHAPES, tag
                if v['kind'] == 'sequence':
                    assert v['values'].count('?') <= 1, tag
                    assert all(x == '?' or type(x) is int and 1 <= x <= 50 for x in v['values']), tag
        levels[q['difficulty']] += 1
    assert positions[0] / sum(positions.values()) < .6
    assert all(positions[p] for p in range(4))
    visuals = [v for q in all_q for v in q['visuals'] + [o['visual'] for o in q.get('options', [])]]
    visuals += [v for c in catalog['concepts'] for l in c['lessons'] for v in l['visuals']]
    for root_v in visuals:
        for v in walk_visual(root_v):
            if v['kind'] == 'object':
                assert v['object'] in SUPPORTED_OBJECTS, v
            if v['kind'] == 'shape':
                assert v['shape'] in SHAPES and v['context'] in CONTEXTS, v
    return dict(questions=len(all_q), patterns=len(catalog['patterns']), lessons=len(catalog['concepts']),
                by_topic={k: len(b['questions']) for k, b in banks.items()},
                by_level=dict(levels), answer_positions=dict(sorted(positions.items())))


def build():
    catalog = dict(version=1, sessionLength=6, topics=[
        dict(id='comparison', label='Compare & Discover', icon='🦋', description='Big, small, full, empty and more.'),
        dict(id='numbers', label='Number Adventures', icon='🚂', description='Count, match and follow the numbers.'),
        dict(id='shapes', label='Shape Explorers', icon='🔺', description='Find familiar shapes everywhere.')],
        concepts=[dict(id=c[0], topic=c[1], label=c[2], icon=c[3], lessons=c[4]) for c in CONCEPTS], patterns=PATTERNS)
    banks = {t['id']: dict(version=1, questions=[]) for t in catalog['topics']}
    for pattern in PATTERNS:
        for i in range(36):
            q = question(pattern, i)
            banks[q['topic']]['questions'].append(q)
    return catalog, banks


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Check committed banks against generator output without writing.')
    args = parser.parse_args()
    catalog, banks = build()
    report = validate(catalog, banks)
    files = {'catalog': catalog, **banks}
    if args.check:
        for name, expected in files.items():
            actual = json.loads((DEST / f'{name}.json').read_text())
            assert actual == expected, f'{name}.json differs from generated curriculum'
        validate(files['catalog'], {name: json.loads((DEST / f'{name}.json').read_text()) for name in banks})
    else:
        DEST.mkdir(parents=True, exist_ok=True)
        for name, content in files.items():
            (DEST / f'{name}.json').write_text(json.dumps(content, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(dict(status='passed', **report), indent=2))
