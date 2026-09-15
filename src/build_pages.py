"""Build the small static detail pages from the shared portfolio shell."""
from pathlib import Path
import re
import sys
from github_activity import refresh, render

source = Path(__file__).parent
root = source.parent
shell = (root / "index.html").read_text()
activity = render(refresh(root / "github-activity.json", offline="--offline" in sys.argv))
shell = re.sub(r'<aside class="desk".*?</aside>', '<aside class="desk" aria-label="GitHub activity and playground">' + activity + '<div class="square-playground" aria-hidden="true"></div><div class="desk-bottom"><time id="date"></time><time id="clock"></time></div></aside>', shell, flags=re.S)
(root / "index.html").write_text(shell)

pages = {
    "me": (
        "A little about me",
        "Meet Anant Jamuar, an ECE student building agentic AI, clinical tools, and real-time edge systems.",
        '''<img class="portrait" src="/assets/portrait.jpg" alt="Portrait of Anant Jamuar" width="124" height="124"><h1>usually building something.</h1><p>i’m anant, an engineering student in bengaluru.</p><p>most of what i learn starts with something i want to build. sometimes it’s something i’d find useful, sometimes i just want to see if i can make it work. i like being able to try an idea instead of leaving it as a thought, and figuring things out as i go is a big part of why i keep doing it.</p><section class="detail-section"><h2>what i’m into lately</h2><div class="side-quests"><span>spotify • lanterns on hbo • taking part in hackathons</span><span>learning go and backend engineering • working on curieon</span><span>writing a paper on machine learning for structural health monitoring</span></div></section><section class="detail-section"><h2>experience.</h2><h3>ai/ml intern · svasthiya technologies</h3><p class="case-note">february to june 2026 · bengaluru</p></section><section class="detail-section"><h2>education.</h2><h3>b.e. in electronics and communication engineering</h3><p class="case-note">sir m. visvesvaraya institute of technology · expected august 2027</p></section><section class="detail-section"><h2>skills.</h2><ul class="tech-stack"><li><img src="/assets/tech/python.svg" alt="" width="22" height="22" loading="lazy"><span>python</span></li><li><img src="/assets/tech/typescript.svg" alt="" width="22" height="22" loading="lazy"><span>typescript</span></li><li><img src="/assets/tech/pytorch.svg" alt="" width="22" height="22" loading="lazy"><span>pytorch</span></li><li><img src="/assets/tech/cplusplus.svg" alt="" width="22" height="22" loading="lazy"><span>c++</span></li><li><img src="/assets/tech/go.svg" alt="" width="22" height="22" loading="lazy"><span>go</span></li><li><img src="/assets/tech/fastapi.svg" alt="" width="22" height="22" loading="lazy"><span>fastapi</span></li><li><img src="/assets/tech/nextdotjs.svg" alt="" width="22" height="22" loading="lazy"><span>next.js</span></li><li><img src="/assets/tech/postgresql.svg" alt="" width="22" height="22" loading="lazy"><span>postgresql</span></li><li><img src="/assets/tech/docker.svg" alt="" width="22" height="22" loading="lazy"><span>docker</span></li><li><img src="/assets/tech/react.svg" alt="" width="22" height="22" loading="lazy"><span>react</span></li><li><img src="/assets/tech/playwright.svg" alt="" width="22" height="22" loading="lazy"><span>playwright</span></li></ul></section><section class="detail-section"><h2>say hello.</h2><a class="pill" href="/contact/">say hello</a></section>''',
    ),
    "contact": (
        "Say hello",
        "Get in touch with Anant Jamuar about AI engineering, real-time systems, or an interesting problem.",
        '''<span class="section-label">come say hi</span><h1>maybe we should build something</h1><p>i’m looking for early career roles and small projects i can care about. if you think i could help, i’d love to hear what you’re working on.</p><div class="contact-note"><p><a href="mailto:jamuaranant@gmail.com">jamuaranant@gmail.com</a></p><p><a href="https://www.linkedin.com/in/jamuaranant/" target="_blank" rel="noreferrer">linkedin ↗</a> · <a href="https://github.com/ActiveAngrily" target="_blank" rel="noreferrer">github ↗</a></p><p class="case-note">based in bengaluru, india.</p></div>''',
    ),
}

