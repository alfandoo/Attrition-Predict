/* ============================================
 * AttritionPredict — script.js
 * ============================================
 * - Helpers (DOM, utils, toast)
 * - Navbar & navigasi (shrink, back-to-top, scroll spy)
 * - Stepper (form single)
 * - Form single: autosave, validasi, submit
 * - CSV Upload & Tabel (filter, sort, paginate, PDF)
 * - Modal (generic, data-attribute)
 * - Animasi scroll (IntersectionObserver) + AOS
 * ============================================ */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  /* =============== Helpers =============== */
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  const debounce = (fn, ms = 200) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const Toast = (() => {
    const node = qs("#toast");
    return (type = "info", msg = "") => {
      if (!node) return;
      const tone =
        type === "success"
          ? "bg-emerald-600"
          : type === "error"
          ? "bg-rose-600"
          : "bg-slate-800";
      node.innerHTML = `<div class="text-white ${tone} px-4 py-2 rounded-lg shadow-lg">${msg}</div>`;
      node.classList.remove("hidden");
      setTimeout(() => node.classList.add("hidden"), 2800);
    };
  })();

  /* =============== Navbar & Navigation =============== */
  const navbar = qs("#navbar");
  on(qs("#menu-btn"), "click", () => qs("#menu")?.classList.toggle("hidden"));

  const shrinkNav = () => {
    if (!navbar) return;
    const sc = window.scrollY > 50;
    navbar.classList.toggle("py-2", sc);
    navbar.classList.toggle("shadow-lg", sc);
    navbar.classList.toggle("py-4", !sc);
  };
  on(window, "scroll", debounce(shrinkNav, 20));
  shrinkNav();

  const backToTop = qs("#backToTop");
  const toggleBtt = () =>
    backToTop?.classList.toggle("hidden", window.scrollY <= 600);
  on(window, "scroll", debounce(toggleBtt, 20));
  on(backToTop, "click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  toggleBtt();

  // Scroll Spy (underline anim di .nav-link > span)
  const sections = qsa("section");
  const navLinks = qsa(".nav-link");
  const spy = () => {
    let active = "";
    sections.forEach((s) => {
      const top = s.offsetTop - 80,
        h = s.clientHeight;
      if (window.scrollY >= top && window.scrollY < top + h) active = s.id;
    });
    navLinks.forEach((link) => {
      const u = link.querySelector("span");
      const is = link.getAttribute("href") === `#${active}`;
      link.classList.toggle("text-blue-600", is);
      link.classList.toggle("font-semibold", is);
      u?.classList.toggle("w-full", is);
    });
  };
  on(window, "scroll", debounce(spy, 30));
  spy();

  /* =============== Stepper (Form Single) =============== */
  let currentStep = 1;
  const totalSteps = 5; // (1) disesuaikan dari 4 -> 5
  const steps = qsa(".form-step");
  const stepIndicators = qsa(".step");

  const updateAria = (n) =>
    stepIndicators.forEach((ind, i) =>
      i + 1 === n
        ? ind.setAttribute("aria-current", "step")
        : ind.removeAttribute("aria-current")
    );

  const showStep = (n) => {
    steps.forEach((s) => s.classList.add("hidden"));
    steps[n - 1]?.classList.remove("hidden");
    stepIndicators.forEach((ind, i) => {
      const dot = ind.querySelector("div");
      dot?.classList.toggle("bg-blue-600", i < n);
      dot?.classList.toggle("bg-gray-300", i >= n);
    });
    qs("#prevBtn")?.classList.toggle("hidden", n === 1);
    qs("#nextBtn")?.classList.toggle("hidden", n === totalSteps);
    qs("#submitBtn")?.classList.toggle("hidden", n !== totalSteps);
    updateAria(n);
  };
  showStep(currentStep);

  on(qs("#nextBtn"), "click", () => {
    if (currentStep < totalSteps) {
      currentStep++;
      showStep(currentStep);
      // (3) rakit ringkasan ketika masuk step 5
      if (currentStep === 5) buildReview();
    }
  });
  on(qs("#prevBtn"), "click", () => {
    if (currentStep > 1) showStep(--currentStep);
  });

  // (2) fungsi buildReview sesuai snippet user
  function buildReview() {
    const form = document.getElementById("predictForm");
    if (!form) return;
    const fd = new FormData(form);
    const pick = (k) => (fd.get(k) ?? "").toString() || "—";

    const row = (label, val) =>
      `<div class="flex items-start justify-between gap-3">
        <dt class="text-slate-500">${label}</dt>
        <dd class="font-medium text-slate-800">${val}</dd>
      </div>`;

    const personal = document.getElementById("review-personal");
    if (personal)
      personal.innerHTML = [
        row("Nama", pick("EmployeeName")),
        row("Usia", pick("Age")),
        row("Status Pernikahan", pick("MaritalStatus")),
      ].join("");

    const job = document.getElementById("review-job");
    if (job)
      job.innerHTML = [
        row("Departemen", pick("Department")),
        row("Job Role", pick("JobRole")),
        row("Level Jabatan", pick("JobLevel")),
        row("Keterlibatan Kerja", pick("JobInvolvement")),
        row("Kepuasan Kerja", pick("JobSatisfaction")),
      ].join("");

    const fin = document.getElementById("review-fin");
    if (fin)
      fin.innerHTML = [
        row("Pendapatan Bulanan", pick("MonthlyIncome")),
        row("Daily Rate", pick("DailyRate")),
        row("Opsi Saham", pick("StockOptionLevel")),
      ].join("");

    const life = document.getElementById("review-life");
    if (life)
      life.innerHTML = [
        row("Jarak dari Rumah", pick("DistanceFromHome") + " km"),
        row("Kepuasan Lingkungan", pick("EnvironmentSatisfaction")),
        row("Lembur", pick("OverTime")),
        row("Total Tahun Kerja", pick("TotalWorkingYears")),
        row("Pelatihan Tahun Lalu", pick("TrainingTimesLastYear")),
        row("Work Life Balance", pick("WorkLifeBalance")),
        row("Tahun di Perusahaan", pick("YearsAtCompany")),
        row("Tahun di Role Saat Ini", pick("YearsInCurrentRole")),
        row("Tahun dgn Manager Saat Ini", pick("YearsWithCurrManager")),
      ].join("");
  }

  // (4) tombol "Ubah" di review untuk lompat ke step terkait
  document.querySelectorAll(".review-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const step = Number(
        e.currentTarget.getAttribute("data-goto-step") || "1"
      );
      currentStep = step;
      showStep(currentStep);
    });
  });

  /* =============== Form Single: autosave, validation, submit =============== */
  const form = qs("#predictForm");
  if (form) {
    // Autosave
    qsa("input, select", form).forEach((el) => {
      if (!el.name) return;
      el.value = localStorage.getItem(el.name) ?? el.value ?? "";
      on(el, "input", () => localStorage.setItem(el.name, el.value));
    });

    // Validasi Age
    const age = form.querySelector('input[name="Age"]');
    if (age) {
      const msg = qs("#ageHelp");
      on(age, "blur", (e) => {
        const v = Number(e.target.value);
        const invalid = v < 18 || v > 60;
        msg?.classList.toggle("hidden", !invalid);
        age.setAttribute("aria-invalid", invalid ? "true" : "false");
      });
    }

    // Cegah submit Enter (multi-step)
    on(form, "keydown", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });

    // Submit → /predict_api
    on(form, "submit", async function (e) {
      e.preventDefault();
      const spinner = qs("#loadingSpinner");
      spinner?.classList.remove("hidden");

      const btn = this.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.classList.add("opacity-50", "cursor-not-allowed");
      }

      try {
        const payload = Object.fromEntries(new FormData(this).entries());
        const res = await fetch("/predict_api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();

        const box = qs("#singleResult") || qs("#result");
        if (!box) return;

        const b = Number(result?.probability?.bertahan ?? 0);
        const r = Number(result?.probability?.resign ?? 0);
        const highB = b >= r;
        const bertahanClass = highB
          ? "text-green-600 font-bold"
          : "text-gray-700";
        const resignClass = !highB ? "text-red-600 font-bold" : "text-gray-700";
        const namaLine = result.employee_name
          ? `<p class="text-gray-700 mb-2 dark:text-cyan-200"><span class="font-semibold dark:text-cyan-200">Nama:</span> ${result.employee_name}</p>`
          : "";

        box.innerHTML = `
<div role="status" aria-live="polite"
     class="max-w-xl mx-auto rounded-2xl p-6 md:p-7 mt-6 fade-in
            backdrop-blur shadow-2xl ring-1 ring-slate-200/60 dark:ring-white/10
            bg-slate-900/5 dark:bg-white/10
            transform transition-transform duration-500 hover:scale-[1.02]">
  <h4 class="text-2xl md:text-3xl font-extrabold tracking-tight mb-4
             text-slate-900 dark:text-cyan-200">
    Hasil Prediksi
  </h4>

  ${namaLine}

  <p class="mx-auto inline-flex items-center justify-center rounded-full px-3 py-1.5 mb-4
          text-sm font-semibold ring-1
          ${
            result.prediction.includes("Resign")
              ? "text-rose-600 ring-rose-200/60 bg-rose-50 dark:text-rose-300 dark:ring-rose-400/20"
              : "text-emerald-700 ring-emerald-200/60 bg-emerald-50 dark:text-emerald-300 dark:ring-emerald-400/20"
          }">
  ${result.prediction}
</p>

  <div class="grid grid-cols-2 gap-4 mb-4">
    <!-- Bertahan -->
    <div class="rounded-xl p-4 shadow-sm
                bg-emerald-400/10 ring-1 ring-emerald-400/20">
      <p class="${bertahanClass} text-center font-semibold text-emerald-700 dark:text-emerald-300">Bertahan</p>
      <div class="mt-2 h-3 w-full rounded-full overflow-hidden
                  bg-slate-200 dark:bg-white/10 ring-1 ring-slate-200/60 dark:ring-white/10"
           role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${b}">
        <div class="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
             style="width:${b}%"></div>
      </div>
      <p class="text-center mt-1 font-semibold text-slate-800 dark:text-white">${b.toFixed(
        2
      )}%</p>
    </div>

    <!-- Resign -->
    <div class="rounded-xl p-4 shadow-sm
                bg-rose-400/10 ring-1 ring-rose-400/20">
      <p class="${resignClass} text-center font-semibold text-rose-700 dark:text-rose-300">Resign</p>
      <div class="mt-2 h-3 w-full rounded-full overflow-hidden
                  bg-slate-200 dark:bg-white/10 ring-1 ring-slate-200/60 dark:ring-white/10"
           role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${r}">
        <div class="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-700"
             style="width:${r}%"></div>
      </div>
      <p class="text-center mt-1 font-semibold text-slate-800 dark:text-white">${r.toFixed(
        2
      )}%</p>
    </div>
  </div>

  <p class="text-sm text-slate-700 dark:text-cyan-200">
    Confidence: <span class="font-semibold dark:text-cyan-200">${
      result.confidence
    }</span>
  </p>

  <div class="flex justify-center gap-3 mt-4">
    <button id="retryBtn"
            class="inline-flex items-center justify-center rounded-lg px-6 py-2 text-sm font-semibold
                   bg-gradient-to-r from-yellow-300 to-yellow-500 text-blue-900
                   ring-1 ring-black/5 shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-yellow-300">
      Prediksi Ulang
    </button>
    <button id="clearBtn"
            class="inline-flex items-center justify-center rounded-lg px-6 py-2 text-sm font-semibold
                   bg-rose-600 text-white shadow-sm hover:bg-rose-500
                   focus:outline-none focus:ring-2 focus:ring-rose-500">
      Hapus Semua Data
    </button>
  </div>
</div>
`;

        on(qs("#retryBtn"), "click", () => {
          currentStep = 1;
          showStep(currentStep);
          qs("#singleResult")?.replaceChildren();
          qs("#result")?.replaceChildren();
        });
        on(qs("#clearBtn"), "click", () => {
          localStorage.clear();
          this.reset();
          currentStep = 1;
          showStep(currentStep);
          qs("#singleResult")?.replaceChildren();
          qs("#result")?.replaceChildren();
        });

        Toast("success", "Prediksi berhasil diproses.");
      } catch (err) {
        console.error(err);
        const box = qs("#singleResult") || qs("#result");
        if (box) {
          box.innerHTML = `
<div class="max-w-xl mx-auto bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
  <h4 class="font-bold mb-2">Terjadi Kesalahan!</h4>
  <p>Prediksi gagal diproses. Silakan coba lagi atau periksa koneksi internet Anda.</p>
</div>`;
        }
        Toast("error", "Gagal memproses prediksi.");
      } finally {
        spinner?.classList.add("hidden");
        if (btn) {
          btn.disabled = false;
          btn.classList.remove("opacity-50", "cursor-not-allowed");
        }
      }
    });
  }

  /* =============== CSV Upload + Table =============== */
  const csvRoot = qs("#upload-csv");
  const CSV = {
    data: [],
    filtered: [],
    page: 1,
    pageSize: 10,
    els: {
      form: qs("#csvForm", csvRoot),
      input: qs("#csvFile", csvRoot),
      label: qs("#csvLabel", csvRoot),
      name: qs("#fileName", csvRoot),
      btn: qs("#csvSubmit", csvRoot),
      loader: qs("#csvLoader", csvRoot),
      loaderBar: qs("#csvLoaderBar", csvRoot),
      loaderTxt: qs("#csvLoaderText", csvRoot),
      errorBox: qs("#csvError", csvRoot),
      result: qs("#csvResult", csvRoot),
      tbody: qs("#csvResultBody", csvRoot),
      count: qs("#csvCount", csvRoot),
      search: qs("#csvSearch", csvRoot),
      searchClr: qs("#csvSearchClear", csvRoot),
      filter: qs("#csvFilter", csvRoot),
      sort: qs("#csvSort", csvRoot),
      pageInfo: qs("#csvPageInfo", csvRoot),
      pageWrap: qs("#csvPaginationPages", csvRoot),
      first: qs("#csvFirst", csvRoot),
      prev: qs("#csvPrev", csvRoot),
      next: qs("#csvNext", csvRoot),
      last: qs("#csvLast", csvRoot),
      pageSize: qs("#csvPageSize", csvRoot),
      summary: qs("#csvSummary", csvRoot),
      changeBtn: qs("#btnChangeFile", csvRoot),
      clearBtn: qs("#btnClearFile", csvRoot),
    },
  };

  const fmtPct = (v) => `${(Number(v) || 0).toFixed(2)}%`;
  const clampPct = (n) => Math.max(0, Math.min(100, Number(n) || 0));
  const confidenceBadge = (v) => {
    const n = Number(String(v).replace("%", "")) || 0;
    const cls =
      n >= 80
        ? "bg-green-100 text-green-700"
        : n >= 50
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";
    return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${cls}">${n.toFixed(
      2
    )}%</span>`;
  };
  const predChip = (pred = "") => {
    const p = pred.toLowerCase();
    if (p.includes("resign"))
      return `<span class="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Resign</span>`;
    if (p.includes("error"))
      return `<span class="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Error</span>`;
    return `<span class="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Bertahan</span>`;
  };
  const bar = (label, pct, color) => {
    const w = clampPct(pct);
    return `
      <div class="min-w-[140px]">
        <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden"><div class="h-2 rounded-full ${color}" style="width:${w}%"></div></div>
        <div class="mt-1 flex justify-between text-xs text-slate-600"><span>${label}</span><span>${w.toFixed(
      2
    )}%</span></div>
      </div>`;
  };

  const showCsvError = (msg) => {
    CSV.els.errorBox?.classList.remove("hidden");
    if (CSV.els.errorBox) CSV.els.errorBox.textContent = "[CSV ERROR] " + msg;
    console.error("[CSV ERROR]", msg);
    Toast("error", msg);
  };
  const clearCsvError = () => {
    if (!CSV.els.errorBox) return;
    CSV.els.errorBox.classList.add("hidden");
    CSV.els.errorBox.textContent = "";
  };

  const computeSummary = (rows) => {
    const n = rows.length || 0;
    if (!n) return { count: 0, stayAvg: 0, confAvg: 0 };
    const sum = rows.reduce(
      (a, r) => {
        a.stay += Number(r?.probability?.bertahan) || 0;
        a.conf += Number(String(r?.confidence || "0").replace("%", "")) || 0;
        return a;
      },
      { stay: 0, conf: 0 }
    );
    return { count: n, stayAvg: sum.stay / n, confAvg: sum.conf / n };
  };

  const renderSummary = (rows) => {
    const el = CSV.els.summary;
    if (!el) return;
    const { count, stayAvg, confAvg } = computeSummary(rows);
    el.innerHTML = `
      <div class="bg-white rounded-xl border border-slate-200 p-4"><div class="text-xs text-slate-500">Total Baris (sesuai filter)</div><div class="text-xl font-semibold mt-1">${count}</div></div>
      <div class="bg-white rounded-xl border border-slate-200 p-4"><div class="text-xs text-slate-500">Rata-rata % Bertahan</div><div class="text-xl font-semibold text-emerald-700 mt-1">${fmtPct(
        stayAvg
      )}</div></div>
      <div class="bg-white rounded-xl border border-slate-200 p-4"><div class="text-xs text-slate-500">Rata-rata Confidence</div><div class="text-xl font-semibold text-blue-700 mt-1">${fmtPct(
        confAvg
      )}</div></div>
    `;
  };

  const applyFilterSort = () => {
    const q = (CSV.els.search?.value || "").toLowerCase();
    const f = CSV.els.filter?.value || "";
    const s = CSV.els.sort?.value || "idx-asc";

    let rows = CSV.data.filter((r) => {
      const name = (r.employee_name || r.EmployeeName || "-").toLowerCase();
      const pred = (r.prediction || "-").toLowerCase();
      const matchQ = !q || name.includes(q) || pred.includes(q);
      const matchF = !f || r.prediction === f;
      return matchQ && matchF;
    });

    const key = {
      idx: (r) => Number(r.index) || 0,
      conf: (r) => Number(String(r.confidence).replace("%", "")) || 0,
      stay: (r) => Number(r?.probability?.bertahan) || 0,
      quit: (r) => Number(r?.probability?.resign) || 0,
    };
    const [k, dir] = s.split("-");
    rows.sort(
      (a, b) =>
        (dir === "asc" ? 1 : -1) * ((key[k]?.(a) ?? 0) - (key[k]?.(b) ?? 0))
    );

    CSV.filtered = rows;
    if (CSV.els.count) CSV.els.count.textContent = `${rows.length} baris`;
    CSV.page = 1;
    renderSummary(rows);
  };

  const renderPagination = () => {
    const total = CSV.filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / CSV.pageSize));
    CSV.page = Math.max(1, Math.min(CSV.page, totalPages));

    const start = total ? (CSV.page - 1) * CSV.pageSize + 1 : 0;
    const end = total ? Math.min(CSV.page * CSV.pageSize, total) : 0;
    if (CSV.els.pageInfo)
      CSV.els.pageInfo.textContent = `Menampilkan ${start}–${end} dari ${total}`;

    const wrap = CSV.els.pageWrap;
    if (!wrap) return;
    wrap.innerHTML = "";

    const win = 5;
    let from = Math.max(1, CSV.page - Math.floor(win / 2));
    let to = Math.min(totalPages, from + win - 1);
    from = Math.max(1, to - win + 1);

    for (let p = from; p <= to; p++) {
      const b = document.createElement("button");
      b.className =
        "px-3 py-1 border rounded hover:bg-slate-100 text-sm " +
        (p === CSV.page ? "bg-blue-600 text-white hover:bg-blue-600" : "");
      b.textContent = p;
      on(b, "click", () => {
        CSV.page = p;
        renderRows();
      });
      wrap.appendChild(b);
    }

    const disable = (el, cond) =>
      el && ((el.disabled = cond), el.classList.toggle("opacity-50", cond));
    disable(CSV.els.first, CSV.page === 1);
    disable(CSV.els.prev, CSV.page === 1);
    disable(CSV.els.next, CSV.page === totalPages);
    disable(CSV.els.last, CSV.page === totalPages);
  };

  const renderRows = () => {
    const body = CSV.els.tbody;
    if (!body) return;
    renderPagination();

    const start = (CSV.page - 1) * CSV.pageSize;
    const rows = CSV.filtered.slice(start, start + CSV.pageSize);

    body.innerHTML =
      rows
        .map((row, i) => {
          const stay = clampPct(row?.probability?.bertahan);
          const quit = clampPct(row?.probability?.resign);
          const zebra = i % 2 === 0 ? "bg-white" : "bg-slate-50";
          const name = row.employee_name ?? row.EmployeeName ?? "-";
          const initials = String(name).trim()
            ? name.slice(0, 2).toUpperCase()
            : "??";
          const idx = row.index ?? start + i + 1;
          return `
<tr class="${zebra} hover:bg-blue-50/50 transition-colors">
  <td class="px-5 py-3">${idx}</td>
  <td class="px-5 py-3">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-xs text-blue-700 font-semibold">${initials}</div>
      <div><div class="font-medium">${name}</div></div>
    </div>
  </td>
  <td class="px-5 py-3">${predChip(row.prediction ?? "-")}</td>
  <td class="px-5 py-3">${bar("Bertahan", stay, "bg-green-500")}</td>
  <td class="px-5 py-3">${bar("Resign", quit, "bg-red-500")}</td>
  <td class="px-5 py-3">${confidenceBadge(row.confidence ?? "0%")}</td>
</tr>`;
        })
        .join("") ||
      `<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Tidak ada data yang cocok.</td></tr>`;
  };

  const setCsvDataAndRender = (results) => {
    CSV.data = Array.isArray(results) ? results : [];
    applyFilterSort();
    renderRows();
    CSV.els.result?.classList.remove("hidden");
  };

  // Bind once: pagination nav
  on(CSV.els.first, "click", () => {
    CSV.page = 1;
    renderRows();
  });
  on(CSV.els.prev, "click", () => {
    CSV.page = Math.max(1, CSV.page - 1);
    renderRows();
  });
  on(CSV.els.next, "click", () => {
    const totalPages = Math.max(
      1,
      Math.ceil(CSV.filtered.length / CSV.pageSize)
    );
    CSV.page = Math.min(totalPages, CSV.page + 1);
    renderRows();
  });
  on(CSV.els.last, "click", () => {
    CSV.page = Math.max(1, Math.ceil(CSV.filtered.length / CSV.pageSize));
    renderRows();
  });
  on(CSV.els.pageSize, "change", (e) => {
    CSV.pageSize = Number(e.target.value) || 10;
    CSV.page = 1;
    renderRows();
  });

  // Toolbar
  on(
    CSV.els.search,
    "input",
    debounce(() => {
      applyFilterSort();
      renderRows();
    }, 150)
  );
  on(CSV.els.filter, "change", () => {
    applyFilterSort();
    renderRows();
  });
  on(CSV.els.sort, "change", () => {
    applyFilterSort();
    renderRows();
  });

  // Search clear (show/hide)
  const toggleSearchClear = () =>
    CSV.els.searchClr?.classList.toggle("hidden", !CSV.els.search?.value);
  on(CSV.els.search, "input", toggleSearchClear);
  on(CSV.els.searchClr, "click", () => {
    if (!CSV.els.search) return;
    CSV.els.search.value = "";
    CSV.els.search.dispatchEvent(new Event("input"));
  });
  toggleSearchClear();

  // Reset
  on(qs("#csvReset"), "click", () => {
    if (CSV.els.search) CSV.els.search.value = "";
    if (CSV.els.filter) CSV.els.filter.value = "";
    if (CSV.els.sort) CSV.els.sort.value = "idx-asc";
    applyFilterSort();
    renderRows();
    Toast("info", "Filter & urutan direset.");
  });

  // Download PDF
  on(qs("#csvDownloadPdf"), "click", () => {
    if (!CSV.filtered.length)
      return Toast("error", "Tidak ada data untuk diunduh.");
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) return Toast("error", "jsPDF belum dimuat.");
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Hasil Prediksi CSV - AttritionPredict", 14, 14);

    const head = [
      [
        "Index",
        "Nama Karyawan",
        "Prediksi",
        "% Bertahan",
        "% Resign",
        "Confidence",
      ],
    ];
    const body = CSV.filtered.map((r, i) => [
      String(r.index ?? i + 1),
      String(r.employee_name ?? r.EmployeeName ?? "-"),
      String(r.prediction ?? "-"),
      String(Number(r?.probability?.bertahan || 0).toFixed(2)),
      String(Number(r?.probability?.resign || 0).toFixed(2)),
      String(String(r.confidence ?? "0%").replace("%", "")),
    ]);

    doc.autoTable({
      head,
      body,
      startY: 20,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      columnStyles: { 1: { cellWidth: 60 } },
      didParseCell: (d) => {
        const pred = String(d.cell?.raw || "").toLowerCase();
        if (d.section === "body" && d.column.index === 2) {
          if (pred.includes("resign")) d.cell.styles.textColor = [220, 38, 38];
          if (pred.includes("bertahan"))
            d.cell.styles.textColor = [22, 163, 74];
        }
      },
    });
    doc.save("Hasil_Prediksi_AttritionPredict.pdf");
  });

  // Upload handlers (dropzone + validate)
  if (csvRoot) {
    on(CSV.els.form, "submit", (e) => e.preventDefault());

    const isCSV = (f) =>
      !!f && (/\.csv$/i.test(f.name) || f.type === "text/csv" || f.type === "");
    const renderName = () => {
      const f = CSV.els.input?.files?.[0];
      if (CSV.els.name)
        CSV.els.name.textContent = f
          ? `File dipilih: ${f.name}`
          : "Belum ada file yang dipilih";
    };

    // keyboard trigger
    on(CSV.els.label, "keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        CSV.els.input?.click();
      }
    });

    // drag & drop visual
    ["dragenter", "dragover"].forEach((ev) =>
      on(CSV.els.label, ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        CSV.els.label?.classList.add("border-blue-500", "bg-blue-50");
      })
    );
    ["dragleave", "drop"].forEach((ev) =>
      on(CSV.els.label, ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        CSV.els.label?.classList.remove("border-blue-500", "bg-blue-50");
      })
    );

    on(CSV.els.label, "drop", (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      if (!isCSV(file)) return alert("File harus .csv");
      const dt = new DataTransfer();
      dt.items.add(file);
      if (CSV.els.input) CSV.els.input.files = dt.files;
      renderName();
      enablePrimary();
    });

    on(CSV.els.input, "change", () => {
      const f = CSV.els.input?.files?.[0];
      if (f && !isCSV(f)) {
        alert("File harus .csv");
        CSV.els.input.value = "";
      }
      renderName();
      enablePrimary();
    });

    const enablePrimary = () => {
      const has = !!CSV.els.input?.files?.length;
      if (CSV.els.btn) CSV.els.btn.disabled = !has;
      CSV.els.changeBtn?.classList.toggle("hidden", !has);
      CSV.els.clearBtn?.classList.toggle("hidden", !has);
    };

    on(CSV.els.changeBtn, "click", () => CSV.els.input?.click());
    on(CSV.els.clearBtn, "click", () => {
      if (CSV.els.input) CSV.els.input.value = "";
      renderName();
      enablePrimary();
      clearCsvError();
    });

    // Proses CSV (AJAX)
    on(CSV.els.btn, "click", async () => {
      clearCsvError();
      const file = CSV.els.input?.files?.[0];
      if (!file) return alert("Silakan pilih file CSV terlebih dahulu.");
      if (!isCSV(file)) return alert("File harus berformat .csv");

      const fd = new FormData();
      fd.append("csvFile", file);
      CSV.els.result?.classList.add("hidden");
      if (CSV.els.tbody) CSV.els.tbody.innerHTML = "";

      // simple loader
      CSV.els.loader?.classList.remove("hidden");
      if (CSV.els.loaderBar) CSV.els.loaderBar.style.width = "0%";
      if (CSV.els.loaderTxt)
        CSV.els.loaderTxt.textContent = "Memproses CSV… 0%";

      let p = 0;
      const itv = setInterval(() => {
        if (p < 90) {
          p += 10;
          if (CSV.els.loaderBar) CSV.els.loaderBar.style.width = p + "%";
          if (CSV.els.loaderTxt)
            CSV.els.loaderTxt.textContent = `Memproses CSV… ${p}%`;
        }
      }, 200);

      try {
        const resp = await fetch("/predict_csv", { method: "POST", body: fd });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        clearInterval(itv);
        if (CSV.els.loaderBar) CSV.els.loaderBar.style.width = "100%";
        if (CSV.els.loaderTxt) CSV.els.loaderTxt.textContent = "Selesai!";

        if (data.success && Array.isArray(data.results)) {
          setCsvDataAndRender(data.results);
          Toast("success", "CSV berhasil diproses.");
        } else {
          showCsvError(data.message || "Format respons tidak sesuai.");
        }
      } catch (err) {
        clearInterval(itv);
        if (CSV.els.loaderBar) CSV.els.loaderBar.style.width = "0%";
        showCsvError(err.message || String(err));
      } finally {
        setTimeout(() => CSV.els.loader?.classList.add("hidden"), 400);
      }
    });

    renderName(); // initial
    enablePrimary();
  }

  /* =============== Modal (generic) =============== */
  // Trigger: <button data-open-modal="#supported-modal">
  // Close:   [data-close-modal] or click backdrop / Esc
  (() => {
    const dialog = document.getElementById("supported-modal");
    const openBtn = document.getElementById("open-supported-modal");
    if (!dialog || !openBtn) return;

    const open = () => dialog.showModal();
    const close = () => dialog.close();

    openBtn.addEventListener("click", open);

    // klik backdrop
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) close();
    });

    // tombol tutup & Esc
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      close();
    });
    dialog
      .querySelectorAll("[data-close-modal]")
      .forEach((btn) => btn.addEventListener("click", close));
  })();

  /* =============== Animasi Scroll & AOS =============== */
  const ioEls = qsa(".scroll-animate");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((ent) => {
        if (ent.isIntersecting) {
          ent.target.classList.add("show");
          io.unobserve(ent.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  ioEls.forEach((el) => io.observe(el));
  window.AOS?.init?.({ duration: 800, once: true });
});
