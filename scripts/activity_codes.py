"""Look up a Jr activity code, or assign missing codes and refresh the index.
Usage: python3 scripts/activity_codes.py JR-W09-001
       python3 scripts/activity_codes.py --sync
Codes are persisted, never computed from the current menu position.
"""
import argparse
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/'data/jr/activity-index.json'
FOLDERS={'pairs':'match-the-pair','drag':'drag-drop','reveal':'click-reveal','sequence':'sequence-ordering','blanks':'fill-in-the-blanks','count':'counting','connect':'connect-numbers','sequenceconnect':'connect-numbers','numberbins':'number-bins','math':'math-drag','numberpick':'number-pick','game':'games','advance':'advance','numberorder':'sequence-ordering','picturechoice':'picture-choice'}
def read(path):return json.loads(path.read_text())
def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def sync():
    old=read(INDEX) if INDEX.exists() else {'nextNumberByWeek':{},'activities':[]}
    counters=old.get('nextNumberByWeek',{}).copy();entries=[];seen=set();catalogs=[];files={}
    for path in sorted((ROOT/'data/jr').glob('week-*/activities.json'),key=lambda p:int(p.parent.name[5:])):
        week=path.parent.name;n=int(week[5:]);catalog=read(path);prefix=f'JR-W{n:02d}-'
        existing=[int(a['code'].split('-')[-1]) for s in catalog['sections'] for a in s['activities'] if a.get('code','').startswith(prefix)]
        next_number=max(counters.get(week,1),max(existing,default=0)+1)
        for section in catalog['sections']:
            for activity in section['activities']:
                if not activity.get('code'):
                    activity['code']=f'{prefix}{next_number:03d}';next_number+=1
                code=activity['code']
                if code in seen:raise ValueError(f'Duplicate activity code: {code}')
                if code in old.get('retiredCodes',[]):raise ValueError(f'Retired code cannot be reused: {code}')
                if not code.startswith(prefix):raise ValueError(f'{code} does not belong in {week}')
                seen.add(code)
                source=path.parent/FOLDERS[activity['type']]/(activity['file']+'.json')
                content=read(source)
                files.setdefault(source,[]).append(code)
                entries.append({'code':code,'week':week,'section':section['title'],'label':activity['label'],'title':content.get('title',activity['label']),'mode':activity.get('mode','learn'),'enabled':activity.get('enabled',True),'catalog':str(path.relative_to(ROOT)),'content':str(source.relative_to(ROOT)),'url':f'activities.html?class=jr&week={week}&activity={code}'})
        counters[week]=next_number;catalogs.append((path,catalog))
    # Validate all files/codes before writing changes.
    for path,catalog in catalogs:write(path,catalog)
    for path,codes in files.items():
        content=read(path);content.pop('activityCodes',None);write(path,{'activityCodes':codes,**content})
    retired=old.get('retiredCodes',[])+[a['code'] for a in old.get('activities',[]) if a['code'] not in seen]
    write(INDEX,{'description':'Stable Jr activity codes. Edit the content path to change questions; edit the catalog to change menu labels or visibility.','nextNumberByWeek':counters,'retiredCodes':sorted(set(retired)),'activities':entries})
    print(f'Indexed {len(entries)} Jr activity entries across {len(catalogs)} weeks.')

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('code',nargs='?');parser.add_argument('--sync',action='store_true');args=parser.parse_args()
    if args.sync:sync()
    elif args.code:
        item=next((a for a in read(INDEX)['activities'] if a['code']==args.code.upper()),None)
        if item is None:parser.error(f'Unknown activity code: {args.code}')
        print(json.dumps(item,ensure_ascii=False,indent=2))
    else:parser.print_help()
if __name__=='__main__':main()
