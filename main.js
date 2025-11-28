document.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // فتح Google Form في تبويب جديد
  function openForm(url){
    if(!url || url.includes('REPLACE_WITH_YOUR_FORM')){
      alert('سيتم فتح التسجيل قريبا');
      return;
    }
    window.open(url, '_blank', 'noopener');
  }

  // ربط أزرار التسجيل الأساسية
  $('#hero-cta')?.addEventListener('click', e => openForm(e.currentTarget.dataset.formUrl));
  $('#register-btn')?.addEventListener('click', e => openForm(e.currentTarget.dataset.formUrl));

  // قائمة الجوال (mobile) بسيطة: إظهار/إخفاء nav.topnav عند الضغط
  const mobileToggle = $('#mobile-toggle');
  if(mobileToggle){
    mobileToggle.addEventListener('click', () => {
      const nav = document.querySelector('.topnav');
      if(!nav) return;
      nav.classList.toggle('show-mobile');
      // accessible toggle
      mobileToggle.setAttribute('aria-expanded', nav.classList.contains('show-mobile'));
    });
  }

  // FAQ accordion
  $$('.faq .faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    const panel = item.querySelector('.faq-a');
    if(!btn || !panel) return;
    panel.style.display = 'none';
    btn.addEventListener('click', () => {
      const open = panel.style.display === 'block';
      // إغلاق الكل ثم فتح المطلوب
      $$('.faq .faq-a').forEach(p => { p.style.display = 'none'; });
      if(!open) panel.style.display = 'block';
    });
  });

  // Expand/collapse challenge details (cards)
  const challengesGrid = $('#challenges-grid');
  if(challengesGrid){
    challengesGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.challenge-card');
      if(!card) return;
      const detail = card.querySelector('.challenge-detail');
      if(!detail) return;
      if(detail.style.maxHeight && detail.style.maxHeight !== '0px'){
        detail.style.maxHeight = '0';
        detail.style.opacity = '0';
      } else {
        detail.style.opacity = '1';
        detail.style.maxHeight = detail.scrollHeight + 'px';
      }
    });
  }

  // Filters for challenges
  const filterButtons = $$('#filters .filter-btn');
  const challengeCards = $$('#challenges-grid .challenge-card');
  function applyFilter(cat){
    challengeCards.forEach(c => {
      const ccat = c.dataset.category || 'other';
      c.style.display = (cat === 'all' || ccat === cat) ? '' : 'none';
    });
    updateStats();
  }
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active', 'bg-primary', 'text-white'));
      btn.classList.add('active', 'bg-primary', 'text-white');
      applyFilter(btn.dataset.filter);
    });
  });
  // default
  if(filterButtons.length) applyFilter('all');

  // Stats: إجمالي وعدد المتاحين
  function updateStats(){
    const total = challengeCards.length;
    const visible = challengeCards.filter(c => c.style.display !== 'none').length;
    if($('#stat-total')) $('#stat-total').textContent = total;
    if($('#stat-visible')) $('#stat-visible').textContent = visible;
  }
  updateStats();

  // Reveal on scroll (lightweight)
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if(en.isIntersecting) {
        en.target.classList.add('reveal-visible');
        obs.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  // observe all revealable
  $$('.reveal').forEach(el => obs.observe(el));

  // small accessibility: keyboard toggle FAQ
  $$('.faq .faq-q').forEach(btn => {
    btn.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
    });
  });

});

// ===== Added: leaderboard support =====
(function(){
  // load leaderboard from localStorage or return sample data
  function loadLeaderboard(){
    try{
      const raw = localStorage.getItem('cc2025_leaderboard');
      if(!raw) return sampleLeaderboard();
      const data = JSON.parse(raw);
      if(!Array.isArray(data) || data.length === 0) return sampleLeaderboard();
      return data.slice(0,3);
    }catch(e){
      return sampleLeaderboard();
    }
  }
  function sampleLeaderboard(){
    return [
      { name: '####', score: 0 },
      { name: '####', score: 0 },
      { name: '####', score: 0 }
    ];
  }

  function renderLeaderboard(){
    const rows = loadLeaderboard();
    const tbody = document.querySelector('#leaderboard tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    rows.forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${idx+1}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(String(r.score))}</td>`;
      tbody.appendChild(tr);
    });
  }

  // small helper to avoid XSS when injecting data
  function escapeHtml(s){
    return s.replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; });
  }

  // expose update function to window in case other scripts want to update leaderboard
  window.cc2025 = window.cc2025 || {};
  window.cc2025.renderLeaderboard = renderLeaderboard;

  // render on DOM ready (if main.js DOMContentLoaded wrapped earlier, ensure this runs after)
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', renderLeaderboard);
  } else {
    renderLeaderboard();
  }
})();

