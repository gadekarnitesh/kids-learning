#!/usr/bin/env python3
"""Check name-based Olympiad persistence, visible status, and live counts.

Requires Playwright, Chromium, and the static site served on OLYMPIAD_URL.
"""
import json
import os
from pathlib import Path
from urllib.parse import urlencode
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('OLYMPIAD_URL', 'http://localhost:8088').rstrip('/')
OUT = Path(os.environ.get('OLYMPIAD_ARTIFACTS', '/tmp/kids-olympiad-progress'))
QUESTIONS = [q for topic in ['comparison','numbers','shapes'] for q in json.loads((ROOT / f'data/olympiad/{topic}.json').read_text())['questions']]
BY_ID = {q['id']:q for q in QUESTIONS}
KEY = 'kids-olympiad-progress:v1:nitesh'
OUT.mkdir(parents=True, exist_ok=True)


def route(page, **params):
    page.evaluate('(hash)=>location.hash=hash', urlencode(params))
    if params['view'] == 'home':
        page.locator('.learner-progress').wait_for()
    elif params['view'] == 'choose':
        page.locator('.pattern-grid').wait_for()
    elif params['view'] == 'topic':
        page.locator('.concept-grid').wait_for()


def status(page, selector, expected, count):
    el = page.locator(selector).locator('.progress-summary').first
    assert el.get_attribute('data-status') == expected, (selector, el.inner_text())
    assert el.locator('.progress-count').inner_text() == count, (selector, el.inner_text())


def start(page, concept, pattern):
    route(page, view='choose', concept=concept, level=2)
    page.locator(f'[data-pattern="{pattern}"]').click()
    page.locator('.question-card').wait_for()
    return BY_ID[page.locator('.question-card').get_attribute('data-question-id')]


def seed(page, solved, **extra):
    state = dict(version=1, solved={q['id']:123 for q in solved}, learned=[], recent=[])
    state.update(extra)
    page.evaluate('([key,state])=>localStorage.setItem(key,JSON.stringify(state))',[KEY,state])
    page.reload(wait_until='networkidle')


