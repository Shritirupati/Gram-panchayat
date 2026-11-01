/* हर पेज की सामग्री यहाँ से बनती है (body का data-page देखकर) */
(function () {
  "use strict";
  var S = window.SITE, U = window.U, G = S.gaon;
  var esc = U.esc, $ = U.$, $$ = U.$$;
  var TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
  var TODAY_ISO = TODAY.getFullYear() + "-" + String(TODAY.getMonth() + 1).padStart(2, "0") + "-" + String(TODAY.getDate()).padStart(2, "0");

  function set(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; return el; }
  function isNew(d) { var dt = U.parseDate(d); return dt && (TODAY - dt) / 86400000 <= 10 && dt <= TODAY; }
  function isUpcoming(d) { var dt = U.parseDate(d); return dt && dt >= TODAY; }

  /* ================= शिकायत डेटा ================= */
  function parseCSV(text) {
    var rows = [], row = [], cur = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') q = false;
        else cur += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cur); rows.push(row); row = []; cur = "";
      } else cur += c;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    var head = (rows.shift() || []).map(function (h) { return h.trim().toLowerCase(); });
    return rows.filter(function (r) { return r.join("").trim(); }).map(function (r) {
      var o = {}; head.forEach(function (h, i) { o[h] = (r[i] || "").trim(); }); return o;
    });
  }
  function loadComplaints(cb) {
    if (!S.shikayatSheetCsv) return cb(S.shikayatein.slice());
    fetch(S.shikayatSheetCsv).then(function (r) { return r.text(); })
      .then(function (t) { cb(parseCSV(t)); })
      .catch(function () { cb(S.shikayatein.slice()); });
  }
  function complaintStats(list) {
    var s = { total: list.length, ok: 0, warn: 0, info: 0, days: [] };
    list.forEach(function (c) {
      if (c.sthiti === "समाधान") { s.ok++; var d = U.daysBetween(c.darj, c.hal); if (d != null) s.days.push(d); }
      else if (c.sthiti === "प्रगति पर") s.warn++;
      else s.info++;
    });
    s.avg = s.days.length ? (s.days.reduce(function (a, b) { return a + b; }, 0) / s.days.length) : 0;
    s.rate = s.total ? Math.round(s.ok / s.total * 100) : 0;
    return s;
  }
  function myComplaints() {
    try { return JSON.parse(localStorage.getItem("gp-meri-shikayat") || "[]"); } catch (e) { return []; }
  }

  /* ================= साझा टुकड़े ================= */
  function statTiles(items) {
    return items.map(function (a) {
      return '<div class="stat reveal"><span class="stat-icon" aria-hidden="true">' + esc(a.icon || "") + "</span><strong>" +
        esc(a.value) + "</strong><span>" + esc(a.label) + "</span></div>";
    }).join("");
  }
  function personCard(p, sub) {
    return '<div class="card person reveal"><div class="avatar">' + U.avatar(p.photo, p.naam) + "</div><h3>" +
      esc(p.naam) + "</h3><p>" + esc(sub || p.pad) + "</p></div>";
  }
  function noticeItem(n) {
    var dt = U.parseDate(n.tarikh);
    return '<article class="notice reveal">' +
      '<div class="date-block"><strong>' + (dt ? dt.getDate() : "") + "</strong><span>" +
      (dt ? dt.toLocaleDateString("hi-IN", { month: "short" }) : "") + "</span></div>" +
      '<div><div class="notice-meta"><span class="tag">' + esc(n.shreni || "सूचना") + "</span>" +
      (isNew(n.tarikh) || isUpcoming(n.tarikh) ? '<span class="new">नया</span>' : "") + "</div>" +
      "<h3>" + esc(n.shirshak) + "</h3><p>" + esc(n.vivaran) + "</p>" +
      (n.file ? '<a href="' + esc(n.file) + '" target="_blank" rel="noopener">📎 सूचना डाउनलोड करें</a>' : "") +
      "</div></article>";
  }
  function eventItem(k) {
    var dt = U.parseDate(k.tarikh);
    return '<li class="event"><div class="date-block small"><strong>' + (dt ? dt.getDate() : "") + "</strong><span>" +
      (dt ? dt.toLocaleDateString("hi-IN", { month: "short" }) : "") + "</span></div><div><h4>" + esc(k.naam) +
      "</h4><p>🕘 " + esc(k.samay) + " · 📍 " + esc(k.sthan) + "</p></div></li>";
  }
  function workCard(v, withBA) {
    var hasBA = withBA && v.pehle && v.baad;
    return '<article class="card work reveal" data-sthiti="' + esc(v.sthiti) + '" data-shreni="' + esc(v.shreni) + '">' +
      (hasBA ? U.beforeAfter(v.pehle, v.baad, v.kaam) : "") +
      '<div class="work-body"><div class="work-top">' + U.badge(v.sthiti) + '<span class="tag">' + esc(v.shreni) + "</span></div>" +
      "<h3>" + esc(v.kaam) + "</h3><p>" + esc(v.vivaran) + "</p>" +
      '<div class="progress" role="progressbar" aria-valuenow="' + v.pragati + '" aria-valuemin="0" aria-valuemax="100" aria-label="प्रगति">' +
      '<span style="width:' + v.pragati + '%"></span></div><div class="progress-label">प्रगति: <strong>' + v.pragati + "%</strong></div>" +
      '<dl class="work-meta">' +
      "<div><dt>📍 स्थान</dt><dd>" + esc(v.ward) + "</dd></div>" +
      "<div><dt>💰 लागत</dt><dd>" + U.rupees(v.lagat) + "</dd></div>" +
      "<div><dt>🏛️ योजना / मद</dt><dd>" + esc(v.yojana) + "</dd></div>" +
      "<div><dt>📅 " + (v.poorn ? "पूर्ण" : "शुरू") + "</dt><dd>" + (v.poorn ? U.date(v.poorn) : v.shuru ? U.date(v.shuru) : "—") + "</dd></div>" +
      "</dl></div></article>";
  }
  function schemeCard(y, i) {
    return '<article class="card scheme reveal"><div class="scheme-icon" aria-hidden="true">' + esc(y.icon) + "</div>" +
      '<span class="tag">' + esc(y.shreni) + "</span><h3>" + esc(y.naam) + "</h3><p>" + esc(y.vivaran) + "</p>" +
      '<button type="button" class="link-btn" data-yojana="' + i + '">पात्रता व दस्तावेज़ देखें →</button></article>';
  }
  function schemeModal(y) {
    return '<div class="modal-head"><span class="scheme-icon" aria-hidden="true">' + esc(y.icon) + "</span><div><span class=\"tag\">" +
      esc(y.shreni) + "</span><h2>" + esc(y.naam) + "</h2></div></div><p>" + esc(y.vivaran) + "</p>" +
      '<div class="two-list"><div><h3>✅ कौन ले सकता है लाभ</h3><ul class="check">' + y.patrata.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") +
      '</ul></div><div><h3>📄 ज़रूरी दस्तावेज़</h3><ul class="check">' + y.dastavez.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") +
      "</ul></div></div>" +
      '<h3>📝 आवेदन कैसे करें</h3><ol class="steps"><li>दस्तावेज़ लेकर पंचायत कार्यालय या ई-मित्र केंद्र पर जाएँ।</li><li>आवेदन फ़ॉर्म भरकर जमा करें और रसीद लें।</li><li>आवेदन की स्थिति पंचायत कार्यालय या पोर्टल पर देखें।</li></ol>' +
      '<div class="modal-actions">' + (y.link ? '<a class="btn btn-primary" href="' + esc(y.link) + '" target="_blank" rel="noopener">आधिकारिक वेबसाइट ↗</a>' : "") +
      '<a class="btn btn-outline" href="' + U.waLink("नमस्ते, मुझे \"" + y.naam + "\" के बारे में जानकारी चाहिए।") + '" target="_blank" rel="noopener">WhatsApp पर पूछें</a></div>';
  }
  function bindSchemeModals(root) {
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-yojana]");
      if (b) U.modal(schemeModal(S.yojanayen[Number(b.getAttribute("data-yojana"))]));
    });
  }
  function galleryItem(g) {
    return '<figure class="gallery-item reveal">' +
      (g.photo ? '<button type="button" class="gallery-btn" data-src="' + esc(g.photo) + '" data-cap="' + esc(g.caption) + '"><img src="' + esc(g.photo) + '" alt="' + esc(g.caption) + '" loading="lazy"></button>'
               : '<div class="placeholder"><span>📷</span><small>फ़ोटो जल्द</small></div>') +
      "<figcaption>" + esc(g.caption) + (g.album ? ' <span class="tag">' + esc(g.album) + "</span>" : "") + "</figcaption></figure>";
  }
  function bindGallery(root) {
    root.addEventListener("click", function (e) {
      var b = e.target.closest(".gallery-btn");
      if (b) U.lightbox(b.getAttribute("data-src"), b.getAttribute("data-cap"));
    });
  }
  // क्षैतिज बार चार्ट (एक श्रृंखला) — होवर पर टूलटिप, साथ में तालिका
  function barChart(items, valueFmt, unit) {
    var max = Math.max.apply(null, items.map(function (i) { return i.value; })) || 1;
    var total = items.reduce(function (a, i) { return a + i.value; }, 0);
    return '<div class="bars">' + items.map(function (i) {
      var pct = total ? Math.round(i.value / total * 100) : 0;
      return '<div class="bar-row" tabindex="0" data-tip="' + esc(i.label + ": " + valueFmt(i.value) + " (" + pct + "%)") + '">' +
        '<span class="bar-label">' + esc(i.label) + '</span><span class="bar-track"><span class="bar-fill" style="width:' +
        (i.value / max * 100).toFixed(1) + '%"></span></span><span class="bar-value">' + valueFmt(i.value) + "</span></div>";
    }).join("") + "</div>" +
      '<details class="table-view"><summary>तालिका के रूप में देखें</summary><table class="table"><thead><tr><th>मद</th><th>' + esc(unit) +
      "</th><th>हिस्सा</th></tr></thead><tbody>" + items.map(function (i) {
        return "<tr><td>" + esc(i.label) + "</td><td>" + valueFmt(i.value) + "</td><td>" + (total ? Math.round(i.value / total * 100) : 0) + "%</td></tr>";
      }).join("") + "<tr class=\"total\"><td>कुल</td><td>" + valueFmt(total) + "</td><td>100%</td></tr></tbody></table></details>";
  }
  function bindTooltips(root) {
    var tip = document.createElement("div");
    tip.className = "chart-tip"; tip.setAttribute("role", "status");
    document.body.appendChild(tip);
    function show(el, x, y) { tip.textContent = el.getAttribute("data-tip"); tip.style.left = x + "px"; tip.style.top = y + "px"; tip.classList.add("show"); }
    root.addEventListener("mousemove", function (e) {
      var r = e.target.closest("[data-tip]");
      if (r) show(r, e.clientX, e.clientY); else tip.classList.remove("show");
    });
    root.addEventListener("mouseleave", function () { tip.classList.remove("show"); });
    root.addEventListener("focusin", function (e) {
      var r = e.target.closest("[data-tip]");
      if (r) { var b = r.getBoundingClientRect(); show(r, b.left + b.width / 2, b.top); }
    });
    root.addEventListener("focusout", function () { tip.classList.remove("show"); });
  }

  /* ================= पेज ================= */
  var PAGES = {};

  PAGES.home = function () {
    if (G.heroImage) $(".hero").style.setProperty("--hero-img", "url('" + new URL(G.heroImage, location.href).href + "')");
    set("hero-title", "ग्राम पंचायत <span>" + esc(G.naam) + "</span>");
    set("hero-tag", esc(G.tagline));
    set("hero-loc", "📍 तहसील " + esc(G.tehsil) + ", ज़िला " + esc(G.zila) + ", " + esc(G.rajya) + " – " + esc(G.pincode));

    var tick = S.suchnayen.map(function (n) { return "<span>📢 " + esc(n.shirshak) + " — " + U.date(n.tarikh) + "</span>"; }).join("");
    set("ticker", tick + tick);

    set("about-text", esc(G.parichay));
    set("stats", statTiles(S.aankde));

    var sp = S.sarpanch;
    set("home-sarpanch-photo", U.avatar(sp.photo, sp.naam));
    set("home-sarpanch-naam", esc(sp.naam));
    set("home-sarpanch-pad", esc(sp.pad) + " · कार्यकाल " + esc(sp.karyakal));
    set("home-sandesh", esc(sp.sandesh.length > 330 ? sp.sandesh.slice(0, 330) + "…" : sp.sandesh));
    set("home-upsarpanch", '<div class="mini-person"><div class="avatar sm">' + U.avatar(S.upSarpanch.photo, S.upSarpanch.naam) +
      "</div><div><strong>" + esc(S.upSarpanch.naam) + "</strong><span>" + esc(S.upSarpanch.pad) + "</span></div></div>");

    var ba = S.vikasKarya.filter(function (v) { return v.pehle && v.baad; });
    set("home-ba", ba.slice(0, 2).map(function (v) {
      return '<div class="ba-card reveal">' + U.beforeAfter(v.pehle, v.baad, v.kaam) + "<h3>" + esc(v.kaam) + "</h3><p>" +
        esc(v.ward) + " · " + U.rupees(v.lagat) + " · " + U.badge(v.sthiti) + "</p></div>";
    }).join(""));
    U.bindBeforeAfter(document.getElementById("home-ba"));

    var done = S.vikasKarya.filter(function (v) { return v.sthiti === "पूर्ण"; });
    var ongoing = S.vikasKarya.filter(function (v) { return v.sthiti === "प्रगति पर"; });
    set("home-ongoing", ongoing.map(function (v) {
      return '<li><div class="ongoing-top"><span>' + esc(v.kaam) + "</span><strong>" + v.pragati + '%</strong></div><div class="progress"><span style="width:' + v.pragati + '%"></span></div></li>';
    }).join(""));
    set("home-work-stats", statTiles([
      { icon: "✅", value: done.length, label: "कार्य पूर्ण" },
      { icon: "🚧", value: ongoing.length, label: "कार्य प्रगति पर" },
      { icon: "💰", value: U.rupees(S.vikasKarya.reduce(function (a, v) { return a + v.lagat; }, 0)), label: "कुल विकास राशि" }
    ]));

    set("home-notices", S.suchnayen.slice(0, 4).map(noticeItem).join(""));
    set("home-events", S.karyakram.filter(function (k) { return isUpcoming(k.tarikh); }).slice(0, 4).map(eventItem).join("") ||
      '<li class="empty">अभी कोई आगामी कार्यक्रम नहीं है।</li>');

    loadComplaints(function (list) {
      var s = complaintStats(list);
      set("home-complaint-stats", statTiles([
        { icon: "📝", value: s.total, label: "कुल शिकायतें" },
        { icon: "✅", value: s.ok, label: "समाधान हुईं" },
        { icon: "⏳", value: s.warn + s.info, label: "कार्यवाही जारी" },
        { icon: "⚡", value: s.avg ? s.avg.toFixed(1) + " दिन" : "—", label: "औसत समाधान समय" }
      ]));
      set("home-rate", s.rate + "%");
      $(".rate-ring").style.setProperty("--p", s.rate);
      window.revealAll();
    });

    var yl = set("home-schemes", S.yojanayen.slice(0, 4).map(schemeCard).join(""));
    bindSchemeModals(yl);
    var gl = set("home-gallery", S.gallery.filter(function (g) { return g.photo; }).slice(0, 4).map(galleryItem).join(""));
    bindGallery(gl);
    set("home-helplines", S.zaruriNumber.slice(0, 6).map(function (z) {
      return '<a href="tel:' + U.digits(z.number) + '" class="helpline"><strong>' + esc(z.number) + "</strong><span>" + esc(z.naam) + "</span></a>";
    }).join(""));
  };

  PAGES.parichay = function () {
    set("p-intro", esc(G.parichay));
    set("p-itihas", esc(G.itihas));
    set("p-bhugol", esc(G.bhugol));
    if (G.heroImage) set("p-image", '<img src="' + esc(G.heroImage) + '" alt="गाँव ' + esc(G.naam) + '">');
    set("p-facts", [
      ["गाँव", G.naam], ["तहसील", G.tehsil], ["ज़िला", G.zila], ["राज्य", G.rajya], ["पिन कोड", G.pincode],
      ["सरपंच", S.sarpanch.naam], ["वार्ड", S.wardPanch.length]
    ].map(function (f) { return "<div><dt>" + esc(f[0]) + "</dt><dd>" + esc(f[1]) + "</dd></div>"; }).join(""));
    set("stats", statTiles(S.aankde));
    set("p-suvidha", S.suvidhayen.map(function (s) {
      return '<div class="card facility reveal"><span aria-hidden="true">' + esc(s.icon) + "</span><div><h3>" + esc(s.naam) + "</h3><p>" + esc(s.vivaran) + "</p></div></div>";
    }).join(""));
    set("p-uplabdhi", S.uplabdhiyan.map(function (u) {
      return '<li class="reveal"><span class="tl-year">' + esc(u.saal) + "</span><div><h3>🏆 " + esc(u.shirshak) + "</h3><p>" + esc(u.vivaran) + "</p></div></li>";
    }).join(""));
    if (S.sampark.mapEmbed) set("p-map", '<iframe src="' + esc(S.sampark.mapEmbed) + '" loading="lazy" title="गाँव का नक्शा" referrerpolicy="no-referrer-when-downgrade"></iframe>');
  };

  PAGES.panchayat = function () {
    var sp = S.sarpanch;
    set("sp-photo", U.avatar(sp.photo, sp.naam));
    set("sp-naam", esc(sp.naam));
    set("sp-pad", esc(sp.pad));
    set("sp-karyakal", "कार्यकाल: " + esc(sp.karyakal));
    set("sp-sandesh", esc(sp.sandesh));
    set("sp-prio", sp.praathmiktayen.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join(""));
    set("sp-contact", '<a class="btn btn-primary" href="tel:' + U.digits(S.sampark.phone) + '">📞 संपर्क करें</a> <a class="btn btn-outline" href="shikayat.html">📝 शिकायत / सुझाव</a>');
    set("up-card", personCard(S.upSarpanch));
    set("ward-list", S.wardPanch.map(function (w) { return personCard(w, "वार्ड पंच — वार्ड " + w.ward); }).join(""));
    set("staff-list", S.karmchari.map(function (k) { return personCard(k); }).join(""));
    set("samiti-list", S.samitiyan.map(function (s, i) {
      return "<tr><td>" + (i + 1) + "</td><td>" + esc(s.naam) + "</td><td>" + esc(s.adhyaksh) + "</td></tr>";
    }).join(""));
  };

  PAGES.yojana = function () {
    var list = set("yojana-list", S.yojanayen.map(schemeCard).join(""));
    bindSchemeModals(list);
    var cat = null, q = "";
    function apply() {
      var shown = 0;
      $$(".scheme", list).forEach(function (el, i) {
        var y = S.yojanayen[i];
        var ok = (!cat || y.shreni === cat) && (!q || (y.naam + " " + y.vivaran + " " + y.shreni).toLowerCase().indexOf(q) > -1);
        el.hidden = !ok; if (ok) shown++;
      });
      set("yojana-empty", shown ? "" : "कोई योजना नहीं मिली। दूसरा शब्द लिखकर खोजें।");
      set("yojana-count", shown + " योजनाएँ");
    }
    U.chips(document.getElementById("yojana-cats"), U.unique(S.yojanayen.map(function (y) { return y.shreni; })), function (v) { cat = v; apply(); });
    document.getElementById("yojana-search").addEventListener("input", function () { q = this.value.trim().toLowerCase(); apply(); });
    apply();
  };

  PAGES.sevayen = function () {
    set("seva-list", S.sevayen.map(function (s) {
      return '<article class="card service reveal"><div class="service-head"><span aria-hidden="true">' + esc(s.icon) + "</span><h3>" + esc(s.naam) + "</h3></div>" +
        '<dl class="service-meta"><div><dt>⏱️ समय</dt><dd>' + esc(s.samay) + "</dd></div><div><dt>💵 शुल्क</dt><dd>" + esc(s.shulk) +
        "</dd></div><div><dt>🏢 कहाँ</dt><dd>" + esc(s.kahan) + "</dd></div></dl>" +
        "<details><summary>ज़रूरी दस्तावेज़</summary><ul class=\"check\">" + s.dastavez.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul></details>" +
        (s.link ? '<a class="link-btn" href="' + esc(s.link) + '" target="_blank" rel="noopener">ऑनलाइन आवेदन ↗</a>' : "") + "</article>";
    }).join(""));
    set("portal-list", S.portal.map(function (p) {
      return '<a class="portal reveal" href="' + esc(p.link) + '" target="_blank" rel="noopener"><span>' + esc(p.naam) + "</span><span aria-hidden=\"true\">↗</span></a>";
    }).join(""));
  };

  PAGES.vikas = function () {
    var V = S.vikasKarya;
    set("vikas-stats", statTiles([
      { icon: "🏗️", value: V.length, label: "कुल कार्य" },
      { icon: "✅", value: V.filter(function (v) { return v.sthiti === "पूर्ण"; }).length, label: "पूर्ण" },
      { icon: "🚧", value: V.filter(function (v) { return v.sthiti === "प्रगति पर"; }).length, label: "प्रगति पर" },
      { icon: "💰", value: U.rupees(V.reduce(function (a, v) { return a + v.lagat; }, 0)), label: "कुल लागत" }
    ]));
    var ba = set("ba-list", V.filter(function (v) { return v.pehle && v.baad; }).map(function (v) {
      return '<div class="ba-card reveal">' + U.beforeAfter(v.pehle, v.baad, v.kaam) + "<h3>" + esc(v.kaam) + "</h3><p>" +
        esc(v.ward) + " · " + U.rupees(v.lagat) + " · पूर्ण: " + U.date(v.poorn) + "</p></div>";
    }).join("") || '<p class="empty">पहले-बाद की फ़ोटो जल्द जोड़ी जाएँगी।</p>');
    U.bindBeforeAfter(ba);

    var list = set("vikas-list", V.map(function (v) { return workCard(v, false); }).join(""));
    var st = null, sh = "";
    function apply() {
      var n = 0;
      $$(".work", list).forEach(function (el) {
        var ok = (!st || el.getAttribute("data-sthiti") === st) && (!sh || el.getAttribute("data-shreni") === sh);
        el.hidden = !ok; if (ok) n++;
      });
      set("vikas-empty", n ? "" : "इस श्रेणी में कोई कार्य नहीं है।");
    }
    U.chips(document.getElementById("vikas-filters"), ["पूर्ण", "प्रगति पर", "प्रस्तावित"], function (v) { st = v; apply(); });
    var sel = document.getElementById("vikas-shreni");
    sel.innerHTML = '<option value="">सभी श्रेणियाँ</option>' + U.unique(V.map(function (v) { return v.shreni; })).map(function (s) {
      return "<option>" + esc(s) + "</option>";
    }).join("");
    sel.addEventListener("change", function () { sh = sel.value; apply(); });
  };

  PAGES.shikayat = function () {
    // फ़ॉर्म
    var wardSel = document.getElementById("f-ward"), vibSel = document.getElementById("f-vibhag");
    wardSel.innerHTML = '<option value="">— चुनें —</option>' + S.wardPanch.map(function (w) { return '<option value="' + w.ward + '">वार्ड ' + w.ward + "</option>"; }).join("");
    vibSel.innerHTML = '<option value="">— चुनें —</option>' + S.shikayatVibhag.map(function (v) { return "<option>" + esc(v) + "</option>"; }).join("");

    var form = document.getElementById("shikayat-form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(form);
      var now = new Date();
      var id = "SJ-" + String(now.getFullYear()).slice(2) + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(Date.now()).slice(-4);
      var iso = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
      var msg = "*ग्राम पंचायत " + G.naam + " — नई शिकायत*\n\n" +
        "शिकायत संख्या: " + id + "\n" +
        "दिनांक: " + U.date(iso) + "\n" +
        "नाम: " + f.get("naam") + "\n" +
        "मोबाइल: " + f.get("mobile") + "\n" +
        "वार्ड: " + f.get("ward") + "\n" +
        "विभाग: " + f.get("vibhag") + "\n" +
        "स्थान: " + (f.get("sthan") || "-") + "\n\n" +
        "समस्या: " + f.get("vivaran");
      var mine = myComplaints();
      mine.unshift({ id: id, darj: iso, ward: f.get("ward"), vibhag: f.get("vibhag"), vishay: String(f.get("vivaran")).slice(0, 80), sthiti: "दर्ज" });
      localStorage.setItem("gp-meri-shikayat", JSON.stringify(mine.slice(0, 20)));
      var wa = U.waLink(msg);
      set("form-result", '<div class="success-box"><div class="success-icon">✅</div><h3>आपकी शिकायत तैयार है</h3>' +
        '<p>आपकी शिकायत संख्या:</p><div class="complaint-id">' + id + '</div>' +
        '<p class="small">इस नंबर को सँभाल कर रखें — इससे आप शिकायत की स्थिति देख सकते हैं।</p>' +
        '<a class="btn btn-whatsapp" href="' + wa + '" target="_blank" rel="noopener">WhatsApp पर भेजें</a>' +
        '<p class="small">ज़रूरी: शिकायत तभी दर्ज होगी जब आप WhatsApp पर संदेश भेज देंगे। फ़ोटो हो तो वहीं साथ में भेज दें।</p>' +
        '<button type="button" class="link-btn" id="new-complaint">+ नई शिकायत लिखें</button></div>');
      form.hidden = true;
      document.getElementById("form-result").scrollIntoView({ behavior: "smooth", block: "center" });
      window.open(wa, "_blank");
      renderMine();
      document.getElementById("new-complaint").addEventListener("click", function () {
        form.reset(); form.hidden = false; set("form-result", "");
      });
    });

    function renderMine() {
      var mine = myComplaints();
      var box = document.getElementById("my-complaints");
      box.hidden = !mine.length;
      set("my-list", mine.map(function (c) {
        return '<li><button type="button" class="link-btn" data-track="' + esc(c.id) + '">' + esc(c.id) + "</button> <span>" + U.date(c.darj) + " · " + esc(c.vibhag) + "</span></li>";
      }).join(""));
    }
    renderMine();

    loadComplaints(function (list) {
      // आँकड़े
      var s = complaintStats(list);
      set("c-stats", statTiles([
        { icon: "📝", value: s.total, label: "कुल शिकायतें" },
        { icon: "✅", value: s.ok, label: "समाधान" },
        { icon: "⏳", value: s.warn, label: "प्रगति पर" },
        { icon: "📥", value: s.info, label: "नई / दर्ज" },
        { icon: "⚡", value: s.avg ? s.avg.toFixed(1) + " दिन" : "—", label: "औसत समाधान समय" },
        { icon: "🎯", value: s.rate + "%", label: "समाधान दर" }
      ]));

      // किस विभाग की कितनी समस्याएँ
      var counts = {};
      list.forEach(function (c) { counts[c.vibhag] = (counts[c.vibhag] || 0) + 1; });
      var items = Object.keys(counts).map(function (k) { return { label: k, value: counts[k] }; })
        .sort(function (a, b) { return b.value - a.value; });
      var ch = set("c-chart", barChart(items, function (v) { return v + " शिकायत"; }, "शिकायतें"));
      bindTooltips(ch);

      // ट्रैकिंग
      function track(id) {
        id = String(id || "").trim().toUpperCase();
        if (!id) return;
        document.getElementById("track-input").value = id;
        var c = list.filter(function (x) { return String(x.id).toUpperCase() === id; })[0];
        var local = false;
        if (!c) { c = myComplaints().filter(function (x) { return x.id === id; })[0]; local = !!c; }
        if (!c) {
          set("track-result", '<div class="alert">❌ शिकायत संख्या <strong>' + esc(id) + "</strong> नहीं मिली। नंबर जाँचें या पंचायत कार्यालय से संपर्क करें।</div>");
          return;
        }
        var steps = [
          { t: "शिकायत दर्ज", d: U.date(c.darj), done: true },
          { t: "कार्यवाही शुरू", d: c.sthiti === "प्रगति पर" || c.sthiti === "समाधान" ? "संबंधित कर्मचारी को सौंपी गई" : "प्रतीक्षा में", done: c.sthiti !== "दर्ज" },
          { t: "समाधान", d: c.sthiti === "समाधान" ? U.date(c.hal) : "बाकी", done: c.sthiti === "समाधान" }
        ];
        var days = c.sthiti === "समाधान" ? U.daysBetween(c.darj, c.hal) : U.daysBetween(c.darj, TODAY_ISO);
        set("track-result", '<div class="track-card"><div class="track-head"><div><span class="muted">शिकायत संख्या</span><h3>' + esc(c.id) + "</h3></div>" + U.badge(c.sthiti) + "</div>" +
          '<dl class="work-meta"><div><dt>विभाग</dt><dd>' + esc(c.vibhag) + "</dd></div><div><dt>वार्ड</dt><dd>" + esc(c.ward) +
          "</dd></div><div><dt>दर्ज</dt><dd>" + U.date(c.darj) + "</dd></div><div><dt>" + (c.sthiti === "समाधान" ? "समाधान में लगे" : "दर्ज हुए") + "</dt><dd>" + (days != null ? days + " दिन" : "—") + "</dd></div></dl>" +
          "<p><strong>समस्या:</strong> " + esc(c.vishay) + "</p>" +
          '<ol class="timeline">' + steps.map(function (st) {
            return '<li class="' + (st.done ? "done" : "") + '"><strong>' + st.t + "</strong><span>" + esc(st.d) + "</span></li>";
          }).join("") + "</ol>" +
          (c.tippani ? '<p class="remark">💬 <strong>पंचायत की टिप्पणी:</strong> ' + esc(c.tippani) + "</p>" : "") +
          (local ? '<p class="small muted">यह शिकायत आपके फ़ोन पर सहेजी गई है। पंचायत द्वारा रजिस्टर में दर्ज होते ही इसकी ताज़ा स्थिति यहाँ दिखेगी।</p>' : "") +
          "</div>");
      }
      document.getElementById("track-form").addEventListener("submit", function (e) {
        e.preventDefault(); track(document.getElementById("track-input").value);
      });
      document.addEventListener("click", function (e) {
        var b = e.target.closest("[data-track]");
        if (b) { track(b.getAttribute("data-track")); document.getElementById("track").scrollIntoView({ behavior: "smooth" }); }
      });
      var hashId = (location.hash.match(/id=([\w-]+)/) || [])[1];
      if (hashId) track(hashId);

      // सार्वजनिक रजिस्टर
      var vSel = document.getElementById("r-vibhag"), wSel = document.getElementById("r-ward"), qIn = document.getElementById("r-search");
      vSel.innerHTML = '<option value="">सभी विभाग</option>' + U.unique(list.map(function (c) { return c.vibhag; })).map(function (v) { return "<option>" + esc(v) + "</option>"; }).join("");
      wSel.innerHTML = '<option value="">सभी वार्ड</option>' + S.wardPanch.map(function (w) { return '<option value="' + w.ward + '">वार्ड ' + w.ward + "</option>"; }).join("");
      var st = null;
      function renderRegister() {
        var q = qIn.value.trim().toLowerCase();
        var rows = list.filter(function (c) {
          return (!st || c.sthiti === st) && (!vSel.value || c.vibhag === vSel.value) && (!wSel.value || String(c.ward) === wSel.value) &&
            (!q || (c.id + " " + c.vishay).toLowerCase().indexOf(q) > -1);
        });
        set("r-body", rows.map(function (c) {
          var d = c.sthiti === "समाधान" ? U.daysBetween(c.darj, c.hal) : null;
          return '<tr><td data-label="शिकायत सं."><button type="button" class="link-btn" data-track="' + esc(c.id) + '">' + esc(c.id) + "</button></td>" +
            '<td data-label="दर्ज तिथि">' + U.date(c.darj, { day: "numeric", month: "short", year: "numeric" }) + "</td>" +
            '<td data-label="वार्ड">' + esc(c.ward) + "</td>" +
            '<td data-label="विभाग">' + esc(c.vibhag) + "</td>" +
            '<td data-label="समस्या">' + esc(c.vishay) + "</td>" +
            '<td data-label="स्थिति">' + U.badge(c.sthiti) + "</td>" +
            '<td data-label="समाधान तिथि">' + (c.hal ? U.date(c.hal, { day: "numeric", month: "short", year: "numeric" }) : "—") + "</td>" +
            '<td data-label="लगे दिन">' + (d != null ? d + " दिन" : "—") + "</td></tr>";
        }).join("") || '<tr><td colspan="8" class="empty">कोई शिकायत नहीं मिली।</td></tr>');
        set("r-count", rows.length + " / " + list.length + " शिकायतें");
      }
      U.chips(document.getElementById("r-status"), ["दर्ज", "प्रगति पर", "समाधान"], function (v) { st = v; renderRegister(); });
      [vSel, wSel].forEach(function (el) { el.addEventListener("change", renderRegister); });
      qIn.addEventListener("input", renderRegister);
      renderRegister();
      window.revealAll();
    });
  };

  PAGES.suchna = function () {
    var list = set("suchna-list", S.suchnayen.map(noticeItem).join(""));
    U.chips(document.getElementById("suchna-cats"), U.unique(S.suchnayen.map(function (n) { return n.shreni; })), function (v) {
      $$(".notice", list).forEach(function (el, i) { el.hidden = v && S.suchnayen[i].shreni !== v; });
    });
    set("event-list", S.karyakram.filter(function (k) { return isUpcoming(k.tarikh); }).map(eventItem).join("") || '<li class="empty">अभी कोई आगामी कार्यक्रम नहीं है।</li>');
  };

  PAGES.bajat = function () {
    var B = S.bajat;
    var aay = B.aay.reduce(function (a, i) { return a + i.rashi; }, 0);
    var vyay = B.vyay.reduce(function (a, i) { return a + i.rashi; }, 0);
    set("b-year", "वित्तीय वर्ष " + esc(B.varsh));
    set("b-stats", statTiles([
      { icon: "📥", value: U.rupees(aay), label: "कुल प्राप्त राशि" },
      { icon: "📤", value: U.rupees(vyay), label: "कुल व्यय" },
      { icon: "🏦", value: U.rupees(aay - vyay), label: "शेष राशि" },
      { icon: "📈", value: (aay ? Math.round(vyay / aay * 100) : 0) + "%", label: "राशि का उपयोग" }
    ]));
    var map = function (arr) { return arr.map(function (i) { return { label: i.naam, value: i.rashi }; }); };
    var a = set("b-aay", barChart(map(B.aay), U.rupees, "राशि"));
    var v = set("b-vyay", barChart(map(B.vyay), U.rupees, "राशि"));
    bindTooltips(a); bindTooltips(v);
    set("b-works", S.vikasKarya.map(function (w) {
      return '<tr><td data-label="कार्य">' + esc(w.kaam) + '</td><td data-label="योजना / मद">' + esc(w.yojana) + '</td><td data-label="लागत">' +
        U.rupees(w.lagat) + '</td><td data-label="स्थिति">' + U.badge(w.sthiti) + "</td></tr>";
    }).join(""));
    var r = S.rti;
    set("rti", [["लोक सूचना अधिकारी", r.lokSuchnaAdhikari], ["प्रथम अपील अधिकारी", r.apeelAdhikari], ["आवेदन शुल्क", r.shulk], ["जवाब की समय-सीमा", r.samay]]
      .map(function (x) { return "<div><dt>" + esc(x[0]) + "</dt><dd>" + esc(x[1]) + "</dd></div>"; }).join(""));
  };

  PAGES.gallery = function () {
    var list = set("gallery-list", S.gallery.map(galleryItem).join(""));
    bindGallery(list);
    U.chips(document.getElementById("gallery-albums"), U.unique(S.gallery.map(function (g) { return g.album; })), function (v) {
      $$(".gallery-item", list).forEach(function (el, i) { el.hidden = v && S.gallery[i].album !== v; });
    });
  };

  PAGES.sampark = function () {
    var c = S.sampark;
    set("contact-cards", [
      { icon: "📍", t: "पता", v: esc(c.pata) },
      { icon: "📞", t: "फ़ोन", v: '<a href="tel:' + U.digits(c.phone) + '">' + esc(c.phone) + "</a>" },
      { icon: "💬", t: "WhatsApp", v: '<a href="' + U.waLink() + '" target="_blank" rel="noopener">संदेश भेजें</a>' },
      { icon: "✉️", t: "ईमेल", v: '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a>" },
      { icon: "🕘", t: "कार्यालय समय", v: esc(c.samay) + "<br><small>" + esc(c.avkash) + "</small>" },
      { icon: "🤝", t: "सरपंच से मिलें", v: esc(c.sarpanchMilan) }
    ].map(function (x) {
      return '<div class="card contact-card reveal"><span aria-hidden="true">' + x.icon + "</span><div><h3>" + x.t + "</h3><p>" + x.v + "</p></div></div>";
    }).join(""));
    if (c.mapEmbed) set("map", '<iframe src="' + esc(c.mapEmbed) + '" loading="lazy" title="पंचायत भवन का नक्शा" referrerpolicy="no-referrer-when-downgrade"></iframe>');
    set("number-list", S.zaruriNumber.map(function (z) {
      return '<a href="tel:' + U.digits(z.number) + '" class="helpline"><strong>' + esc(z.number) + "</strong><span>" + esc(z.naam) + "</span></a>";
    }).join(""));
    document.getElementById("contact-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(this);
      window.open(U.waLink("*ग्राम पंचायत " + G.naam + " — संदेश*\n\nनाम: " + f.get("naam") + "\nमोबाइल: " + f.get("mobile") + "\n\n" + f.get("sandesh")), "_blank");
    });
  };

  var page = document.body.getAttribute("data-page");
  if (PAGES[page]) PAGES[page]();
  window.revealAll();
})();
