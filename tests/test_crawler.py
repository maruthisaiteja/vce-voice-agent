import asyncio
from types import SimpleNamespace
from scripts import crawl_website as crawler

def make(tmp_path,monkeypatch):
    monkeypatch.setattr(crawler,'ROOT',tmp_path)
    return crawler.Crawl(SimpleNamespace(fresh=True,retry_errors=False,max_documents=100,max_pdfs=10,delay=0,concurrency=2))

def test_private_and_external_targets_never_enter_public_crawl():
    for url in ['https://fees.vardhaman.org/','https://studentscorner.vardhaman.org/','https://example.com/','https://vardhaman.org/wp-login.php','https://vardhaman.org/a?token=x','javascript:alert(1)']:
        assert crawler.canonical(url) is None
    assert crawler.canonical('/library/#hours')=='https://vardhaman.org/library/'

def test_allow_robots_replaces_default_denial(tmp_path,monkeypatch):
    c=make(tmp_path,monkeypatch)
    async def get(*args):return 200,'text/plain',b'User-agent: *\nAllow: /\nDisallow: /private/\nSitemap: https://vardhaman.org/map.xml','https://vardhaman.org/robots.txt'
    c.get=get
    assert asyncio.run(c.allowed('https://vardhaman.org/library/'))
    assert not asyncio.run(c.allowed('https://vardhaman.org/private/'))
    assert 'https://vardhaman.org/map.xml' in c.frontier

def test_page_extraction_keeps_table_context_and_ignores_scripts():
    p=crawler.Page();p.feed('<html><title>Library</title><nav>Menu</nav><script>secret()</script><p>Open hours</p><table><tr><td>Monday</td><td>8 AM</td></tr></table><a href="rules.pdf">Rules</a></html>')
    assert 'Monday | 8 AM' in p.text();assert 'secret' not in p.text();assert 'Menu' not in p.text();assert p.links==['rules.pdf']

def test_exhausted_discovery_with_failures_is_not_complete(tmp_path,monkeypatch):
    import json
    c=make(tmp_path,monkeypatch);c.frontier.clear();c.rows={'x':{'url':'https://vardhaman.org/x','status':'error','textPath':'local-only.txt','approval':'unreviewed'}};c.save()
    report=json.loads((tmp_path/'data'/'website-crawl.json').read_text())
    assert report['discoveryExhausted'] is True;assert report['complete'] is False
    assert 'textPath' not in report['documents'][0];assert c.rows['x']['textPath']=='local-only.txt'
