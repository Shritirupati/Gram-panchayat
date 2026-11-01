(function () {
  "use strict";
  var S = window.SITE;

  function get(path) {
    return path.split(".").reduce(function (o, k) { return o ? o[k] : ""; }, S);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function initial(naam) {
    var t = String(naam).replace(/[\[\]]/g, "").trim();
    return t ? t.charAt(0) : "?";
  }
  function avatar(photo, naam) {
    return photo
      ? '<img src="' + esc(photo) + '" alt="' + esc(naam) + '" loading="lazy">'
      : '<span class="avatar-letter">' + esc(initial(naam)) + "</span>";
  }
  function formatDate(d) {
    var dt = new Date(d + "T00:00:00");
    if (isNaN(dt)) return esc(d);
    return dt.toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" });
  }
  function digits(s) { return String(s).replace(/\D/g, ""); }

  // Simple text fields
  document.querySelectorAll("[data-field]").forEach(function (el) {
    el.textContent = get(el.getAttribute("data-field"));
  });
  document.title = "ग्राम पंचायत " + S.gaon.naam + " | " + S.gaon.zila;
  $("year").textContent = new Date().getFullYear();

  if (S.gaon.heroImage) {
    $("hero").style.backgroundImage =
      "linear-gradient(rgba(10,40,25,.65), rgba(10,40,25,.65)), url('" + S.gaon.heroImage + "')";
  }

  // Stats
  $("stats").innerHTML = S.aankde.map(function (a) {
    return '<div class="stat"><strong>' + esc(a.value) + "</strong><span>" + esc(a.label) + "</span></div>";
  }).join("");

  // Sarpanch
  $("sarpanch-photo").innerHTML = avatar(S.sarpanch.photo, S.sarpanch.naam);

  // Members
  $("sadasya-list").innerHTML = S.sadasya.map(function (m) {
    return '<div class="card member"><div class="avatar">' + avatar(m.photo, m.naam) +
      "</div><h3>" + esc(m.naam) + "</h3><p>" + esc(m.pad) + "</p></div>";
  }).join("");

  // Schemes
  $("yojana-list").innerHTML = S.yojanayen.map(function (y) {
    return '<div class="card scheme"><div class="scheme-icon">' + esc(y.icon) + "</div><h3>" +
      esc(y.naam) + "</h3><p>" + esc(y.vivaran) + "</p>" +
      (y.link ? '<a href="' + esc(y.link) + '" target="_blank" rel="noopener">अधिक जानकारी →</a>' : "") +
      "</div>";
  }).join("");

  // Development works
  var statusClass = { "पूर्ण": "done", "प्रगति पर": "progress", "प्रस्तावित": "planned" };
  function renderVikas(filter) {
    $("vikas-list").innerHTML = S.vikasKarya.filter(function (v) {
      return filter === "सभी" || v.status === filter;
    }).map(function (v) {
      return '<div class="card work">' +
        (v.photo ? '<img src="' + esc(v.photo) + '" alt="' + esc(v.kaam) + '" loading="lazy">' : "") +
        '<span class="badge ' + (statusClass[v.status] || "") + '">' + esc(v.status) + "</span>" +
        "<h3>" + esc(v.kaam) + "</h3><p>📍 " + esc(v.ward) + "</p><p>💰 " + esc(v.lagat) + "</p></div>";
    }).join("") || '<p class="empty">इस श्रेणी में कोई कार्य नहीं है।</p>';
  }
  renderVikas("सभी");
  $("vikas-filters").addEventListener("click", function (e) {
    var b = e.target.closest(".chip");
    if (!b) return;
    this.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
    b.classList.add("active");
    renderVikas(b.getAttribute("data-filter"));
  });

  // Notices + ticker
  $("suchna-list").innerHTML = S.suchnayen.map(function (n) {
    return '<li class="card notice"><time>' + formatDate(n.tarikh) + "</time>" +
      (n.naya ? '<span class="new">नया</span>' : "") +
      "<h3>" + esc(n.shirshak) + "</h3><p>" + esc(n.vivaran) + "</p></li>";
  }).join("");
  var tick = S.suchnayen.map(function (n) {
    return "<span>📢 " + esc(n.shirshak) + " — " + formatDate(n.tarikh) + "</span>";
  }).join("");
  $("ticker").innerHTML = tick + tick;

  // Important numbers
  $("number-list").innerHTML = S.zaruriNumber.map(function (z) {
    return "<li><span>" + esc(z.naam) + '</span><a href="tel:' + esc(digits(z.number)) + '">' + esc(z.number) + "</a></li>";
  }).join("");

  // Gallery
  $("gallery-list").innerHTML = S.gallery.map(function (g) {
    return '<figure class="gallery-item">' +
      (g.photo ? '<img src="' + esc(g.photo) + '" alt="' + esc(g.caption) + '" loading="lazy">'
               : '<div class="placeholder">📷</div>') +
      "<figcaption>" + esc(g.caption) + "</figcaption></figure>";
  }).join("");
  var lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = '<img alt=""><p></p>';
  document.body.appendChild(lightbox);
  $("gallery-list").addEventListener("click", function (e) {
    var img = e.target.closest(".gallery-item img");
    if (!img) return;
    lightbox.querySelector("img").src = img.src;
    lightbox.querySelector("p").textContent = img.alt;
    lightbox.classList.add("open");
  });
  lightbox.addEventListener("click", function () { lightbox.classList.remove("open"); });

  // Contact
  var c = S.sampark;
  $("phone-link").textContent = c.phone;
  $("phone-link").href = "tel:" + digits(c.phone);
  $("email-link").textContent = c.email;
  $("email-link").href = "mailto:" + c.email.replace(/[\[\]]/g, "");
  $("wa-float").href = "https://wa.me/" + digits(c.whatsapp);
  if (c.mapEmbed) {
    $("map").innerHTML = '<iframe src="' + esc(c.mapEmbed) + '" loading="lazy" title="पंचायत भवन का नक्शा" referrerpolicy="no-referrer-when-downgrade"></iframe>';
  } else {
    $("map").style.display = "none";
  }

  // Complaint form -> WhatsApp
  $("shikayat-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = new FormData(this);
    var msg = "*ग्राम पंचायत " + S.gaon.naam + " — शिकायत / सुझाव*\n\n" +
      "नाम: " + f.get("naam") + "\n" +
      "मोबाइल: " + f.get("mobile") + "\n" +
      "वार्ड: " + (f.get("ward") || "-") + "\n" +
      "विषय: " + f.get("vishay") + "\n\n" +
      "विवरण: " + f.get("vivaran");
    window.open("https://wa.me/" + digits(c.whatsapp) + "?text=" + encodeURIComponent(msg), "_blank");
  });

  // Mobile menu
  var btn = document.querySelector(".menu-btn");
  var nav = document.querySelector(".nav");
  btn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { nav.classList.remove("open"); btn.setAttribute("aria-expanded", false); }
  });
})();
