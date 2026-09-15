"""Build-time GitHub snapshot and static activity card (stdlib only)."""
from datetime import date, datetime, timedelta, timezone
import calendar as dates
import json
import os
from urllib.request import Request, urlopen

ACCOUNT = 'ActiveAngrily'


def fetch_snapshot(token, request=None):
    def api(path, body=None):
        req = Request('https://api.github.com/' + path,
                      data=json.dumps(body).encode() if body else None,
                      headers={'Authorization': 'Bearer ' + token, 'User-Agent': 'portfolio-build',
                               'Accept': 'application/vnd.github+json'})
        with urlopen(req, timeout=20) as response:
            return json.load(response)
    request = request or api
    today = datetime.now(timezone.utc).date()
    start = today.replace(year=today.year - 1, day=min(today.day, dates.monthrange(today.year - 1, today.month)[1]))
    query = '''query($login:String!, $from:DateTime!, $to:DateTime!) {
      user(login:$login) { contributionsCollection(from:$from,to:$to) {
        contributionCalendar { weeks { contributionDays { date contributionCount } } }
      } }
    }'''
    response = request('graphql', {'query': query, 'variables': {'login': ACCOUNT,
        'from': start.isoformat() + 'T00:00:00Z', 'to': today.isoformat() + 'T23:59:59Z'}})
    days = [{'date': d['date'], 'count': d['contributionCount']}
            for w in response['data']['user']['contributionsCollection']['contributionCalendar']['weeks']
            for d in w['contributionDays'] if start <= date.fromisoformat(d['date']) <= today]
    repos = []
    page = 1
    while True:
        batch = request(f'user/repos?affiliation=owner&visibility=all&per_page=100&page={page}')
        repos.extend(r for r in batch if r['owner']['login'].lower() == ACCOUNT.lower())
        if len(batch) < 100:
            break
        page += 1
    snapshot = {'account': ACCOUNT, 'fetched_at': datetime.now(timezone.utc).isoformat(),
                'days': days, 'annual_total': sum(d['count'] for d in days),
                'repositories': len(repos), 'stars': sum(r['stargazers_count'] for r in repos if not r['fork'])}
    validate(snapshot)
    return snapshot


def validate(data):
    if data['account'] != ACCOUNT:
        raise ValueError('Unexpected GitHub account')
    datetime.fromisoformat(data['fetched_at'])
    dates = [date.fromisoformat(d['date']) for d in data['days']]
    if not 365 <= len(dates) <= 367 or not all(b - a == timedelta(days=1) for a, b in zip(dates, dates[1:])):
        raise ValueError('Invalid contribution calendar')
    for number in [data['annual_total'], data['repositories'], data['stars'], *[d['count'] for d in data['days']]]:
        if type(number) is not int or number < 0:
            raise ValueError('Invalid GitHub count')
    if data['annual_total'] != sum(d['count'] for d in data['days']):
        raise ValueError('Contribution total does not match calendar')


def refresh(path, token=None, fetch=fetch_snapshot, offline=False):
    previous = None
    try:
        previous = json.loads(path.read_text())
        validate(previous)
    except (OSError, ValueError, KeyError, TypeError, AssertionError):
        previous = None
    if offline:
        return previous
    token = token or os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN')
    if not token:
        try:
            token = (path.parent / '.github-token').read_text().strip()
        except OSError:
            pass
    if token:
        try:
            current = fetch(token)
            validate(current)
            temporary = path.with_suffix('.tmp')
            temporary.write_text(json.dumps(current, indent=2) + '\n')
            temporary.replace(path)
            return current
        except Exception:
            print('GitHub refresh unavailable; retaining the last valid snapshot if present.')
    else:
        print('No GitHub build token; using saved activity if available.')
    return previous


def calendar(days, mobile=False):
    offset = (date.fromisoformat(days[0]['date']).weekday() + 1) % 7
    cells = [None] * offset + days
    weeks = [cells[i:i + 7] for i in range(0, len(cells), 7)]
    if mobile:
        weeks = weeks[-26:]
    columns, labels, last_month = [], [], None
    for week in weeks:
        first = next(d for d in week if d)
        month = date.fromisoformat(first['date']).strftime('%b')
        labels.append(f'<span>{month if month != last_month else ""}</span>')
        last_month = month
        squares = []
        for day in week:
            count = day['count'] if day else 0
            level = 0 if count == 0 else 1 if count < 4 else 2 if count < 8 else 3 if count < 13 else 4
            squares.append(f'<i class="tone-{level}{" blank" if day is None else ""}"></i>')
        columns.append('<span class="activity-week">' + ''.join(squares) + '</span>')
    return f'<div class="calendar {"calendar-mobile" if mobile else "calendar-year"}" aria-hidden="true"><div class="month-labels" style="--weeks:{len(weeks)}">{"".join(labels)}</div><div class="activity-grid">{"".join(columns)}</div></div>'


def render(data):
    head = '<section class="activity-card" aria-labelledby="activity-title"><div class="activity-header"><h2 id="activity-title">a little work, every day</h2><a class="github-profile" href="https://github.com/ActiveAngrily" target="_blank" rel="noreferrer">@ActiveAngrily ↗</a></div>'
    if not data:
        return head + '<p class="activity-unavailable">activity unavailable</p><p class="activity-note">a little more of my work lives on GitHub.</p></section>'
    return head + f'<p class="sr-only">{data["annual_total"]:,} contributions from {data["days"][0]["date"]} to {data["days"][-1]["date"]}.</p>' + calendar(data['days']) + calendar(data['days'], True) + '<div class="activity-legend"><span class="year-label">past 12 months</span><span class="mobile-label">latest 26 weeks</span><span>less <i class="tone-0"></i><i class="tone-1"></i><i class="tone-2"></i><i class="tone-3"></i><i class="tone-4"></i> more</span></div>' + '<dl class="activity-metrics">' + ''.join(f'<div><dt>{label}</dt><dd>{value:,}</dd></div>' for label, value in [('contributions<span>past 12 months</span>', data['annual_total']), ('repositories<span>public + private</span>', data['repositories']), ('stars<span>received</span>', data['stars'])]) + f'</dl><p class="activity-note">snapshot through <time datetime="{data["days"][-1]["date"]}">{data["days"][-1]["date"]}</time></p></section>'