cases = [
    (
        "red-letter",
        "Red Letter",
        "News from different sources, brought together in one clear story.",
        "project · autonomous news",
        "Red Letter follows a story from discovery to a finished, multi-source report without waiting for an editor to move it along.",
        "Independent project · June to July 2026",
        "Multi-agent systems",
        "Red Letter",
        [("Publishers", "22"), ("Entry points", "46"), ("Agent personas", "8"), ("URLs per publisher", "up to 60")],
        "News pages arrive in every shape imaginable. Stories repeat across outlets, important context gets split between sources, and some pages would rather talk to a browser than a scraper.",
        "I split the system into 3 stages: discovery, extraction, and clustering. Playwright and Cheerio collect the reporting, Gemini embeds prose in batches of 90, and a 0.82 cosine threshold groups coverage of the same event. A commander then routes each cluster to 1 of 8 tightly prompted personas, with JSON schemas keeping the handoffs predictable.",
        "The pipeline now serves a live Next.js frontend backed by Appwrite and scheduled through GitHub Actions. The useful lesson was simple: agents behave better when every handoff has a narrow job and a shape it must return.",
        ("visit Red Letter ↗", "https://redletter.cc.cd"),
    ),
    (
        "crucible",
        "Teaching a car to notice trouble",
        "Crucible is Anant's real-time CAN-bus intrusion detector with sub-15ms edge inference.",
        "project · edge ai",
        "Crucible listens to a vehicle’s CAN telemetry and raises a warning when the signals start behaving like an attack.",
        "Research project · November 2025 to January 2026",
        "Real-time anomaly detection",
        "Crucible",
        [("Telemetry signals", "11"), ("Sliding window", "50 timesteps"), ("Inference", "under 15 ms"), ("Risk levels", "3")],
        "A useful detector has a tiny window to react. It also has to separate an actual control injection from the ordinary noise of a moving vehicle.",
        "I trained a temporal convolutional network with 64 to 128 Conv1d channels, then compiled it with TorchScript and Core ML FP16 for constant-time edge inference. A ROS Melodic subscriber watches 11 signals and maps reconstruction error against a 0.3101 MSE baseline into 3 risk levels.",
        "I bridged CARLA on macOS to an x86 Linux Docker container and built an adversarial injection suite for packet spoofing, steering anomalies, and control hijacking. Breaking the detector on purpose made the real-time path much easier to trust.",
        ("view the code ↗", "https://github.com/ActiveAngrily/can-tcn-anomaly"),
    ),
    (
        "latent-diffusion",
        "growing synthetic tumours in latent space",
        "Anant's 2-stage latent diffusion pipeline for synthetic brain MRI generation using BraTS 2020 data.",
        "project · medical imaging",
        "This research project uses latent diffusion to generate synthetic brain MRI scans from the BraTS 2020 dataset.",
        "Research project · March to April 2026",
        "Synthetic medical imaging",
        "Latent diffusion pipeline",
        [("Training data", "24,000+ slices"), ("Stages", "2"), ("Compression", "AutoencoderKL"), ("Denoiser", "UNet")],
        "Full-resolution MRI scans are expensive to model directly. The useful structure still needs to survive any compression step, especially around the tumour region.",
        "I trained an AutoencoderKL to compress the scans into a smaller latent space, then trained a UNet diffusion model to generate there. Splitting reconstruction from generation made the experiment easier to train and inspect.",
        "The result is a complete 2-stage PyTorch pipeline for studying synthetic tumour generation. It gave me a practical feel for the gap between a tidy diffusion diagram and the work of preparing 24,000+ medical image slices.",
        ("view the code ↗", "https://github.com/ActiveAngrily/latent-diffusion-tumor-synthesis"),
    ),
]

def flow(labels):
    return '<ol class="system-flow">' + ''.join(f'<li><span>{i:02}</span>{label}</li>' for i, label in enumerate(labels, 1)) + '</ol>'

visuals = {
    "red-letter": ('One story, many sources.', '<div class="newspaper-title">red letter<span>the autonomous edition</span></div>' + flow(['Discover', 'Extract', 'Cluster', 'Route persona', 'Report']), '22 publishers → 46 entry points → 8 editorial personas. A schematic of the reporting pipeline.', ('The same story, scattered everywhere.', 'An editor at every handoff.', 'From a cluster to a live newspaper.')),
    "crucible": ('A small window to notice trouble.', '<div class="visual-kicker">can telemetry / illustrative signal</div><svg class="telemetry" viewBox="0 0 400 100" aria-hidden="true"><path class="signal-grid" d="M0 25H400 M0 50H400 M0 75H400 M80 0V100 M160 0V100 M240 0V100 M320 0V100"/><rect x="240" y="0" width="80" height="100" fill="currentColor" opacity=".08"/><path class="signal-line" d="M0 54L20 52 35 58 50 49 70 54 90 52 110 57 130 50 150 53 170 48 190 56 210 52 230 54 245 20 260 79 275 12 290 65 305 45 325 52 345 49 365 55 385 51 400 53"/></svg>' + flow(['11 can signals', '50-step window', 'tcn error', 'risk level']) + '<div class="risk-levels"><span>low</span><span>elevated</span><span>high</span></div>', 'Illustrative signal, not a measured trace. A 50-step window feeds reconstruction error into three risk levels.', ('Milliseconds matter at the edge.', 'Measure what the model cannot reconstruct.', 'Test the detector by attacking it.')),
    "latent-diffusion": ('Learn a smaller space. Generate there.', '<div class="visual-kicker">01 / learn the representation</div>' + flow(['mri input', 'autoencoderkl', 'latent space']) + '<div class="latent-space" aria-hidden="true">' + '<i></i>' * 24 + '</div><div class="visual-kicker">02 / learn to generate</div>' + flow(['Latent diffusion · UNet', 'Decoder', 'Synthetic output']), 'Two-stage schematic, not generated MRI results. Compression is learned before diffusion models the latent representation.', ('Compression has to preserve useful structure.', 'Separate reconstruction from generation.', 'The pipeline is only part of the experiment.')),
}

