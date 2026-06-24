// sections-3.jsx — Writing, Contact (merged w/ consulting mention), Footer

const { useEffect: useEffect3, useState: useState3 } = React;

// ————————————————————————————————————————————————
// WRITING
// ————————————————————————————————————————————————

function Writing() {
  const posts = [
    {
      n: '01',
      title: 'on the borrowed view',
      date: 'apr 2026',
      excerpt: 'why a suzhou garden and an im pei museum are, quietly, the same building.',
      reading: '6 min',
    },
    {
      n: '02',
      title: 'a year of sourdough, measured in disappointment',
      date: 'feb 2026',
      excerpt: 'what pastry school taught me about patience, and what my starter refused to.',
      reading: '8 min',
    },
    {
      n: '03',
      title: 'segmenting humans by the things they carry',
      date: 'nov 2025',
      excerpt: 'notes from three years of customer intelligence at a beauty company.',
      reading: '12 min',
    },
    {
      n: '04',
      title: 'how to pour water, slowly',
      date: 'aug 2025',
      excerpt: 'a short essay on the gongfu tea set my grandmother never let me touch.',
      reading: '4 min',
    },
  ];

  return (
    <section id="writing" className="section writing">
      <div className="container">
        <div className="section-head">
          <span className="section-index">04 /</span>
          <h2 className="section-en-big">writing</h2>
          <span className="section-en">essays &amp; notes</span>
        </div>

        <ul className="post-list">
          {posts.map((p, i) => (
            <li className="post" key={i}>
              <a href="#" className="post-link">
                <span className="post-n">{p.n}</span>
                <div className="post-body">
                  <h3 className="post-title">{p.title}</h3>
                  <p className="post-excerpt">{p.excerpt}</p>
                </div>
                <div className="post-meta">
                  <span>{p.date}</span>
                  <span>{p.reading}</span>
                </div>
                <span className="post-arrow" aria-hidden>→</span>
              </a>
            </li>
          ))}
        </ul>

        <a href="#" className="see-all">
          <span>see all essays</span>
          <span className="line" />
        </a>
      </div>
    </section>
  );
}

// ————————————————————————————————————————————————
// CONTACT — also the closing note + consulting tag
// ————————————————————————————————————————————————

function Contact() {
  const [copied, setCopied] = useState3(false);
  const email = 'hello@judyzhu.xyz';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <section id="contact" className="section contact">
      <div className="container">
        <div className="section-head alt">
          <span className="section-index">05 /</span>
          <h2 className="section-en-big">contact</h2>
          <span className="section-en">get in touch</span>
        </div>

        <div className="contact-body">
          <p className="contact-lede">
            come find me <br /><em>by the water.</em>
          </p>

          <p className="contact-sub">
            open to freelance projects in <em>customer intelligence</em>,
            <em> supply-chain analytics</em>, and cross-cultural <em>asia&nbsp;↔&nbsp;us</em> strategy.
            typically four to twelve weeks. conversations welcome before that.
          </p>

          <div className="contact-actions">
            <button className="contact-btn primary" onClick={copy}>
              <span>{copied ? 'copied' : email}</span>
              <span className="contact-btn-ico">{copied ? '✓' : '↗'}</span>
            </button>

            <div className="contact-links">
              <a href="#" className="contact-link">
                <span className="contact-link-label">instagram</span>
                <span className="contact-link-handle">@judyzhu</span>
                <span className="arr">↗</span>
              </a>
              <a href="#" className="contact-link">
                <span className="contact-link-label">substack</span>
                <span className="contact-link-handle">judyzhu</span>
                <span className="arr">↗</span>
              </a>
              <a href="#" className="contact-link">
                <span className="contact-link-label">linkedin</span>
                <span className="contact-link-handle">/in/judyzhu</span>
                <span className="arr">↗</span>
              </a>
              <a href="#" className="contact-link">
                <span className="contact-link-label">github</span>
                <span className="contact-link-handle">@judyzhu</span>
                <span className="arr">↗</span>
              </a>
            </div>
          </div>

          <div className="contact-note">
            <p>
              i usually reply on sunday mornings, over a second pour of coffee.
              thank you for your patience.
            </p>
          </div>

          <a href="./bakery.html" className="contact-surprise">
            <span className="contact-surprise-mark">✦</span>
            <span>
              <span className="contact-surprise-k">surprise</span>
              <span className="contact-surprise-v">visit the tiny bakery</span>
            </span>
            <span className="arr">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}

// ————————————————————————————————————————————————
// FOOTER
// ————————————————————————————————————————————————

function Footer() {
  return (
    <footer className="foot">
      <div className="container">
        <div className="foot-grid">
          <div className="foot-col">
            <span className="foot-name">judy zhu</span>
            <span className="foot-cn">星颖</span>
          </div>
          <div className="foot-col">
            <p>judyzhu.xyz</p>
            <p>mit license · © 2026</p>
          </div>
          <div className="foot-col">
            <p>boston · 41.36°n / 71.05°w</p>
            <p>en · 中文 · 日本語 · 上海话</p>
          </div>
          <div className="foot-col">
            <p className="foot-colophon">
              built on still water.<br />
              type: neue montreal, noto serif, jetbrains mono.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Writing, Contact, Footer });
