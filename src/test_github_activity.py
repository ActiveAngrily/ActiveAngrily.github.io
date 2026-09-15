"""Run: python3 src/test_github_activity.py"""
from datetime import datetime, timedelta, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
import json
from github_activity import ACCOUNT, fetch_snapshot, refresh, render, validate

calls = []
today = datetime.now(timezone.utc).date()
days = [{'date': (today - timedelta(days=364-i)).isoformat(), 'contributionCount': i % 5} for i in range(365)]
def request(path, body=None):
    calls.append(path)
    if path == 'graphql':
        return {'data': {'user': {'contributionsCollection': {'contributionCalendar': {'weeks': [{'contributionDays': days}]}}}}}
    repo = {'private': False, 'owner': {'login': ACCOUNT}, 'fork': False, 'stargazers_count': 2}
    if path.endswith('page=1'):
        return [dict(repo) for _ in range(100)]
    return [dict(repo, fork=True, stargazers_count=1000), dict(repo, private=True), dict(repo, owner={'login': 'someone-else'})]

snapshot = fetch_snapshot('test', request)
assert len(calls) == 3 and calls[-1].endswith('page=2')
assert calls[1].startswith('user/repos?affiliation=owner&visibility=all&')
assert snapshot['repositories'] == 102 and snapshot['stars'] == 202
assert snapshot['days'][0]['date'] == days[0]['date']
assert snapshot['annual_total'] == sum(d['contributionCount'] for d in days)
assert 'latest 26 weeks' in render(snapshot) and 'tabindex' not in render(snapshot)
assert '@ActiveAngrily ↗' in render(snapshot) and 'Updated ' not in render(snapshot)
invalid = dict(snapshot, days=[dict(d) for d in snapshot['days']])
invalid['days'][1]['date'] = invalid['days'][0]['date']
try:
    validate(invalid)
    raise RuntimeError('duplicate contribution date accepted')
except ValueError:
    pass

def unavailable(token):
    raise OSError('offline')
with TemporaryDirectory() as folder:
    path = Path(folder) / 'activity.json'
    assert refresh(path, 'test', unavailable) is None
    assert 'activity unavailable' in render(None)
    path.write_text(json.dumps(snapshot))
    original = path.read_text()
    assert refresh(path, 'test', unavailable) == snapshot
    assert path.read_text() == original
    assert refresh(path, 'test', lambda _: (_ for _ in ()).throw(AssertionError('offline fetch')), offline=True) == snapshot
    assert snapshot['days'][-1]['date'] in render(snapshot)
    assert refresh(path, 'test', lambda _: snapshot) == snapshot
print('GitHub data checks passed: pagination, public/private ownership, forks, dates, and fallback.')
