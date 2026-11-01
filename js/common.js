/* सभी पेजों में साझा: हेडर, फ़ुटर, टॉप बार, हेल्पर फ़ंक्शन */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var S = window.SITE;
  var G = S.gaon;

  var U = {
    esc: function (s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    },
    $: function (sel, root) { return (root || document).querySelector(sel); },
    $$: function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); },
    digits: function (s) { return String(s || "").replace(/\D/g, ""); },
    parseDate: function (d) {
      if (!d) return null;
      var dt = new Date(d + "T00:00:00");
      return isNaN(dt) ? null : dt;
    },
    date: function (d, opts) {
      var dt = U.parseDate(d);
      if (!dt) return d ? U.esc(d) : "—";
      return dt.toLocaleDateString("hi-IN", opts || { day: "numeric", month: "long", year: "numeric" });
    },
    daysBetween: function (a, b) {
      var x = U.parseDate(a), y = U.parseDate(b);
      if (!x || !y) return null;
      return Math.max(0, Math.round((y - x) / 86400000));
    },
    rupees: function (n) {
      n = Number(n) || 0;
      if (n >= 10000000) return "₹" + (n / 10000000).toLocaleString("hi-IN", { maximumFractionDigits: 2 }) + " करोड़";
      if (n >= 100000) return "₹" + (n / 100000).toLocaleString("hi-IN", { maximumFractionDigits: 2 }) + " लाख";
      return "₹" + n.toLocaleString("en-IN");
    },
    initial: function (naam) {
      var t = String(naam || "").replace(/[\[\]]/g, "").trim();
      return t ? Array.from(t)[0] : "?";
    },
    avatar: function (photo, naam) {
      return photo
        ? '<img src="' + U.esc(photo) + '" alt="' + U.esc(naam) + '" loading="lazy">'
        : '<span class="avatar-letter">' + U.esc(U.initial(naam)) + "</span>";
    },
    statusClass: function (s) {
      return { "पूर्ण": "ok", "समाधान": "ok", "प्रगति पर": "warn", "दर्ज": "info", "प्रस्तावित": "info" }[s] || "info";
    },
    statusIcon: function (s) {
      return { "पूर्ण": "✔", "समाधान": "✔", "प्रगति पर": "⏳", "दर्ज": "📝", "प्रस्तावित": "📐" }[s] || "•";
    },
    badge: function (s) {
      return '<span class="badge ' + U.statusClass(s) + '">' + U.statusIcon(s) + " " + U.esc(s) + "</span>";
    },
    waLink: function (text) {
      return "https://wa.me/" + U.digits(S.sampark.whatsapp) + (text ? "?text=" + encodeURIComponent(text) : "");
    },
    chips: function (container, values, onChange, allLabel) {
      allLabel = allLabel || "सभी";
      container.innerHTML = [allLabel].concat(values).map(function (v, i) {
        return '<button type="button" class="chip' + (i === 0 ? " active" : "") + '" data-v="' + U.esc(v) + '">' + U.esc(v) + "</button>";
      }).join("");
      container.addEventListener("click", function (e) {
        var b = e.target.closest(".chip");
        if (!b) return;
        U.$$(".chip", container).forEach(function (c) { c.classList.remove("active"); });
        b.classList.add("active");
        onChange(b.getAttribute("data-v") === allLabel ? null : b.getAttribute("data-v"));
      });
    },
    unique: function (arr) {
      return arr.filter(function (v, i) { return v && arr.indexOf(v) === i; });
    },
    // पहले/बाद स्लाइडर
    beforeAfter: function (pehle, baad, caption) {
      return '<div class="ba" style="--pos:50%">' +
        '<img class="ba-after" src="' + U.esc(baad) + '" alt="बाद में: ' + U.esc(caption) + '" loading="lazy">' +
        '<div class="ba-before"><img src="' + U.esc(pehle) + '" alt="पहले: ' + U.esc(caption) + '" loading="lazy"></div>' +
        '<span class="ba-tag ba-tag-l">पहले</span><span class="ba-tag ba-tag-r">बाद में</span>' +
        '<div class="ba-handle" aria-hidden="true"><span>⇆</span></div>' +
        '<input type="range" min="0" max="100" value="50" aria-label="पहले और बाद की तुलना">' +
        "</div>";
    },
    bindBeforeAfter: function (root) {
      U.$$(".ba input", root).forEach(function (r) {
        r.addEventListener("input", function () { r.parentNode.style.setProperty("--pos", r.value + "%"); });
      });
    },
    lightbox: function (src, caption) {
      var lb = U.$("#lightbox");
      U.$("img", lb).src = src;
      U.$("img", lb).alt = caption || "";
      U.$("p", lb).textContent = caption || "";
      lb.classList.add("open");
    },
    modal: function (html) {
      var m = U.$("#modal");
      U.$(".modal-body", m).innerHTML = html;
      m.classList.add("open");
      document.body.style.overflow = "hidden";
      U.$(".modal-close", m).focus();
    }
  };
  /* ---------- डेमो डेटाबेस (इसी ब्राउज़र में सेव) ---------- */
  U.db = {
    get: function (k, def) {
      try { var v = localStorage.getItem("gp-db-" + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; }
    },
    set: function (k, v) { localStorage.setItem("gp-db-" + k, JSON.stringify(v)); },
    reset: function () {
      Object.keys(localStorage).forEach(function (k) { if (k.indexOf("gp-db-") === 0 || k === "gp-meri-shikayat") localStorage.removeItem(k); });
    }
  };
  U.todayISO = function () {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };
  U.newId = function (prefix) {
    var d = new Date();
    return prefix + "-" + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(Date.now()).slice(-4);
  };
  // बेस सूची + नए रिकॉर्ड + एडमिन के बदलाव
  U.merged = function (key, base) {
    var extra = U.db.get(key + "-new", []);
    var ov = U.db.get(key + "-ov", {});
    return extra.concat(base).map(function (r) {
      return ov[r.id] ? Object.assign({}, r, ov[r.id]) : r;
    });
  };
  U.updateRecord = function (key, id, changes) {
    var extra = U.db.get(key + "-new", []);
    var found = false;
    extra.forEach(function (r) { if (r.id === id) { Object.assign(r, changes); found = true; } });
    if (found) { U.db.set(key + "-new", extra); return; }
    var ov = U.db.get(key + "-ov", {});
    ov[id] = Object.assign(ov[id] || {}, changes);
    U.db.set(key + "-ov", ov);
  };
  U.addRecord = function (key, rec) {
    var extra = U.db.get(key + "-new", []);
    extra.unshift(rec);
    U.db.set(key + "-new", extra);
  };
  U.notices = function () {
    return U.db.get("suchna-new", []).concat(S.suchnayen).sort(function (a, b) { return a.tarikh < b.tarikh ? 1 : -1; });
  };

  window.U = U;

  /* ---------- नेविगेशन ---------- */
  var NAV = [
    { href: "index.html", label: "होम", id: "home" },
    { label: "पंचायत", children: [
      { href: "parichay.html", label: "गाँव परिचय", id: "parichay", icon: "🏡" },
      { href: "panchayat.html", label: "हमारी पंचायत", id: "panchayat", icon: "👥" },
      { href: "gramsabha.html", label: "ग्राम सभा व निर्णय", id: "gramsabha", icon: "🏛️" },
      { href: "bajat.html", label: "बजट व पारदर्शिता", id: "bajat", icon: "📊" },
      { href: "labharthi.html", label: "लाभार्थी सूची", id: "labharthi", icon: "📋" }
    ] },
    { label: "सेवाएँ", children: [
      { href: "yojana.html", label: "सरकारी योजनाएँ", id: "yojana", icon: "🏛️" },
      { href: "aavedan.html", label: "ऑनलाइन आवेदन", id: "aavedan", icon: "🖊️" },
      { href: "sevayen.html", label: "प्रमाण पत्र व सेवाएँ", id: "sevayen", icon: "📄" },
      { href: "downloads.html", label: "डाउनलोड", id: "downloads", icon: "⬇️" }
    ] },
    { href: "vikas.html", label: "विकास कार्य", id: "vikas" },
    { label: "जानकारी", children: [
      { href: "suchna.html", label: "सूचना पट", id: "suchna", icon: "📢" },
      { href: "samachar.html", label: "गाँव समाचार", id: "samachar", icon: "📰" },
      { href: "kisan.html", label: "किसान: मंडी भाव व मौसम", id: "kisan", icon: "🌾" },
      { href: "rozgar.html", label: "रोज़गार व प्रशिक्षण", id: "rozgar", icon: "💼" },
      { href: "swasthya.html", label: "स्वास्थ्य", id: "swasthya", icon: "🏥" }
    ] },
    { label: "गाँव", children: [
      { href: "pratibha.html", label: "गाँव की प्रतिभाएँ", id: "pratibha", icon: "🏆" },
      { href: "matdaan.html", label: "जनमत (सर्वे)", id: "matdaan", icon: "🗳️" },
      { href: "gallery.html", label: "फ़ोटो व वीडियो", id: "gallery", icon: "🖼️" },
      { href: "sampark.html", label: "संपर्क करें", id: "sampark", icon: "📞" }
    ] }
  ];
  var page = document.body.getAttribute("data-page");

  function navHTML() {
    return NAV.map(function (n) {
      if (n.children) {
        var active = n.children.some(function (c) { return c.id === page; });
        return '<div class="dropdown' + (active ? " active" : "") + '">' +
          '<button type="button" class="dropdown-btn" aria-expanded="false">' + n.label + ' <span aria-hidden="true">▾</span></button>' +
          '<div class="dropdown-menu">' + n.children.map(function (c) {
            return '<a href="' + c.href + '"' + (c.id === page ? ' class="active" aria-current="page"' : "") + ">" +
              '<span aria-hidden="true">' + c.icon + "</span> " + c.label + "</a>";
          }).join("") + "</div></div>";
      }
      return '<a href="' + n.href + '"' + (n.id === page ? ' class="active" aria-current="page"' : "") + ">" + n.label + "</a>";
    }).join("") + '<a href="shikayat.html" class="nav-cta' + (page === "shikayat" ? " active" : "") + '">📝 शिकायत दर्ज करें</a>';
  }

  var today = new Date().toLocaleDateString("hi-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  var header =
    (S.demoMode ? '<div class="demo-bar">🧪 डेमो वेबसाइट — यहाँ दिखाई गई जानकारी, नाम, नंबर व आँकड़े नमूने के तौर पर हैं।</div>' : "") +
    '<a href="#main" class="skip-link">मुख्य सामग्री पर जाएँ</a>' +
    '<div class="topbar"><div class="container topbar-inner">' +
      '<span>📅 ' + today + '</span>' +
      '<span class="topbar-right">' +
        '<a href="tel:' + U.digits(S.sampark.phone) + '">📞 ' + U.esc(S.sampark.phone) + '</a>' +
        '<a href="mailto:' + U.esc(S.sampark.email) + '" class="hide-sm">✉️ ' + U.esc(S.sampark.email) + '</a>' +
        '<span class="font-ctrl" role="group" aria-label="अक्षर का आकार">' +
          '<button type="button" data-fs="-1" aria-label="अक्षर छोटे करें">अ-</button>' +
          '<button type="button" data-fs="0" aria-label="सामान्य आकार">अ</button>' +
          '<button type="button" data-fs="1" aria-label="अक्षर बड़े करें">अ+</button>' +
        '</span>' +
        '<a href="admin.html" class="admin-link">🔐 लॉगिन</a>' +
      '</span>' +
    '</div></div>' +
    '<div class="tiranga" aria-hidden="true"><span></span><span></span><span></span></div>' +
    '<header class="header"><div class="container header-inner">' +
      '<a href="index.html" class="brand">' +
        '<span class="brand-emblem" aria-hidden="true"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#fff3e0" stroke="#e8891d" stroke-width="2"/><g fill="#0b5d3b"><path d="M10 34h28v3H10z"/><path d="M13 20h3v13h-3zM19 20h3v13h-3zM26 20h3v13h-3zM32 20h3v13h-3z"/><path d="M24 9 9 18h30z"/></g><circle cx="24" cy="15" r="2" fill="#e8891d"/></svg></span>' +
        '<span class="brand-text"><strong>ग्राम पंचायत ' + U.esc(G.naam) + '</strong>' +
        '<small>तहसील ' + U.esc(G.tehsil) + ' · ज़िला ' + U.esc(G.zila) + ' · ' + U.esc(G.rajya) + '</small></span>' +
      '</a>' +
      '<button class="menu-btn" type="button" aria-label="मेन्यू" aria-expanded="false"><span></span><span></span><span></span></button>' +
      '<nav class="nav" aria-label="मुख्य मेन्यू">' + navHTML() + '</nav>' +
    '</div></header>';

  var footer =
    '<footer class="footer">' +
      '<div class="container footer-grid">' +
        '<div><h3>ग्राम पंचायत ' + U.esc(G.naam) + '</h3><p>' + U.esc(G.tagline) + '</p>' +
          '<p class="muted-light">सरपंच: ' + U.esc(S.sarpanch.naam) + '<br>उप-सरपंच: ' + U.esc(S.upSarpanch.naam) + '</p></div>' +
        '<div><h3>त्वरित लिंक</h3><ul>' +
          '<li><a href="shikayat.html">शिकायत दर्ज करें</a></li>' +
          '<li><a href="shikayat.html#track">शिकायत की स्थिति देखें</a></li>' +
          '<li><a href="yojana.html">सरकारी योजनाएँ</a></li>' +
          '<li><a href="sevayen.html">प्रमाण पत्र व सेवाएँ</a></li>' +
          '<li><a href="aavedan.html">ऑनलाइन आवेदन</a></li>' +
          '<li><a href="bajat.html">बजट व पारदर्शिता</a></li>' +
          '<li><a href="admin.html">🔐 पंचायत लॉगिन</a></li></ul></div>' +
        '<div><h3>उपयोगी पोर्टल</h3><ul>' + S.portal.slice(0, 5).map(function (p) {
          return '<li><a href="' + U.esc(p.link) + '" target="_blank" rel="noopener">' + U.esc(p.naam) + ' ↗</a></li>';
        }).join("") + '</ul></div>' +
        '<div><h3>संपर्क</h3><p>📍 ' + U.esc(S.sampark.pata) + '</p>' +
          '<p>📞 <a href="tel:' + U.digits(S.sampark.phone) + '">' + U.esc(S.sampark.phone) + '</a></p>' +
          '<p>✉️ <a href="mailto:' + U.esc(S.sampark.email) + '">' + U.esc(S.sampark.email) + '</a></p>' +
          '<p>🕘 ' + U.esc(S.sampark.samay) + '</p></div>' +
      '</div>' +
      '<div class="footer-bottom"><div class="container footer-bottom-inner">' +
        '<span>© ' + new Date().getFullYear() + ' ग्राम पंचायत ' + U.esc(G.naam) + ', ज़िला ' + U.esc(G.zila) + ' (' + U.esc(G.rajya) + ')। सर्वाधिकार सुरक्षित।</span>' +
        '<a href="#top">ऊपर जाएँ ↑</a>' +
      '</div></div>' +
    '</footer>' +
    '<a class="wa-float" href="' + U.waLink("नमस्ते, ग्राम पंचायत " + G.naam + " — ") + '" target="_blank" rel="noopener" aria-label="WhatsApp पर संपर्क करें">' +
      '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path fill="#fff" d="M16 3C9 3 3.4 8.6 3.4 15.5c0 2.4.7 4.7 1.9 6.7L3 29l7-2.2c1.9 1 4 1.6 6.1 1.6 7 0 12.6-5.6 12.6-12.5S23 3 16 3zm0 22.9c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.1 1.3 1.3-4-.3-.4a10.3 10.3 0 0 1-1.6-5.6C5.5 9.8 10.2 5.1 16 5.1s10.5 4.7 10.5 10.4S21.8 25.9 16 25.9zm5.8-7.8c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.6 8.6 0 0 1-4.3-3.7c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.3z"/></svg>' +
    '</a>' +
    '<button class="to-top" type="button" aria-label="ऊपर जाएँ">↑</button>' +
    '<div class="lightbox" id="lightbox" role="dialog" aria-label="फ़ोटो"><button type="button" class="lb-close" aria-label="बंद करें">✕</button><img alt=""><p></p></div>' +
    '<div class="modal" id="modal" role="dialog" aria-modal="true"><div class="modal-box"><button type="button" class="modal-close" aria-label="बंद करें">✕</button><div class="modal-body"></div></div></div>';

  var h = document.getElementById("site-header");
  var f = document.getElementById("site-footer");
  if (h) h.outerHTML = header;
  if (f) f.outerHTML = footer;
  document.documentElement.id = "top";

  /* पेज हीरो (अंदर के पेजों के लिए) */
  var ph = U.$(".page-hero");
  if (ph) {
    ph.innerHTML = '<div class="container">' +
      '<nav class="breadcrumb" aria-label="आप यहाँ हैं"><a href="index.html">होम</a> <span>›</span> ' + U.esc(ph.getAttribute("data-title")) + "</nav>" +
      "<h1>" + U.esc(ph.getAttribute("data-title")) + "</h1>" +
      (ph.getAttribute("data-sub") ? "<p>" + U.esc(ph.getAttribute("data-sub")) + "</p>" : "") +
      "</div>";
  }
  document.title = (ph ? ph.getAttribute("data-title") + " | " : "") + "ग्राम पंचायत " + G.naam + ", " + G.zila;

  /* मोबाइल मेन्यू */
  var btn = U.$(".menu-btn"), nav = U.$(".nav");
  btn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    btn.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open);
  });
  U.$$(".dropdown-btn").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      var d = b.parentNode, open = !d.classList.contains("open");
      U.$$(".dropdown").forEach(function (x) { x.classList.remove("open"); });
      d.classList.toggle("open", open);
      b.setAttribute("aria-expanded", open);
    });
  });
  document.addEventListener("click", function () {
    U.$$(".dropdown").forEach(function (x) { x.classList.remove("open"); });
  });

  /* अक्षर का आकार */
  var fs = Number(localStorage.getItem("gp-fs") || 0);
  function applyFs() { document.documentElement.style.fontSize = (100 + fs * 10) + "%"; }
  applyFs();
  U.$$(".font-ctrl button").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = Number(b.getAttribute("data-fs"));
      fs = v === 0 ? 0 : Math.max(-1, Math.min(3, fs + v));
      localStorage.setItem("gp-fs", fs);
      applyFs();
    });
  });

  /* हेडर छाया व ऊपर जाएँ बटन */
  var hdr = U.$(".header"), toTop = U.$(".to-top");
  function onScroll() {
    var y = window.scrollY;
    hdr.classList.toggle("scrolled", y > 10);
    toTop.classList.toggle("show", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  /* लाइटबॉक्स व मोडल बंद करना */
  var lb = U.$("#lightbox"), md = U.$("#modal");
  lb.addEventListener("click", function () { lb.classList.remove("open"); });
  function closeModal() { md.classList.remove("open"); document.body.style.overflow = ""; }
  md.addEventListener("click", function (e) { if (e.target === md || e.target.closest(".modal-close")) closeModal(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { lb.classList.remove("open"); closeModal(); }
  });

  /* स्क्रॉल पर दिखने वाला एनिमेशन */
  window.revealAll = function () {
    var els = U.$$(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { io.observe(el); });
  };
})();
