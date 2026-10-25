"""Build Maths JSON using the same advance activity schema as JR-KG."""

import json
import random
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RNG = random.Random(20261025)
COLORS = ['#7657dd', '#2878b8', '#21865c', '#b56518', '#c44274']
TOPICS = [
    ('addition', 'Addition', '➕', ['Single digit', 'Two digits', 'Three digits', 'Carry challenge', 'Missing Number']),
    ('subtraction', 'Subtraction', '➖', ['Single digit', 'Two digits', 'Three digits', 'Borrow challenge', 'Missing Number']),
    ('multiplication', 'Multiplication', '✖️', ['Single digit', 'Two digits', 'Challenge']),
    ('division', 'Division', '➗', ['Single digit', 'Two digits', 'Remainders']),
    ('before', 'Before Number', '⬅️', ['1–50', 'Two digits']),
    ('after', 'After Number', '➡️', ['1–50', 'Two digits']),
    ('inbetween', 'In Between', '↔️', ['1–50', 'Two digits']),
    ('series', 'Number Series', '🔢', ['Skip one number', 'Skip two numbers']),
]


def write(path, data):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def number_question(sequence, answer):
    answer = int(answer)
    distractors = [value for value in {answer + delta for delta in (-10, -3, -2, -1, 1, 2, 3, 10)} if value >= 0]
    choices = [str(answer), *map(str, RNG.sample(sorted(distractors), 2))]
    RNG.shuffle(choices)
    return {'sequence': list(map(str, sequence)), 'answer': str(answer), 'choices': choices}


def arithmetic(topic, level):
    symbol = {'addition': '+', 'subtraction': '−', 'multiplication': '×', 'division': '÷'}[topic]
    if topic == 'division':
        start, end = (0, 9) if level == 1 else (10, 99)
        pairs = [(a, b) for a in range(start, end + 1) for b in range(1 if level == 1 else 2, 10)
                 if (a % b != 0 if level == 3 else a % b == 0)]
        example = (28, 3)
    else:
        lo, hi = ((1, 9) if level == 1 else (100, 999) if level == 3 and topic != 'multiplication' else (10, 99))
        if topic == 'multiplication':
            right = range(1, 10) if level <= 2 else range(11, 20)
        else:
            right = range(1 if level == 5 else lo, hi + 1)
        pairs = [(a, b) for a in range(lo, hi + 1) for b in right
                 if (topic != 'subtraction' or a >= b)
                 and (level != 4 or (a % 10 + b % 10 >= 10 if topic == 'addition' else a % 10 < b % 10))]
        example = ((10, 10) if topic == 'addition' else (10, 7)) if level == 5 else (19, 18) if topic == 'addition' else (28, 19) if topic == 'subtraction' else (28, 11)
    pairs = RNG.sample(pairs, 24)
    if (level in (4, 5) or topic in ('multiplication', 'division') and level == 3) and example not in pairs:
        pairs[0] = example
    questions = []
    for a, b in pairs:
        if topic == 'division' and level == 3:
            quotient, remainder = divmod(a, b)
            answer = f'{quotient} R {remainder}'
            choices = [answer, f'{quotient + 1} R {remainder}', f'{quotient} R {(remainder + 1) % b}']
            RNG.shuffle(choices)
            questions.append({'sequence': [str(a), symbol, str(b), '=', '?'], 'answer': answer, 'choices': choices})
            continue
        result = a + b if topic == 'addition' else a - b if topic == 'subtraction' else a * b if topic == 'multiplication' else a // b
        sequence = [a, symbol, '?' if level == 5 else b, '=', result if level == 5 else '?']
        questions.append(number_question(sequence, b if level == 5 else result))
    return questions


def advance(topic, level):
    questions = []
    starts = RNG.sample(list(range(2, 48) if level == 1 else range(11, 97)), 24)
    if topic in ('before', 'after', 'inbetween'):
        starts[0] = 4 if level == 1 else 44
        starts = list(dict.fromkeys(starts))
        while len(starts) < 24:
            starts.append(next(n for n in (range(2, 48) if level == 1 else range(11, 97)) if n not in starts))
    for n in starts:
        if topic == 'before':
            sequence, answer = (['?', n] if level == 1 else ['?', n, n + 1]), n - 1
        elif topic == 'after':
            sequence, answer = ([n, '?'] if level == 1 else [n, n + 1, '?']), n + (1 if level == 1 else 2)
        elif topic == 'inbetween':
            sequence, answer = [n, '?', n + 2], n + 1
        else:
            step = 2 if level == 1 else 3
            sequence = [n + step * i for i in range(5)]
            missing = RNG.randint(1, 3)
            answer, sequence[missing] = sequence[missing], '?'
        questions.append(number_question(sequence, answer))
    return questions


def main():
    sections = []
    for topic, title, icon, labels in TOPICS:
        activities = []
        for level, label in enumerate(labels, 1):
            filename = f'{topic}-level-{level}'
            equation = topic in ('addition', 'subtraction', 'multiplication', 'division')
            questions = arithmetic(topic, level) if equation else advance(topic, level)
            instruction = {
                'before': 'Drag the number that comes before.',
                'after': 'Drag the number that comes after.',
                'inbetween': 'Drag the number that comes in between.',
                'series': f'Count in steps of {2 if level == 1 else 3} and drag the missing number.',
            }.get(topic, 'Drag the missing number to make the equation correct.')
            if topic == 'division' and level == 3:
                instruction = 'Divide, then drag the answer. R means remainder (28 ÷ 3 = 9 R 1).'
            data = {
                'title': f'{title} · {label}',
                'instruction': instruction,
                'questionsPerPage': 2 if level == 1 else 1,
                'shuffleQuestions': True,
                'level': level,
                'levelColor': COLORS[level - 1],
                'questions': questions,
            }
            if equation:
                data.update(presentation='equation', layout='vertical')
            if topic == 'division' and level == 3:
                data['remainders'] = True
            write(f'data/maths/operations/advance/{filename}.json', data)
            activities.append({'type': 'advance', 'file': filename, 'mode': 'learn', 'level': level,
                               'code': f'MATH-{topic.upper()}-L{level}', 'label': f'Level {level} · {label}', 'icon': icon,
                               'questionCount': len(questions)})
        sections.append({'id': topic, 'title': title, 'icon': icon, 'activities': activities})
    write('data/maths/operations/activities.json', {'sections': sections})
    write('data/maths/sections.json', {'sections': [{'id': 'operations', 'label': 'Maths', 'enabled': True}]})
    print(f'Generated {sum(len(t[3]) for t in TOPICS)} Maths levels with 24 questions each.')


if __name__ == '__main__':
    main()
