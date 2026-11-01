/* नए फ़ीचर वाले पेज: लाभार्थी, ग्राम सभा, डाउनलोड, रोज़गार, किसान, स्वास्थ्य,
   प्रतिभाएँ, समाचार, जनमत, ऑनलाइन आवेदन, वीडियो, एडमिन */
(function () {
  "use strict";
  var S = window.SITE, U = window.U, GP = window.GP, G = S.gaon;
  var esc = U.esc, $$ = U.$$, set = GP.set;
  var page = document.body.getAttribute("data-page");
  var P = {};

  function dateBlock(d, small) {
    var dt = U.parseDate(d);
    return '<div class="date-block' + (small ? " small" : "") + '"><strong>' + (dt ? dt.getDate() : "—") + "</strong><span>" +
      (dt ? dt.toLocaleDateString("hi-IN", { month: "short" }) : "") + "</span></div>";
  }
  function filterCards(container, attr) {
    return function (v) { $$("[" + attr + "]", container).forEach(function (el) { el.hidden = v && el.getAttribute(attr) !== v; }); };
  }

  /* ---------- 5. लाभार्थी सूची ---------- */
  P.labharthi = function () {
    var L = S.labharthi;
    var yojanas = U.unique(L.map(function (l) { return l.yojana; }));
    set("lb-stats", GP.statTiles([
      { icon: "👥", value: L.length, label: "कुल लाभार्थी" },
      { icon: "🏛️", value: yojanas.length, label: "योजनाएँ" },
      { icon: "🗺️", value: U.unique(L.map(function (l) { return String(l.ward); })).length, label: "वार्ड शामिल" }
    ]));
    var items = yojanas.map(function (y) { return { label: y, value: L.filter(function (l) { return l.yojana === y; }).length }; })
      .sort(function (a, b) { return b.value - a.value; });
    set("lb-chart", GP.barChart(items, function (v) { return v + " लाभार्थी"; }, "लाभार्थी"));
    GP.bindTooltips(document.getElementById("lb-chart"));

    var wSel = document.getElementById("lb-ward"), q = document.getElementById("lb-search"), yo = null;
    wSel.innerHTML = '<option value="">सभी वार्ड</option>' + S.wardPanch.map(function (w) { return '<option value="' + w.ward + '">वार्ड ' + w.ward + "</option>"; }).join("");
    function render() {
      var t = q.value.trim().toLowerCase();
      var rows = L.filter(function (l) {
        return (!yo || l.yojana === yo) && (!wSel.value || String(l.ward) === wSel.value) && (!t || (l.naam + " " + l.pita).toLowerCase().indexOf(t) > -1);
      });
      set("lb-body", rows.map(function (l, i) {
        return '<tr><td data-label="क्र.">' + (i + 1) + '</td><td data-label="नाम"><strong>' + esc(l.naam) + '</strong></td><td data-label="पिता / पति">' + esc(l.pita) +
          '</td><td data-label="वार्ड">' + esc(l.ward) + '</td><td data-label="योजना">' + esc(l.yojana) + '</td><td data-label="राशि">' +
          (l.rashi ? U.rupees(l.rashi) + (l.varsh === "मासिक" ? "/माह" : "") : "—") + '</td><td data-label="वर्ष">' + esc(l.varsh) +
          '</td><td data-label="स्थिति"><span class="badge ok">' + esc(l.sthiti) + "</span></td></tr>";
      }).join("") || '<tr><td colspan="8" class="empty">कोई लाभार्थी नहीं मिला।</td></tr>');
      set("lb-count", rows.length + " लाभार्थी");
    }
    U.chips(document.getElementById("lb-yojana"), yojanas, function (v) { yo = v; render(); });
    wSel.addEventListener("change", render);
    q.addEventListener("input", render);
    render();
  };

  /* ---------- 6. ग्राम सभा ---------- */
  P.gramsabha = function () {
    var next = S.karyakram.filter(function (k) { return /ग्राम सभा/.test(k.naam) && GP.isUpcoming(k.tarikh); })[0];
    set("gs-next", next ? '<div class="next-meeting reveal">' + dateBlock(next.tarikh) + '<div><span class="eyebrow">अगली ग्राम सभा</span><h3>' + esc(next.naam) +
      "</h3><p>🕘 " + esc(next.samay) + " · 📍 " + esc(next.sthan) + '</p></div><a class="btn btn-primary" href="suchna.html">सूचना देखें</a></div>' : "");
    set("gs-list", S.gramSabha.map(function (m, i) {
      return '<details class="meeting reveal"' + (i === 0 ? " open" : "") + "><summary>" + dateBlock(m.tarikh, true) +
        '<div><h3>' + esc(m.prakar) + '</h3><p class="muted">' + U.date(m.tarikh) + " · 📍 " + esc(m.sthan) + " · 👥 " + esc(m.upasthiti) + ' उपस्थित</p></div><span class="chev" aria-hidden="true">▾</span></summary>' +
        '<div class="meeting-body"><p><strong>अध्यक्षता:</strong> ' + esc(m.adhyakshata) + '</p><h4>मुख्य निर्णय</h4><ol class="decisions">' +
        m.nirnay.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ol>" +
        (m.file ? '<a class="btn btn-outline" href="' + esc(m.file) + '" target="_blank" rel="noopener">📄 कार्यवाही (PDF) डाउनलोड</a>' : '<p class="small muted">📄 कार्यवाही की प्रति पंचायत कार्यालय में उपलब्ध है।</p>') +
        "</div></details>";
    }).join(""));
  };

  /* ---------- 7. डाउनलोड ---------- */
  P.downloads = function () {
    var list = set("dl-list", S.downloads.map(function (d) {
      return '<div class="download reveal" data-shreni="' + esc(d.shreni) + '"><span class="dl-icon" aria-hidden="true">' + (d.link ? "📄" : "🏢") + "</span><div><h3>" + esc(d.naam) +
        '</h3><span class="tag">' + esc(d.shreni) + "</span></div>" +
        (d.link ? '<a class="btn btn-outline" href="' + esc(d.link) + '" target="_blank" rel="noopener">खोलें ↗</a>' : '<span class="muted small">पंचायत कार्यालय से प्राप्त करें</span>') + "</div>";
    }).join(""));
    U.chips(document.getElementById("dl-cats"), U.unique(S.downloads.map(function (d) { return d.shreni; })), filterCards(list, "data-shreni"));
  };

  /* ---------- 8. रोज़गार ---------- */
  P.rozgar = function () {
    var today = U.todayISO();
    var list = set("rz-list", S.rozgar.map(function (r) {
      var band = r.antim && r.antim < today;
      return '<article class="card job reveal" data-prakar="' + esc(r.prakar) + '"><div class="work-top"><span class="tag">' + esc(r.prakar) + "</span>" +
        (band ? '<span class="badge info">समाप्त</span>' : r.antim ? '<span class="badge ok">आवेदन जारी</span>' : "") + "</div><h3>" + esc(r.shirshak) + "</h3>" +
        '<dl class="service-meta"><div><dt>📍 स्थान</dt><dd>' + esc(r.sthan) + "</dd></div><div><dt>🎓 योग्यता</dt><dd>" + esc(r.yogyata) +
        "</dd></div><div><dt>📅 अंतिम तिथि</dt><dd>" + (r.antim ? U.date(r.antim) : "—") + "</dd></div><div><dt>📞 संपर्क</dt><dd>" + esc(r.sampark) + "</dd></div></dl>" +
        (r.link ? '<a class="link-btn" href="' + esc(r.link) + '" target="_blank" rel="noopener">अधिक जानकारी ↗</a>'
          : '<a class="link-btn" href="' + U.waLink("नमस्ते, मुझे \"" + r.shirshak + "\" के बारे में जानकारी चाहिए।") + '" target="_blank" rel="noopener">पंचायत से पूछें →</a>') + "</article>";
    }).join(""));
    U.chips(document.getElementById("rz-cats"), U.unique(S.rozgar.map(function (r) { return r.prakar; })), filterCards(list, "data-prakar"));
  };

  /* ---------- 9. किसान: मंडी भाव व मौसम ---------- */
  var WMO = {
    0: ["☀️", "साफ़ आसमान"], 1: ["🌤️", "ज़्यादातर साफ़"], 2: ["⛅", "आंशिक बादल"], 3: ["☁️", "बादल"],
    45: ["🌫️", "कोहरा"], 48: ["🌫️", "कोहरा"], 51: ["🌦️", "हल्की बूंदाबांदी"], 53: ["🌦️", "बूंदाबांदी"], 55: ["🌦️", "तेज़ बूंदाबांदी"],
    61: ["🌧️", "हल्की बारिश"], 63: ["🌧️", "बारिश"], 65: ["🌧️", "तेज़ बारिश"], 80: ["🌦️", "बौछारें"], 81: ["🌧️", "बौछारें"], 82: ["⛈️", "तेज़ बौछारें"],
    95: ["⛈️", "आंधी-तूफ़ान"], 96: ["⛈️", "ओलावृष्टि"], 99: ["⛈️", "ओलावृष्टि"]
  };
  function wmo(c) { return WMO[c] || ["🌡️", "—"]; }
  P.kisan = function () {
    var M = S.mandi;
    set("mandi-title", esc(M.naam) + " · " + U.date(M.tarikh));
    set("mandi-body", M.bhav.map(function (b) {
      var cls = b.badlav > 0 ? "up" : b.badlav < 0 ? "down" : "same";
      var arrow = b.badlav > 0 ? "▲" : b.badlav < 0 ? "▼" : "•";
      return '<tr><td data-label="फ़सल"><strong>' + esc(b.fasal) + '</strong></td><td data-label="न्यूनतम">₹' + b.nyuntam.toLocaleString("en-IN") +
        '</td><td data-label="अधिकतम">₹' + b.adhiktam.toLocaleString("en-IN") + '</td><td data-label="बदलाव"><span class="chg ' + cls + '">' + arrow + " " +
        (b.badlav ? "₹" + Math.abs(b.badlav) : "स्थिर") + "</span></td></tr>";
    }).join(""));
    set("kisan-salah", S.kisanSalah.map(function (k) { return "<li>" + esc(k) + "</li>"; }).join(""));

    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + G.lat + "&longitude=" + G.lon +
      "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKolkata&forecast_days=5";
    fetch(url).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
      var c = d.current, w = wmo(c.weather_code);
      set("weather-now", '<div class="wx-now"><span class="wx-big">' + w[0] + '</span><div><strong>' + Math.round(c.temperature_2m) + "°C</strong><span>" + w[1] +
        '</span></div></div><div class="wx-meta"><span>💧 नमी ' + c.relative_humidity_2m + "%</span><span>🌬️ हवा " + Math.round(c.wind_speed_10m) + " किमी/घं</span></div>");
      set("weather-days", d.daily.time.map(function (t, i) {
        var dw = wmo(d.daily.weather_code[i]);
        var dt = new Date(t + "T00:00:00");
        return '<div class="wx-day"><span>' + (i === 0 ? "आज" : dt.toLocaleDateString("hi-IN", { weekday: "short" })) + '</span><span class="wx-ico" title="' + dw[1] + '">' + dw[0] +
          "</span><strong>" + Math.round(d.daily.temperature_2m_max[i]) + "°</strong><small>" + Math.round(d.daily.temperature_2m_min[i]) + "°</small><small>🌧️ " +
          (d.daily.precipitation_probability_max[i] || 0) + "%</small></div>";
      }).join(""));
    }).catch(function () {
      set("weather-now", '<p class="muted">मौसम की जानकारी अभी लोड नहीं हो सकी। कुछ देर बाद पेज रिफ़्रेश करें।</p>');
    });
  };

  /* ---------- 10. स्वास्थ्य ---------- */
  P.swasthya = function () {
    var H = S.swasthya;
    set("hs-kendra", H.kendra.map(function (k) {
      return '<div class="card contact-card reveal"><span aria-hidden="true">🏥</span><div><h3>' + esc(k.naam) + "</h3><p>🕘 " + esc(k.samay) + "<br>📞 " + esc(k.sampark) + "</p></div></div>";
    }).join(""));
    set("hs-anm", esc(H.anmDin));
    set("hs-teeka", H.teekakaran.map(function (t) {
      return '<li class="event">' + dateBlock(t.tarikh, true) + "<div><h4>" + esc(t.naam) + "</h4><p>📍 " + esc(t.sthan) + "</p></div></li>";
    }).join(""));
    var list = set("hs-donors", H.raktdata.map(function (r) {
      return '<div class="card donor reveal" data-samuh="' + esc(r.samuh) + '"><span class="blood">' + esc(r.samuh) + "</span><div><h3>" + esc(r.naam) +
        "</h3><p>वार्ड " + esc(r.ward) + " · अंतिम रक्तदान: " + U.date(r.antim, { month: "short", year: "numeric" }) + "</p></div>" +
        '<a class="link-btn" href="' + U.waLink("🩸 रक्त की आवश्यकता: " + r.samuh + " रक्तदाता " + r.naam + " (वार्ड " + r.ward + ") से संपर्क करवाने का अनुरोध।") +
        '" target="_blank" rel="noopener">संपर्क अनुरोध</a></div>';
    }).join(""));
    U.chips(document.getElementById("hs-groups"), ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"], filterCards(list, "data-samuh"));
  };

  /* ---------- 11. प्रतिभाएँ ---------- */
  P.pratibha = function () {
    var icons = { "शिक्षा": "🎓", "खेल": "🏅", "सेना व सेवा": "🎖️", "कला व संस्कृति": "🎭" };
    var list = set("pr-list", S.pratibha.map(function (p) {
      return '<article class="card talent reveal" data-shreni="' + esc(p.shreni) + '"><div class="avatar">' + U.avatar(p.photo, p.naam) +
        '</div><span class="talent-badge">' + (icons[p.shreni] || "⭐") + " " + esc(p.shreni) + "</span><h3>" + esc(p.naam) + "</h3><p>" + esc(p.uplabdhi) +
        '</p><span class="muted small">वर्ष ' + esc(p.saal) + "</span></article>";
    }).join(""));
    U.chips(document.getElementById("pr-cats"), U.unique(S.pratibha.map(function (p) { return p.shreni; })), filterCards(list, "data-shreni"));
  };

  /* ---------- 12. गाँव समाचार ---------- */
  P.samachar = function () {
    var icons = { "शुभ समाचार": "🎉", "शोक सूचना": "🕯️", "कार्यक्रम": "📅", "उपलब्धि": "🏆" };
    var list = set("sm-list", S.samachar.map(function (n) {
      var cls = n.prakar === "शोक सूचना" ? " shok" : "";
      return '<article class="news reveal' + cls + '" data-prakar="' + esc(n.prakar) + '"><span class="news-icon" aria-hidden="true">' + (icons[n.prakar] || "📰") +
        '</span><div><div class="notice-meta"><span class="tag">' + esc(n.prakar) + '</span><span class="muted small">' + U.date(n.tarikh) + "</span></div><h3>" +
        esc(n.shirshak) + "</h3><p>" + esc(n.vivaran) + "</p></div></article>";
    }).join(""));
    U.chips(document.getElementById("sm-cats"), U.unique(S.samachar.map(function (n) { return n.prakar; })), filterCards(list, "data-prakar"));
  };

  /* ---------- 13. वीडियो (गैलरी पेज पर) ---------- */
  function videos() {
    var box = document.getElementById("video-list");
    if (!box) return;
    box.innerHTML = S.videos.map(function (v) {
      var thumb = v.youtube ? '<img src="https://i.ytimg.com/vi/' + encodeURIComponent(v.youtube) + '/hqdefault.jpg" alt="" loading="lazy">' : '<div class="video-ph"></div>';
      return '<button type="button" class="video reveal" data-yt="' + esc(v.youtube) + '" data-title="' + esc(v.shirshak) + '">' + thumb +
        '<span class="play" aria-hidden="true">▶</span><span class="video-cap"><strong>' + esc(v.shirshak) + "</strong><small>" + U.date(v.tarikh) + "</small></span></button>";
    }).join("");
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".video");
      if (!b) return;
      var id = b.getAttribute("data-yt");
      U.modal(id
        ? '<h2 class="modal-title">' + esc(b.getAttribute("data-title")) + '</h2><div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
          '?autoplay=1" title="' + esc(b.getAttribute("data-title")) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>'
        : '<h2 class="modal-title">' + esc(b.getAttribute("data-title")) + '</h2><p>🎬 यह वीडियो जल्द ही जोड़ा जाएगा।</p><p class="small muted">(data.js में videos के अंदर YouTube वीडियो की ID डालें।)</p>');
    });
  }

  /* ---------- 14. जनमत / सर्वे ---------- */
  P.matdaan = function () {
    var box = document.getElementById("polls");
    function render() {
      box.innerHTML = S.matdaan.map(function (p) {
        var extra = U.db.get("votes-" + p.id, {});
        var my = U.db.get("myvote-" + p.id, null);
        var counts = p.vikalp.map(function (v, i) { return v.vote + (extra[i] || 0); });
        var total = counts.reduce(function (a, b) { return a + b; }, 0);
        var closed = p.antim && p.antim < U.todayISO();
        var showRes = my !== null || closed;
        return '<article class="card poll reveal"><div class="row-head"><h3>🗳️ ' + esc(p.prashn) + '</h3><span class="muted small">' + (closed ? "मतदान समाप्त" : "अंतिम तिथि: " + U.date(p.antim)) + "</span></div>" +
          '<div class="poll-opts">' + p.vikalp.map(function (v, i) {
            var pct = total ? Math.round(counts[i] / total * 100) : 0;
            return showRes
              ? '<div class="poll-res' + (my === i ? " mine" : "") + '"><div class="poll-res-top"><span>' + esc(v.naam) + (my === i ? " ✓ आपका वोट" : "") + "</span><strong>" + pct + "%</strong></div>" +
                '<div class="progress"><span style="width:' + pct + '%"></span></div><small class="muted">' + counts[i] + " वोट</small></div>"
              : '<button type="button" class="poll-opt" data-poll="' + esc(p.id) + '" data-i="' + i + '">' + esc(v.naam) + "</button>";
          }).join("") + "</div>" +
          '<p class="small muted">कुल ' + total + " वोट" + (showRes ? "" : " · वोट देने के लिए एक विकल्प चुनें") + "</p></article>";
      }).join("");
      window.revealAll();
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".poll-opt");
      if (!b) return;
      var id = b.getAttribute("data-poll"), i = Number(b.getAttribute("data-i"));
      var extra = U.db.get("votes-" + id, {});
      extra[i] = (extra[i] || 0) + 1;
      U.db.set("votes-" + id, extra);
      U.db.set("myvote-" + id, i);
      render();
    });
    render();
  };

  /* ---------- 17. ऑनलाइन आवेदन ---------- */
  var AV_STEPS = ["प्राप्त", "जाँच में", "स्वीकृत"];
  function allApplications() { return U.merged("aavedan", S.aavedan); }
  P.aavedan = function () {
    var sel = document.getElementById("av-seva");
    sel.innerHTML = '<option value="">— सेवा चुनें —</option>' + S.aavedanSeva.map(function (s) { return "<option>" + esc(s) + "</option>"; }).join("");
    document.getElementById("av-ward").innerHTML = '<option value="">— चुनें —</option>' + S.wardPanch.map(function (w) { return '<option value="' + w.ward + '">वार्ड ' + w.ward + "</option>"; }).join("");
    sel.addEventListener("change", function () {
      var s = S.sevayen.filter(function (x) { return sel.value && (x.naam === sel.value || sel.value.indexOf(x.naam.split(" ")[0]) === 0); })[0];
      set("av-docs", s ? '<div class="callout"><strong>📄 ज़रूरी दस्तावेज़:</strong> ' + s.dastavez.map(esc).join(", ") + "<br><strong>⏱️ समय:</strong> " + esc(s.samay) + " · <strong>💵 शुल्क:</strong> " + esc(s.shulk) + "</div>" : "");
    });
    var form = document.getElementById("av-form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(form);
      var id = U.newId("AV");
      U.addRecord("aavedan", { id: id, seva: f.get("seva"), darj: U.todayISO(), ward: f.get("ward"), sthiti: "प्राप्त", hal: "", tippani: "",
        naam: f.get("naam"), pita: f.get("pita"), mobile: f.get("mobile"), janaadhaar: f.get("janaadhaar"), vivaran: f.get("vivaran") });
      form.hidden = true;
      set("av-result", '<div class="success-box"><div class="success-icon">✅</div><h3>आवेदन जमा हो गया</h3><p>आपकी आवेदन संख्या:</p><div class="complaint-id">' + id +
        '</div><p class="small">दस्तावेज़ों की मूल प्रति के साथ 3 दिन के भीतर पंचायत कार्यालय में सत्यापन करवाएँ।</p>' +
        '<div class="btn-row center-row"><button type="button" class="btn btn-primary" data-avtrack="' + id + '">स्थिति देखें</button>' +
        '<button type="button" class="btn btn-outline" onclick="window.print()">🖨️ रसीद प्रिंट करें</button></div>' +
        '<button type="button" class="link-btn" id="av-new">+ नया आवेदन</button></div>');
      document.getElementById("av-result").scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("av-new").addEventListener("click", function () { form.reset(); form.hidden = false; set("av-result", ""); set("av-docs", ""); });
    });
    function track(id) {
      id = String(id || "").trim().toUpperCase();
      document.getElementById("av-track-input").value = id;
      var a = allApplications().filter(function (x) { return x.id.toUpperCase() === id; })[0];
      if (!a) { set("av-track-result", '<div class="alert">❌ आवेदन संख्या <strong>' + esc(id) + "</strong> नहीं मिली।</div>"); return; }
      var rejected = a.sthiti === "अस्वीकृत";
      var idx = rejected ? 1 : AV_STEPS.indexOf(a.sthiti);
      var steps = AV_STEPS.slice(0, 2).concat([rejected ? "अस्वीकृत" : "स्वीकृत"]);
      set("av-track-result", '<div class="track-card"><div class="track-head"><div><span class="muted">आवेदन संख्या</span><h3>' + esc(a.id) + "</h3></div>" +
        '<span class="badge ' + (a.sthiti === "स्वीकृत" ? "ok" : rejected ? "bad" : a.sthiti === "जाँच में" ? "warn" : "info") + '">' + esc(a.sthiti) + "</span></div>" +
        '<dl class="work-meta"><div><dt>सेवा</dt><dd>' + esc(a.seva) + "</dd></div><div><dt>वार्ड</dt><dd>" + esc(a.ward) + "</dd></div><div><dt>आवेदन तिथि</dt><dd>" +
        U.date(a.darj) + "</dd></div><div><dt>निपटारा</dt><dd>" + (a.hal ? U.date(a.hal) : "—") + "</dd></div></dl>" +
        '<ol class="timeline">' + steps.map(function (s, i) {
          return '<li class="' + (i <= idx || (i === 2 && (a.sthiti === "स्वीकृत" || rejected)) ? "done" : "") + (i === 2 && rejected ? " bad" : "") + '"><strong>' + s + "</strong><span>" +
            (i === 0 ? U.date(a.darj) : i === 2 && a.hal ? U.date(a.hal) : i <= idx ? "पूर्ण" : "प्रतीक्षा में") + "</span></li>";
        }).join("") + "</ol>" + (a.tippani ? '<p class="remark">💬 <strong>पंचायत की टिप्पणी:</strong> ' + esc(a.tippani) + "</p>" : "") + "</div>");
    }
    document.getElementById("av-track-form").addEventListener("submit", function (e) { e.preventDefault(); track(document.getElementById("av-track-input").value); });
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-avtrack]");
      if (b) { track(b.getAttribute("data-avtrack")); document.getElementById("av-track").scrollIntoView({ behavior: "smooth" }); }
    });
  };

  /* ---------- 16. एडमिन डैशबोर्ड (डेमो) ---------- */
  P.admin = function () {
    var loginBox = document.getElementById("admin-login"), dash = document.getElementById("admin-dash");
    set("demo-cred", "यूज़र: <code>" + esc(S.admin.user) + "</code> · पासवर्ड: <code>" + esc(S.admin.pass) + "</code>");
    function show() {
      var ok = sessionStorage.getItem("gp-admin") === "1";
      loginBox.hidden = ok; dash.hidden = !ok;
      if (ok) renderAll();
    }
    document.getElementById("login-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(this);
      if (f.get("user") === S.admin.user && f.get("pass") === S.admin.pass) { sessionStorage.setItem("gp-admin", "1"); set("login-err", ""); show(); }
      else set("login-err", "❌ यूज़र नाम या पासवर्ड गलत है।");
    });
    document.getElementById("logout").addEventListener("click", function () { sessionStorage.removeItem("gp-admin"); show(); });
    document.getElementById("reset-demo").addEventListener("click", function () {
      if (confirm("डेमो का सारा नया डेटा (नई शिकायतें, आवेदन, सूचनाएँ, वोट) हटा दें?")) { U.db.reset(); renderAll(); }
    });

    // टैब
    var tabs = document.getElementById("admin-tabs");
    tabs.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tab]");
      if (!b) return;
      $$("[data-tab]", tabs).forEach(function (x) { x.classList.toggle("active", x === b); x.setAttribute("aria-selected", x === b); });
      $$(".tab-panel").forEach(function (p) { p.hidden = p.id !== "tab-" + b.getAttribute("data-tab"); });
    });

    function statusSelect(kind, id, cur, opts) {
      return '<select data-kind="' + kind + '" data-id="' + esc(id) + '" class="status-sel">' + opts.map(function (o) {
        return "<option" + (o === cur ? " selected" : "") + ">" + o + "</option>";
      }).join("") + "</select>";
    }
    function renderAll() {
      var C = U.merged("shikayat", S.shikayatein);
      var A = allApplications();
      var st = GP.complaintStats(C);
      var newC = U.db.get("shikayat-new", []).length, newA = U.db.get("aavedan-new", []).length;
      set("ad-stats", GP.statTiles([
        { icon: "📝", value: st.total, label: "कुल शिकायतें" },
        { icon: "⏳", value: st.warn + st.info, label: "लंबित शिकायतें" },
        { icon: "🖊️", value: A.filter(function (a) { return a.sthiti === "प्राप्त" || a.sthiti === "जाँच में"; }).length, label: "लंबित आवेदन" },
        { icon: "🆕", value: newC + newA, label: "नए (ऑनलाइन) रिकॉर्ड" },
        { icon: "🎯", value: st.rate + "%", label: "समाधान दर" },
        { icon: "📢", value: U.notices().length, label: "सूचनाएँ" }
      ]));
      set("ad-complaints", C.map(function (c) {
        return '<tr><td data-label="संख्या"><strong>' + esc(c.id) + "</strong>" + (c.naam ? '<br><small class="muted">👤 ' + esc(c.naam) + " · " + esc(c.mobile) + "</small>" : "") +
          '</td><td data-label="दर्ज">' + U.date(c.darj, { day: "numeric", month: "short" }) + '</td><td data-label="वार्ड / विभाग">' + esc(c.ward) + " · " + esc(c.vibhag) +
          '</td><td data-label="समस्या">' + esc(c.vishay) + '</td><td data-label="स्थिति">' + statusSelect("shikayat", c.id, c.sthiti, ["दर्ज", "प्रगति पर", "समाधान"]) +
          '</td><td data-label="टिप्पणी"><input class="remark-in" data-kind="shikayat" data-id="' + esc(c.id) + '" value="' + esc(c.tippani) + '" placeholder="टिप्पणी लिखें…"></td></tr>';
      }).join(""));
      set("ad-apps", A.map(function (a) {
        return '<tr><td data-label="संख्या"><strong>' + esc(a.id) + "</strong>" + (a.naam ? '<br><small class="muted">👤 ' + esc(a.naam) + " · " + esc(a.mobile) + "</small>" : "") +
          '</td><td data-label="सेवा">' + esc(a.seva) + '</td><td data-label="तिथि">' + U.date(a.darj, { day: "numeric", month: "short" }) + '</td><td data-label="वार्ड">' + esc(a.ward) +
          '</td><td data-label="स्थिति">' + statusSelect("aavedan", a.id, a.sthiti, ["प्राप्त", "जाँच में", "स्वीकृत", "अस्वीकृत"]) +
          '</td><td data-label="टिप्पणी"><input class="remark-in" data-kind="aavedan" data-id="' + esc(a.id) + '" value="' + esc(a.tippani) + '" placeholder="टिप्पणी लिखें…"></td></tr>';
      }).join(""));
      var myN = U.db.get("suchna-new", []);
      set("ad-notices", myN.length ? myN.map(function (n, i) {
        return "<li><strong>" + esc(n.shirshak) + '</strong> <span class="muted small">' + U.date(n.tarikh) + " · " + esc(n.shreni) +
          '</span> <button type="button" class="link-btn danger" data-del-notice="' + i + '">हटाएँ</button></li>';
      }).join("") : '<li class="muted">अभी कोई नई सूचना नहीं जोड़ी गई।</li>');
      set("ad-polls", S.matdaan.map(function (p) {
        var extra = U.db.get("votes-" + p.id, {});
        var items = p.vikalp.map(function (v, i) { return { label: v.naam, value: v.vote + (extra[i] || 0) }; });
        return "<h4>" + esc(p.prashn) + "</h4>" + GP.barChart(items, function (v) { return v + " वोट"; }, "वोट");
      }).join(""));
      window.revealAll();
    }
    function toast(msg) {
      var t = document.getElementById("toast");
      t.textContent = msg; t.classList.add("show");
      clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 2200);
    }
    dash.addEventListener("change", function (e) {
      var el = e.target;
      if (el.classList.contains("status-sel")) {
        var ch = { sthiti: el.value };
        var doneStates = ["समाधान", "स्वीकृत", "अस्वीकृत"];
        ch.hal = doneStates.indexOf(el.value) > -1 ? U.todayISO() : "";
        U.updateRecord(el.getAttribute("data-kind"), el.getAttribute("data-id"), ch);
        toast("✅ स्थिति अपडेट: " + el.getAttribute("data-id") + " → " + el.value);
        renderAll();
      } else if (el.classList.contains("remark-in")) {
        U.updateRecord(el.getAttribute("data-kind"), el.getAttribute("data-id"), { tippani: el.value });
        toast("💬 टिप्पणी सेव हो गई");
      }
    });
    dash.addEventListener("click", function (e) {
      var b = e.target.closest("[data-del-notice]");
      if (!b) return;
      var arr = U.db.get("suchna-new", []);
      arr.splice(Number(b.getAttribute("data-del-notice")), 1);
      U.db.set("suchna-new", arr); renderAll(); toast("🗑️ सूचना हटा दी गई");
    });
    document.getElementById("notice-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(this);
      var arr = U.db.get("suchna-new", []);
      arr.unshift({ tarikh: f.get("tarikh"), shreni: f.get("shreni"), shirshak: f.get("shirshak"), vivaran: f.get("vivaran"), file: "" });
      U.db.set("suchna-new", arr);
      this.reset(); this.tarikh.value = U.todayISO();
      renderAll(); toast("📢 सूचना प्रकाशित — होम और सूचना पट पर दिख रही है");
    });
    document.querySelector("#notice-form [name=tarikh]").value = U.todayISO();
    show();
  };

  if (page === "gallery") videos();
  if (P[page]) P[page]();
  window.revealAll();
})();
