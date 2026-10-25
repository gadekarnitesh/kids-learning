#!/usr/bin/env python3
"""Browser integration checks. Requires Python Playwright and Chromium.

Serve the repository (python3 -m http.server 8088), then run this script.
Set OLYMPIAD_URL, CHROMIUM_PATH, or OLYMPIAD_ARTIFACTS when needed.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('OLYMPIAD_URL', 'http://localhost:8088').rstrip('/')
ARTIFACTS = Path(os.environ.get('OLYMPIAD_ARTIFACTS', '/tmp/kids-olympiad-verification'))
CATALOG = json.loads((ROOT / 'data/olympiad/catalog.json').read_text())
QUESTIONS = {q['id']: q for topic in CATALOG['topics'] for q in json.loads((ROOT / f'data/olympiad/{topic["id"]}.json').read_text())['questions']}
ARTIFACTS.mkdir(parents=True, exist_ok=True)


def navigate(page, **params):
    from urllib.parse import urlencode
    page.evaluate('(hash) => { location.hash = hash; }', urlencode(params))
    if params['view'] == 'choose':
        page.locator('.pattern-grid').wait_for()
        page.wait_for_function('(id) => !!document.querySelector(`[data-pattern="${id}"]`)', arg=next(p['id'] for p in CATALOG['patterns'] if p['concept'] == params['concept']))


def start(page, pattern, level):
    navigate(page, view='choose', concept=pattern['concept'], level=level)
    page.locator(f'[data-level="{level}"]').click()
    page.locator(f'[data-pattern="{pattern["id"]}"]').click()
    page.locator('.question-card').wait_for()
    q = QUESTIONS[page.locator('.question-card').get_attribute('data-question-id')]
    assert q['pattern'] == pattern['id'] and q['difficulty'] == level
    return q


def assert_layout(page, label):
    bad = page.evaluate('''() => [...document.querySelectorAll('.answer-choice,.pair-choice,.lesson-card,.question-card,.practice-levels,.topic-card,.pattern-button')].filter(el => el.scrollWidth > el.clientWidth + 2).map(el=>({class:el.className,width:el.clientWidth,scroll:el.scrollWidth}))''')
    assert not bad, (label, bad)
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), label
    for choice in page.locator('.answer-choice,.pair-choice,.build-controls button').all():
        box = choice.bounding_box()
        assert box['width'] >= 44 and box['height'] >= 44, (label, box)


def answer(page, q, retry=False):
    if q['activity'] == 'choice':
        if q['rule'] == 'count':
            marker = page.locator('[data-count-index="0"]')
            marker.focus(); page.keyboard.press('Enter')
            assert marker.get_attribute('aria-pressed') == 'true'
            page.keyboard.press('Space')
            assert marker.get_attribute('aria-pressed') == 'false'
        if retry:
            wrong = next(o for o in q['options'] if o['id'] != q['answer'])
            page.locator(f'[data-option="{wrong["id"]}"]').click()
            assert page.locator('#hint-panel').is_visible()
            assert page.locator('#next-question').is_hidden()
        page.locator(f'[data-option="{q["answer"]}"]').click()
        assert page.locator('.choice-correct').count() == 1
        assert page.locator('.answer-choice:enabled').count() == 0
    elif q['activity'] == 'pairs':
        if retry:
            page.locator(f'[data-side="left"][data-pair="{q["pairs"][0]["id"]}"]').click()
            page.locator(f'[data-side="right"][data-pair="{q["pairs"][1]["id"]}"]').click()
            assert page.locator('#hint-panel').is_visible()
            assert page.locator('#next-question').is_hidden()
        for pair in q['pairs']:
            page.locator(f'[data-side="left"][data-pair="{pair["id"]}"]').click()
            page.locator(f'[data-side="right"][data-pair="{pair["id"]}"]').click()
        assert page.locator('.pair-correct').count() == 6
    else:
        target = q['target']
        assert page.locator('#build-minus').is_disabled()
        if retry:
            wrong = 2 if target == 1 else 1
            for _ in range(wrong):
                page.locator('#build-plus').click()
            page.locator('#build-check').click()
            assert page.locator('#hint-panel').is_visible()
            while wrong:
                page.locator('#build-minus').click(); wrong -= 1
        for _ in range(target):
            page.locator('#build-plus').click()
        assert page.locator('#build-basket .count-piece').count() == target
        page.locator('#build-check').click()
        assert 'build-correct' in page.locator('#build-basket').get_attribute('class')
    assert page.locator('#next-question').is_visible()
    assert 'feedback-correct' in page.locator('#answer-feedback').get_attribute('class')


with sync_playwright() as p:
    opts = dict(headless=True, args=['--no-sandbox'])
    if os.environ.get('CHROMIUM_PATH'):
        opts['executable_path'] = os.environ['CHROMIUM_PATH']
    browser = p.chromium.launch(**opts)
    page = browser.new_page(viewport={'width':1440,'height':1000})
    errors, requests_failed = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('response', lambda r: requests_failed.append(r.url) if r.status >= 400 and '/data/olympiad/' in r.url else None)
    page.goto(BASE + '/index.html', wait_until='networkidle')
    entry = page.get_by_role('link', name='★ Olympiad Learn, practise & discover')
    if entry.count():
        entry.click()
    else:
        # Olympiad can be checked directly while its launch entry is hidden.
        page.goto(BASE + '/profile.html?class=olympiad', wait_until='networkidle')
    page.locator('#name').fill('Olympiad Browser Check')
    page.locator('#age').fill('5')
    assert page.locator('#olympiad-progress-note').is_visible()
    page.locator('button[type="submit"]').click()
    page.locator('.olympiad-topics').wait_for()
    assert 'Olympiad' in page.title()
    page.screenshot(path=str(ARTIFACTS / 'home-desktop.png'), full_page=True)
    key = 'kids-olympiad-progress:v1:olympiad%20browser%20check'
    # All lessons are reachable and lead to a relevant practice picker.
    for c in CATALOG['concepts']:
        navigate(page, view='learn', concept=c['id'])
        page.locator('#lesson-next').wait_for()
        for i in range(len(c['lessons'])):
            assert page.locator('.lesson-card').is_visible()
            assert_layout(page, f'lesson:{c["id"]}:{i}')
            page.locator('#lesson-next').click()
            if i + 1 < len(c['lessons']):
                page.wait_for_function('(title)=>document.querySelector("h1")?.textContent===title', arg=c['lessons'][i + 1]['title'])
        page.locator('.pattern-grid').wait_for()
    assert page.evaluate('(key)=>JSON.parse(localStorage.getItem(key)).learned.length', key) == 14
    print('All 14 lessons passed.', flush=True)
    # Render every bank visual and verify actual quantity elements and SVG parsing.
    visual_report = page.evaluate('''questions => {
      let rendered=0;
      const check=v=>{
        const el=document.createElement('div');
        el.innerHTML=window.OlympiadVisuals.render(v);
        if(!el.firstElementChild) throw Error('Empty visual: '+JSON.stringify(v));
        if(v.kind==='quantity' && el.querySelectorAll('.count-piece').length!==v.count) throw Error('Wrong quantity');
        for(const svg of el.querySelectorAll('svg')){
          if(svg.querySelector('text')) throw Error('Teaching picture depends on a font glyph');
          if(new DOMParser().parseFromString(svg.outerHTML,'image/svg+xml').querySelector('parsererror')) throw Error('Malformed SVG');
        }
        rendered++;
      };
      for(const q of questions){
        q.visuals.forEach(check);
        (q.options||[]).forEach(o=>check(o.visual));
        (q.pairs||[]).forEach(p=>{check(p.left);check(p.right);});
        if(q.helper) check(q.helper);
      }
      return {questions:questions.length,visuals:rendered};
    }''', list(QUESTIONS.values()))
    print('Every visual rendered:', visual_report, flush=True)
    # Every pattern at all three levels: question wiring and a meaningful retry.
    for level in [2,3,4]:
        for pattern in CATALOG['patterns']:
            q = start(page, pattern, level)
            assert_layout(page, f'{pattern["id"]}:level{level}')
            answer(page, q, retry=True)
        print(f'All 38 patterns at level {level} passed.', flush=True)
    # Complete a session and verify that the next session gives six new questions.
    pattern = CATALOG['patterns'][0]
    page.evaluate('(key)=>localStorage.removeItem(key)', key)
    page.reload(wait_until='networkidle')
    first, second = [], []
    q = start(page, pattern, 2)
    for i in range(6):
        first.append(q['id']); answer(page, q)
        page.locator('#next-question').click()
        if i < 5:
            page.wait_for_function('(id)=>document.querySelector(".question-card")?.dataset.questionId!==id', arg=q['id'])
            q = QUESTIONS[page.locator('.question-card').get_attribute('data-question-id')]
    page.locator('#practice-more').wait_for()
    assert len(set(first)) == 6
    page.screenshot(path=str(ARTIFACTS / 'session-recap.png'), full_page=True)
    assert page.evaluate('(key)=>Object.keys(JSON.parse(localStorage.getItem(key)).solved).length', key) == 6
    page.locator('#practice-more').click()
    for i in range(6):
        page.locator('.question-card').wait_for()
        q = QUESTIONS[page.locator('.question-card').get_attribute('data-question-id')]
        second.append(q['id']); answer(page, q)
        page.locator('#next-question').click()
        if i < 5:
            page.wait_for_function('(id)=>document.querySelector(".question-card")?.dataset.questionId!==id', arg=q['id'])
    assert not set(first) & set(second), (first,second)
    page.reload(wait_until='networkidle')
    assert page.evaluate('(key)=>Object.keys(JSON.parse(localStorage.getItem(key)).solved).length', key) == 12
    print('Session completion, unseen-first selection, and persistence passed.', flush=True)
    # Cover the distinct layout shapes at phone, tablet and desktop widths.
    samples = ['size-fit','height-tall','weight-heavy','fill-full','state-open','posture-sit','same-match','different-object','number-count','quantity-equal','number-missing','number-to-name','number-pairs','shape-count','shape-pairs','number-build']
    for width in [320,390,768,1440]:
        page.set_viewport_size({'width':width,'height':900})
        for pid in samples:
            pattern = next(p for p in CATALOG['patterns'] if p['id'] == pid)
            q = start(page, pattern, 4)
            assert_layout(page, f'{width}px:{pid}')
            if width in [320,768] and pid in ['weight-heavy','number-pairs','number-build','shape-count','number-to-name']:
                page.screenshot(path=str(ARTIFACTS / f'{pid}-{width}px.png'), full_page=True)
        for c in CATALOG['concepts']:
            navigate(page, view='learn', concept=c['id'])
            page.locator('#lesson-next').wait_for()
            assert_layout(page, f'{width}px:lesson:{c["id"]}')
        navigate(page, view='home')
        page.locator('.olympiad-topics').wait_for()
        assert_layout(page, f'{width}px:home')
        if width == 320:
            page.screenshot(path=str(ARTIFACTS / 'home-mobile.png'), full_page=True)
        print(f'{width}px layouts passed.', flush=True)
    # Same name resumes regardless of age; different names do not share progress.
    page.evaluate('''()=>sessionStorage.setItem('kidsLearningProfile', JSON.stringify({name:'  OLYMPIAD   BROWSER CHECK ',age:6,classId:'olympiad'}))''')
    page.reload(wait_until='networkidle')
    assert '12 discoveries' in page.locator('.saved-progress').inner_text()
    page.evaluate('''()=>sessionStorage.setItem('kidsLearningProfile', JSON.stringify({name:'Another Olympiad Learner',age:5,classId:'olympiad'}))''')
    page.reload(wait_until='networkidle')
    assert 'Every try' in page.locator('.saved-progress').inner_text()
    assert page.evaluate('(key)=>Object.keys(JSON.parse(localStorage.getItem(key)).solved).length', key) == 12
    assert page.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('kids-maths-progress:')).length") == 0
    # Existing routes still load after the profile routing change.
    page.goto(BASE+'/profile.html?class=maths',wait_until='networkidle')
    page.locator('#name').fill('Maths Route Check');page.locator('#age').fill('5');page.locator('button[type="submit"]').click()
    page.locator('#activity-frame').wait_for()
    assert 'activities.html?class=maths' in page.url
    page.goto(BASE+'/class-landing.html?class=jr',wait_until='networkidle')
    page.locator('.section-card').first.wait_for()
    # Storage denial still permits completing an activity.
    denied = browser.new_page(viewport={'width':390,'height':844})
    denied.on('pageerror', lambda e: errors.append(str(e)))
    denied.add_init_script("Storage.prototype.getItem=function(){throw new Error('storage denied')};Storage.prototype.setItem=function(){throw new Error('storage denied')}")
    denied.goto(BASE+'/olympiad.html',wait_until='networkidle')
    assert denied.locator('.storage-note').is_visible()
    q = start(denied, CATALOG['patterns'][0], 2); answer(denied,q)
    assert not errors, errors
    assert not requests_failed, requests_failed
    print(json.dumps({'status':'passed','questions_validated':len(QUESTIONS),'visuals_rendered':visual_report['visuals'],'pattern_level_flows':114,'viewport_widths':[320,390,768,1440],'browser_errors':errors,'artifacts':str(ARTIFACTS)},indent=2), flush=True)
    browser.close()