for index, (slug, title, description, label, intro, project_type, focus, preview, rows, challenge, solution, reflection, link) in enumerate(cases):
    visual_title, visual, caption, headings = visuals[slug]
    link_html = f'<a class="pill" href="{link[1]}" target="_blank" rel="noreferrer">{link[0]}</a>' if link else '<span class="project-status">in progress</span>'
    evidence = ''.join(f'<div><dt>{name}</dt><dd>{value}</dd></div>' for name, value in rows)
    next_case = cases[(index + 1) % len(cases)]
    sections = ''.join(f'<section class="detail-section"><span class="section-label">{tag}</span><h2>{heading}</h2><p>{copy}</p></section>' for tag, heading, copy in zip(['the problem', 'engineering decisions', 'outcome & reflection'], headings, [challenge, solution, reflection]))
    pages['work/' + slug] = (title, description, f'''<article class="case-study {slug}"><a class="back-link top-back" href="/">← all work</a><span class="section-label case-category">{label}</span><h1>{title}</h1><p class="case-intro">{intro}</p><dl class="details-grid"><div><dt>role / dates</dt><dd>{project_type}</dd></div><div><dt>focus</dt><dd>{focus}</dd></div></dl>{link_html}<figure class="project-visual"><h2>{visual_title}</h2>{visual}<figcaption>{caption}</figcaption></figure><dl class="project-evidence">{evidence}</dl>{sections}<a class="next-project" href="/work/{next_case[0]}/"><span>next project →</span><strong>{next_case[1]}</strong></a></article>''')

pages["work/red-letter"] = (
    "Red Letter",
    "News from different sources, brought together in one clear story.",
    (source / "red_letter.html").read_text(),
)

pages["work/crucible"] = (
    "Crucible",
    "A real-time security system that watches a vehicle’s internal network for unusual activity and possible attacks.",
    (source / "crucible.html").read_text(),
)

pages["work/latent-diffusion"] = (
    "growing synthetic tumours in latent space",
    "Using latent diffusion to generate synthetic brain MRI slices.",
    '''<article class="case-study latent-diffusion">
<a class="back-link top-back" href="/">← all work</a>
<span class="section-label case-category">project · medical imaging</span>
<h1>growing synthetic tumours in latent space</h1>
<p class="case-note">research project · march to april 2026</p>
<div class="project-links"><a class="pill" href="https://github.com/ActiveAngrily/latent-diffusion-tumor-synthesis" target="_blank" rel="noreferrer">view the code ↗</a></div>
<section class="detail-section"><h2>abstract</h2>
<p>this project explores latent diffusion as a way to create synthetic brain mri slices when medical imaging data is limited. it preprocesses flair volumes from the brats 2020 dataset, learns a compressed representation with an autoencoderkl, and trains a u-net diffusion model in that latent space.</p></section>
<section class="detail-section"><h2>built with</h2>
<ul class="tech-stack"><li><img src="/assets/tech/python.svg" alt="" width="22" height="22" loading="lazy"><span>python</span></li><li><img src="/assets/tech/pytorch.svg" alt="" width="22" height="22" loading="lazy"><span>pytorch</span></li><li><span class="tech-monogram" aria-hidden="true">m</span><span>monai</span></li><li><span class="tech-monogram" aria-hidden="true">n</span><span>numpy</span></li><li><span class="tech-monogram" aria-hidden="true">n</span><span>nibabel</span></li></ul></section>
<a class="next-project" href="/work/red-letter/"><span>next project →</span><strong>red letter</strong></a>
</article>''',
)

for path, (title, description, body) in pages.items():
    page = shell.replace("<body>", '<body class="detail">')
    page = re.sub(r"<title>.*?</title>", f"<title>{title} · anant jamuar</title>", page)
    page = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{description}">', page)
    page = re.sub(
        r'<main id="content" tabindex="-1">.*?</main>',
        '<main id="content" tabindex="-1">' + body + ('<a class="back-link" href="/">← back to work</a>' if not path.startswith('work/') else '') + '</main>',
        page,
        flags=re.S,
    )
    destination = root / path / "index.html"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(page)

print(f"Generated {len(pages)} detail pages.")
