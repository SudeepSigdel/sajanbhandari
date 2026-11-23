(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  // Only allow safe link schemes; everything is inserted via textContent / properties.
  function safeUrl(u) {
    u = String(u || '').trim();
    if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(u)) return u;
    if (/^[\w-]+(\/|\.)/.test(u) && !/^[a-z]+:/i.test(u)) return u;
    return '';
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function str(v) { return typeof v === 'string' ? v.trim() : ''; }
  function arr(v) { return Array.isArray(v) ? v : []; }

  function hideSection(id) {
    var s = $(id); if (s) s.hidden = true;
    var a = document.querySelector('.masthead nav a[href="#' + id + '"]'); if (a) a.hidden = true;
  }

  function setFact(id, value) {
    var box = $('fact-' + id);
    if (value) box.querySelector('dd').textContent = value; else box.hidden = true;
  }

  function renderHero(d) {
    var name = str(d.name);
    $('name').textContent = name;
    $('brand-name').textContent = name;
    $('brand').textContent = name ? name.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase() : 'SB';
    $('tagline').hidden = !str(d.tagline);
    $('tagline').textContent = str(d.tagline);
    setFact('role', str(d.role));
    setFact('location', str(d.location));
    setFact('availability', str(d.availability));
    if ($('facts').querySelectorAll('.fact:not([hidden])').length === 0) $('facts').hidden = true;

    var src = safeUrl(d.avatar);
    if (src) {
      var img = el('img'); img.src = src; img.alt = name; img.width = 800; img.height = 1000;
      $('avatar').appendChild(img); $('avatar').hidden = false;
      document.querySelector('.hero').classList.remove('hero--solo');
    }
  }

  function renderAbout(a) {
    a = a || {};
    var heading = str(a.heading), paras = arr(a.paragraphs).map(str).filter(Boolean);
    if (!heading && !paras.length) { hideSection('about'); return; }
    $('about-heading').textContent = heading; $('about-heading').hidden = !heading;
    paras.forEach(function (p) { $('about-body').appendChild(el('p', null, p)); });
  }

  function bindHighlight(scope) {
    function toggle(n, on) {
      scope.querySelectorAll('[data-n="' + n + '"]').forEach(function (n2) { n2.classList.toggle('is-on', on); });
    }
    scope.querySelectorAll('[data-n]').forEach(function (node) {
      var n = node.getAttribute('data-n');
      node.addEventListener('mouseenter', function () { toggle(n, true); });
      node.addEventListener('mouseleave', function () { toggle(n, false); });
      node.addEventListener('focus', function () { toggle(n, true); });
      node.addEventListener('blur', function () { toggle(n, false); });
    });
  }

  function renderSkills(raw) {
    var groups = arr(raw).map(function (g) {
      return { group: str(g && g.group), items: arr(g && g.items).map(str).filter(Boolean) };
    }).filter(function (g) { return g.items.length; });
    if (!groups.length) { hideSection('skills'); return; }

    var n = 1;
    groups.forEach(function (g) { g.nums = g.items.map(function () { return n++; }); });

    var pitchOk = groups.length <= 5 && groups.every(function (g) { return g.items.length <= 6; });
    var section = $('skills'), squad = $('squad');

    groups.forEach(function (g) {
      var box = el('div', 'squad-group');
      var h = el('h3', null, g.group); h.appendChild(document.createTextNode(' '));
      h.appendChild(el('span', 'count', '(' + g.items.length + ')'));
      box.appendChild(h);
      var ul = el('ul');
      g.items.forEach(function (item, i) {
        var li = el('li'); li.setAttribute('data-n', g.nums[i]);
        if (pitchOk) li.tabIndex = 0;
        li.appendChild(el('span', 'num', String(g.nums[i]))); li.appendChild(el('span', 'name', item));
        ul.appendChild(li);
      });
      box.appendChild(ul); squad.appendChild(box);
    });

    if (!pitchOk) {
      $('pitch').hidden = true; section.classList.add('teamsheet--list');
      $('ts-note').textContent = 'Skills grouped by area.';
      return;
    }

    var lines = $('formation-lines');
    groups.slice().reverse().forEach(function (g, i) {
      var fl = el('div', 'fl'); fl.style.setProperty('--i', i);
      g.items.forEach(function (item, j) {
        var dot = el('span', 'dot'); dot.setAttribute('data-n', g.nums[j]);
        dot.appendChild(el('span', 'dot-num', String(g.nums[j])));
        var lab = el('span', 'dot-label', item); lab.title = item; dot.appendChild(lab);
        fl.appendChild(dot);
      });
      fl.appendChild(el('span', 'fl-label', g.group));
      lines.appendChild(fl);
    });

    if (groups.length >= 2) {
      $('formation-figure').textContent = groups.slice().reverse().map(function (g) { return g.items.length; }).join('-');
      $('formation').hidden = false;
    }
    bindHighlight(section.querySelector('.teamsheet-grid'));

    var pitch = $('pitch');
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if ('IntersectionObserver' in window && !reduce) {
      pitch.classList.add('is-armed');
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { pitch.classList.add('is-live'); io.disconnect(); }
      }, { threshold: 0.35 });
      io.observe(pitch);
    }
  }

  function renderProjects(raw) {
    var list = arr(raw).filter(function (p) { return p && (str(p.title) || str(p.description)); });
    if (!list.length) { hideSection('work'); return; }
    list.forEach(function (p) {
      var li = el('li'), art = el('article', 'report');
      var url = safeUrl(p.url), img = safeUrl(p.image);

      var h = el('h3', 'report-title');
      if (url) {
        var a = el('a', null, str(p.title)); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.appendChild(el('span', 'sr-only', ' (opens in a new tab)')); h.appendChild(a);
      } else h.textContent = str(p.title);

      var body = el('div', 'report-body');
      if (str(p.description)) body.appendChild(el('p', null, str(p.description)));
      var tags = arr(p.tags).map(str).filter(Boolean);
      if (tags.length) body.appendChild(el('p', 'report-tags small', 'Built with ' + tags.join(', ')));

      if (img) {
        var fig = el('figure', 'report-media'), im = el('img');
        im.src = img; im.alt = ''; im.loading = 'lazy'; im.width = 640; im.height = 400; fig.appendChild(im);
        body.insertBefore(h, body.firstChild); art.appendChild(fig); art.appendChild(body);
      } else {
        art.classList.add('report--text'); art.appendChild(h); art.appendChild(body);
      }
      li.appendChild(art); $('projects').appendChild(li);
    });
  }

  function cell(tag, cls, label, value) {
    var c = el(tag, cls); c.setAttribute('data-label', label);
    if (tag === 'th') c.scope = 'row';
    if (value) c.textContent = value;
    else { c.textContent = '—'; c.setAttribute('aria-label', 'Not given'); }
    return c;
  }
  function renderExperience(raw) {
    var rows = arr(raw).filter(function (x) { return x && (str(x.role) || str(x.org)); });
    if (!rows.length) { hideSection('experience'); return; }
    rows.forEach(function (x) {
      var tr = el('tr');
      tr.appendChild(cell('td', 'season', 'Season', str(x.period)));
      tr.appendChild(cell('th', null, 'Role', str(x.role)));
      tr.appendChild(cell('td', null, 'Team', str(x.org)));
      tr.appendChild(cell('td', 'summary', 'Summary', str(x.summary)));
      $('experience-list').appendChild(tr);
    });
  }

  function renderContact(d) {
    var email = str(d.email);
    if (email) {
      var m = $('mail'); m.textContent = email; m.href = 'mailto:' + encodeURIComponent(email).replace('%40', '@');
    } else { $('mail').hidden = true; $('mail-intro').hidden = true; }
    var n = 0;
    arr(d.socials).forEach(function (s) {
      var u = safeUrl(s && s.url); if (!u) return;
      var li = el('li'), a = el('a', null, str(s.label) || u); a.href = u; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.appendChild(el('span', 'sr-only', ' (opens in a new tab)'));
      li.appendChild(a); $('socials').appendChild(li); n++;
    });
    if (!n) $('elsewhere').hidden = true;
    if (!email && !n) hideSection('contact');
  }

  function watchNav() {
    if (!('IntersectionObserver' in window)) return;
    var links = {};
    document.querySelectorAll('.masthead nav a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); });
        if (links[e.target.id]) links[e.target.id].setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(links).forEach(function (id) { var s = $(id); if (s && !s.hidden) io.observe(s); });
  }

  function render(d) {
    d = d || {};
    if (d.meta) {
      if (str(d.meta.title)) document.title = d.meta.title;
      var md = document.querySelector('meta[name="description"]');
      if (md && str(d.meta.description)) md.content = d.meta.description;
    }
    renderHero(d);
    renderAbout(d.about);
    renderSkills(d.skills);
    renderProjects(d.projects);
    renderExperience(d.experience);
    renderContact(d);
    if ($('work').hidden) $('cta-work').hidden = true;
    $('copy').textContent = '© ' + new Date().getFullYear() + (str(d.name) ? ' ' + str(d.name) : '');
    watchNav();
  }

  fetch('content/site.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(render)
    .catch(function () {
      $('tagline').hidden = false;
      $('tagline').textContent = 'Content failed to load. Refresh to try again.';
    });
})();