// محاولة تحميل الصورة من مسارات متعددة محددة في attribute data-srcs
document.addEventListener('DOMContentLoaded', function () {
  const tryResolveImage = (img) => {
    const list = (img.dataset.srcs || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!list.length) return;
    let i = 0;
    const tryNext = () => {
      if (i >= list.length) return;
      const candidate = list[i++];
      const tester = new Image();
      tester.onload = () => {
        img.src = candidate;
        img.classList.add('resolved');
      };
      tester.onerror = () => {
        tryNext();
      };
      tester.src = candidate;
    };
    tryNext();
  };

  document.querySelectorAll('img[data-srcs]').forEach(img => tryResolveImage(img));
});

// ===== Try loading hero images from multiple candidate paths =====
document.addEventListener('DOMContentLoaded', () => {
  const img = document.getElementById('hero-img');
  if (!img) return;

  const raw = img.dataset.srcs || '';
  const candidates = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (candidates.length === 0) return;

  // base directory of the current document (ends with '/')
  const base = (() => {
    try {
      const p = window.location.pathname;
      return p.substring(0, p.lastIndexOf('/') + 1);
    } catch (e) { return './'; }
  })();

  // build a list of variants to try
  const variants = [];
  candidates.forEach(c => {
    const n = c.replace(/\\/g, '/'); // normalize backslashes
    variants.push(n);
    if (!/^(https?:|\/)/.test(n)) {
      variants.push(base + n);
      variants.push('./' + n);
      variants.push('../' + n);
    }
  });
  // dedupe
  const list = Array.from(new Set(variants));

  let idx = 0;
  const tryNext = () => {
    if (idx >= list.length) {
      // fallback: show alt text / remove loader
      img.alt = 'الصورة غير متاحة';
      img.classList.add('not-found');
      return;
    }
    const candidate = list[idx++];
    const tester = new Image();
    tester.onload = () => {
      img.src = candidate;
      img.classList.add('resolved');
    };
    tester.onerror = tryNext;
    tester.src = candidate;
  };

  tryNext();
});

document.addEventListener('DOMContentLoaded', function() {
  // Responsive nav (manages aria-expanded / aria-hidden)
  (function(){
    var nav = document.getElementById('topnav');
    var toggle = document.getElementById('nav-toggle');
    var menu = document.getElementById('topnav-menu');
    if (!nav || !toggle || !menu) return;

    function setOpen(open){
      if (open){
        nav.classList.add('open');
        toggle.setAttribute('aria-expanded','true');
        menu.setAttribute('aria-hidden','false');
      } else {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded','false');
        menu.setAttribute('aria-hidden','true');
      }
    }

    toggle.addEventListener('click', function(e){
      e.stopPropagation();
      setOpen(!nav.classList.contains('open'));
    });

    // close when clicking a link inside menu
    menu.addEventListener('click', function(e){
      var target = e.target;
      if (target.tagName.toLowerCase() === 'a' || target.classList.contains('cta-btn')){
        setOpen(false);
      }
    });

    // close menu when clicking outside
    document.addEventListener('click', function(e){
      if (!nav.contains(e.target)) setOpen(false);
    });

    // close on Escape
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') setOpen(false);
    });

    // ensure menu state resets on resize (desktop breakpoint)
    window.addEventListener('resize', function(){
      if (window.innerWidth > 992) setOpen(false);
    });
  })();

  // Hero image: try first available candidate from data-srcs
  (function(){
    var imgEl = document.getElementById('hero-img');
    if (!imgEl) return;

    // helper to test a candidate URL
    function testAndSet(url, onSuccess, onFailure){
      var tester = new Image();
      tester.onload = function(){
        onSuccess(url);
      };
      tester.onerror = function(){
        onFailure();
      };
      tester.src = url;
    }

    // if current src already loads, skip trying others
    var currentSrc = imgEl.getAttribute('src') || '';
    if (currentSrc) {
      testAndSet(currentSrc, function(url){
        imgEl.src = url;
      }, function(){
        // current failed -> try candidates
        tryCandidates();
      });
    } else {
      tryCandidates();
    }

    function tryCandidates(){
      var list = (imgEl.getAttribute('data-srcs') || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
      // add fallbacks
      ['./alrefa.jpg','alrefa.jpg','img/alrefa.jpg','assets/images/alrefa.jpg','assets/img/alrefa.jpg','Prog/img/alrefa.jpg'].forEach(function(p){
        if (list.indexOf(p) === -1) list.push(p);
      });
      // unique
      list = list.filter(function(item, pos){ return list.indexOf(item) === pos; });
      var i = 0;
      function next(){
        if (i >= list.length) return;
        var candidate = list[i++];
        testAndSet(candidate, function(url){
          imgEl.src = url;
        }, function(){
          setTimeout(next, 10);
        });
      }
      next();
    }
  })();
});