with sync_playwright() as p:
    opts = dict(headless=True, args=['--no-sandbox'])
    if os.environ.get('CHROMIUM_PATH'): opts['executable_path']=os.environ['CHROMIUM_PATH']
    browser=p.chromium.launch(**opts)
    context=browser.new_context(viewport={'width':1440,'height':1100})
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE+'/profile.html?class=olympiad',wait_until='networkidle')
    page.locator('#name').fill('Nitesh');page.locator('#age').fill('5');page.locator('button[type="submit"]').click()
    page.locator('.learner-progress').wait_for()
    status(page,'.learner-progress','not-started','0 / 1368 complete')
    status(page,'[data-topic="comparison"]','not-started','0 / 540 complete')
    q=start(page,'size','size-big')
    status(page,'#practice-progress','in-progress','0 / 12 complete')
    saved=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
    assert q['id'] in saved['started'] and not saved['solved']
    # A retry is not completion; success updates the cumulative count immediately.
    wrong=next(o for o in q['options'] if o['id']!=q['answer'])
    page.locator(f'[data-option="{wrong["id"]}"]').click()
    status(page,'#practice-progress','in-progress','0 / 12 complete')
    page.locator(f'[data-option="{q["answer"]}"]').click()
    status(page,'#practice-progress','in-progress','1 / 12 complete')
    page.reload(wait_until='networkidle')
    status(page,'[data-level="2"]','in-progress','1 / 36 complete')
    status(page,'[data-pattern="size-big"]','in-progress','1 / 12 complete')
    status(page,'.concept-total-progress','in-progress','1 / 108 complete')
    page.locator('[data-level="3"]').click()
    status(page,'[data-pattern="size-big"]','not-started','0 / 12 complete')
    page.locator('[data-level="2"]').click()
    status(page,'[data-pattern="size-big"]','in-progress','1 / 12 complete')
    route(page,view='topic',topic='comparison')
    status(page,'[data-concept-status="size"]','in-progress','1 / 108 complete')
    route(page,view='home')
    status(page,'.learner-progress','in-progress','1 / 1368 complete')
    assert 'Saved in this browser for Nitesh' in page.locator('.learner-progress').inner_text()
    # A new browser session has no sessionStorage; re-entering the name restores localStorage.
    returning=browser.new_context(storage_state=context.storage_state())
    other=returning.new_page()
    other.goto(BASE+'/profile.html?class=olympiad',wait_until='networkidle')
    other.locator('#name').fill('  NITESH  ');other.locator('#age').fill('8');other.locator('button[type="submit"]').click()
    other.locator('.learner-progress').wait_for()
    status(other,'.learner-progress','in-progress','1 / 1368 complete')
    # Different names and Maths progress stay separate.
    other.goto(BASE+'/profile.html?class=olympiad',wait_until='networkidle')
    other.locator('#name').fill('Anvi');other.locator('#age').fill('5');other.locator('button[type="submit"]').click()
    other.locator('.learner-progress').wait_for()
    status(other,'.learner-progress','not-started','0 / 1368 complete')
    assert other.evaluate('(key)=>Object.keys(JSON.parse(localStorage.getItem(key)).solved).length',KEY)==1
    assert other.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('kids-maths-progress:')).length")==0
    # Legacy v1 data has no started map. Preserve answers, lessons, and opened questions.
    legacy=next(q for q in QUESTIONS if q['pattern']=='size-small' and q['difficulty']==2)
    seed(page,[q],learned=['size'],recent=[legacy['id']])
    status(page,'.learner-progress','in-progress','1 / 1368 complete')
    assert '1 / 14 lessons explored' in page.locator('.learner-progress').inner_text()
    route(page,view='choose',concept='size')
    status(page,'[data-pattern="size-small"]','in-progress','0 / 12 complete')
    # Opening persists even after it drops out of the bounded recent-question list.
    route(page,view='home')
    seed(page,[],started={legacy['id']:123},recent=[q['id'] for q in QUESTIONS[-80:]])
    route(page,view='choose',concept='size')
    status(page,'[data-pattern="size-small"]','in-progress','0 / 12 complete')
    # Completing the final unique question marks the pattern complete. Repeating does not add to the total.
    pool=[q for q in QUESTIONS if q['pattern']=='size-big' and q['difficulty']==2]
    seed(page,pool[:-1])
    page.locator('[data-pattern="size-big"]').click();page.locator('.question-card').wait_for()
    assert page.locator('.question-card').get_attribute('data-question-id')==pool[-1]['id']
    page.locator(f'[data-option="{pool[-1]["answer"]}"]').click()
    status(page,'#practice-progress','completed','12 / 12 complete')
    route(page,view='choose',concept='size')
    status(page,'[data-pattern="size-big"]','completed','12 / 12 complete')
    page.locator('[data-pattern="size-big"]').click();page.locator('.question-card').wait_for()
    repeat=BY_ID[page.locator('.question-card').get_attribute('data-question-id')]
    page.locator(f'[data-option="{repeat["answer"]}"]').click()
    status(page,'#practice-progress','completed','12 / 12 complete')
    assert page.evaluate('(key)=>Object.keys(JSON.parse(localStorage.getItem(key)).solved).length',KEY)==12
    # Other activity types use the same successful-completion accounting.
    for concept,pattern in [('quantity','number-pairs'),('counting','number-build')]:
        q=start(page,concept,pattern)
        status(page,'#practice-progress','in-progress','0 / 12 complete')
        if q['activity']=='pairs':
            for pair in q['pairs']:
                page.locator(f'[data-side="left"][data-pair="{pair["id"]}"]').click()
                page.locator(f'[data-side="right"][data-pair="{pair["id"]}"]').click()
        else:
            for _ in range(q['target']):page.locator('#build-plus').click()
            page.locator('#build-check').click()
        status(page,'#practice-progress','in-progress','1 / 12 complete')
    # All states roll up to parents and fit on phones, tablets and desktops.
    route(page,view='home')
    seed(page,[q for q in QUESTIONS if q['topic']=='comparison'],learned=['size','height'])
    status(page,'[data-topic="comparison"]','completed','540 / 540 complete')
    route(page,view='topic',topic='comparison')
    status(page,'[data-concept-status="size"]','completed','108 / 108 complete')
    for width in [320,390,768,1440]:
        page.set_viewport_size({'width':width,'height':1000})
        for params in [dict(view='home'),dict(view='topic',topic='comparison'),dict(view='choose',concept='size')]:
            route(page,**params)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,params)
            assert not page.evaluate("[...document.querySelectorAll('.progress-summary,.practice-levels button,.topic-card,.pattern-button')].filter(el=>el.scrollWidth>el.clientWidth+2).map(el=>el.className)"),(width,params)
        if width in [320,1440]:page.screenshot(path=str(OUT/f'practice-status-{width}.png'),full_page=True)
        q=start(page,'size','size-small')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
    route(page,view='home');seed(page,QUESTIONS)
    status(page,'.learner-progress','completed','1368 / 1368 complete')
    page.screenshot(path=str(OUT/'overall-completed.png'),full_page=True)
    # A failed write must not claim the answers were saved.
    denied=browser.new_page()
    denied.add_init_script("sessionStorage.setItem('kidsLearningProfile',JSON.stringify({name:'No Storage',classId:'olympiad'}));Storage.prototype.setItem=function(){throw new Error('Storage full')}")
    denied.goto(BASE+'/olympiad.html',wait_until='networkidle')
    q=start(denied,'size','size-big')
    assert 'cannot be saved' in denied.locator('[data-save-message]').inner_text()
    denied.locator(f'[data-option="{q["answer"]}"]').click()
    status(denied,'#practice-progress','in-progress','1 / 12 complete')
    assert not errors,errors
    print(json.dumps({'status':'passed','checks':['visible status at every scope','live unique completion counts for all activity types','same name restored in a new browser session','age and case independent identity','different learners isolated','legacy v1 progress retained','started status persists','final-question completion and repeat accounting','320/390/768/1440px layouts','storage failure messaging'],'browser_errors':errors,'artifacts':str(OUT)},indent=2),flush=True)
    browser.close()
