/* ============================================
 * AttritionPredict — script.js
 * ============================================
 * - Helpers (DOM, utils, toast)
 * - Navbar & navigation (shrink, back-to-top, scroll spy)
 * - Stepper (single form)
 * - Single form: autosave, validation, submit
 * - CSV Upload & Table (filter, sort, paginate, PDF)
 * - Modal (generic, data-attribute)
 * - Scroll animation (IntersectionObserver) + AOS
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

  (() => {
    const menuBtn =
      document.querySelector("#menu-btn") ||
      document.querySelector('label[for="nav-toggle"]');
    const navToggle = document.querySelector("#nav-toggle");
    const menu =
      document.querySelector("#menu") || document.querySelector("#mobile-menu");
    if (!menuBtn || !navToggle || !menu) return;

    // When checkbox changes ⇒ show/hide menu + update aria
    navToggle.addEventListener("change", () => {
      menu.classList.toggle("hidden", !navToggle.checked);
      menuBtn.setAttribute("aria-expanded", String(navToggle.checked));
    });

    // Clicking burger/X ⇒ let checkbox control the icon (peer-checked)
    menuBtn.addEventListener(
      "click",
      () => {
        // wait for checkbox state after clicking label
        requestAnimationFrame(() => {
          menu.classList.toggle("hidden", !navToggle.checked);
          menuBtn.setAttribute("aria-expanded", String(navToggle.checked));
        });
      },
      { passive: true }
    );

    // Clicking a link in the mobile menu ⇒ auto-close
    menu.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      navToggle.checked = false;
      menu.classList.add("hidden");
      menuBtn.setAttribute("aria-expanded", "false");
    });

    // Initial sync (if page is reloaded while checked)
    menu.classList.toggle("hidden", !navToggle.checked);
    menuBtn.setAttribute("aria-expanded", String(navToggle.checked));
  })();

  /* ===== Scroll spy: underline active section via aria-current ===== */
  const links = [...document.querySelectorAll(".nav-link")];

  // build the section list from the nav hrefs
  const sections = links
    .map((a) => a.getAttribute("href"))
    .filter((h) => h && h.startsWith("#"))
    .map((h) => document.querySelector(h))
    .filter(Boolean);

  const setActive = (id) => {
    links.forEach((a) => {
      const isActive = a.getAttribute("href") === `#${id}`;
      if (isActive) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  };

  // Prefer IntersectionObserver for smooth/accurate activation
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (ent.isIntersecting) setActive(ent.target.id);
        });
      },
      {
        // mark a section active when its middle is near the viewport center
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0,
      }
    );
    sections.forEach((sec) => io.observe(sec));
  } else {
    // Fallback: simple scroll math
    const navbar = document.getElementById("navbar");
    const spy = () => {
      let active = "";
      sections.forEach((s) => {
        const top = s.offsetTop - (navbar?.offsetHeight || 80) - 10;
        const bottom = top + s.offsetHeight;
        if (window.scrollY >= top && window.scrollY < bottom) active = s.id;
      });
      if (active) setActive(active);
    };
    window.addEventListener("scroll", spy, { passive: true });
    spy();
  }

  /* ===== Close the mobile menu after clicking a link (optional, but nice) ===== */
  const navToggle = document.getElementById("nav-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  mobileMenu?.addEventListener("click", (e) => {
    const a = e.target.closest("a.nav-link");
    if (!a) return;
    // close the menu
    if (navToggle) navToggle.checked = false;
  });

  /* =============== Stepper (Single Form) =============== */
  // ❗ Disable legacy/duplicate stepper — use stepper inside the main form IIFE only.
  if (false) {
    let currentStep = 1;
    const totalSteps = 5;
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
        if (currentStep === 5) buildReview();
      }
    });
    on(qs("#prevBtn"), "click", () => {
      if (currentStep > 1) showStep(--currentStep);
    });

    function buildReview() {}
  }

  /* =============== Single Form: autosave, validation, submit =============== */
  (() => {
    // ====== helpers (fallback, safe if already defined globally) ======
    // NOTE: using global helpers defined above

    // ====== Scroll reveal ======
    const revealEls = document.querySelectorAll("#prediksi .reveal");
    const doReveal = (el) => {
      el.classList.remove("opacity-0", "translate-y-3");
      el.classList.add("opacity-100", "translate-y-0");
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (ents) =>
          ents.forEach((e) => {
            if (e.isIntersecting) {
              doReveal(e.target);
              io.unobserve(e.target);
            }
          }),
        { threshold: 0.2 }
      );
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach(doReveal);
    }

    // ====== Parallax blobs ======
    const up = document.querySelectorAll('#prediksi [data-parallax="up"]');
    const down = document.querySelectorAll('#prediksi [data-parallax="down"]');
    const onScroll = () => {
      const y = window.scrollY || 0;
      up.forEach(
        (el) => (el.style.transform = `translateY(${Math.min(40, y * 0.05)}px)`)
      );
      down.forEach(
        (el) =>
          (el.style.transform = `translateY(${Math.max(-40, -y * 0.04)}px)`)
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // ====== Stepper & form base ======
    const form = document.getElementById("predictForm");
    if (!form) return;

    // Prevent HTML5 validation from rejecting required fields in hidden steps
    form.setAttribute("novalidate", "novalidate");

    const steps = Array.from(form.querySelectorAll(".form-step"));
    const circles = Array.from(
      document.querySelectorAll("#prediksi .step > div:first-child")
    );
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const submitBtn = document.getElementById("submitBtn");
    const progressLine = document.getElementById("stepProgress");
    const resultBox =
      document.getElementById("singleResult") ||
      document.getElementById("result");

    let current = 1;
    const total = steps.length;

    const setProgress = (idx) => {
      const pct = ((idx - 1) / (total - 1)) * 100;
      if (progressLine) progressLine.style.width = pct + "%";
    };

    const showStep = (idx, { animate = true } = {}) => {
      steps.forEach((fs) => {
        const active = Number(fs.dataset.step) === idx;
        if (active) {
          fs.classList.remove("hidden");
          if (animate) {
            requestAnimationFrame(() => {
              fs.classList.remove("opacity-0", "scale-[0.98]");
              fs.classList.add(
                "opacity-100",
                "scale-100",
                "transition-all",
                "duration-300",
                "ease-out"
              );
            });
          } else {
            fs.classList.remove("opacity-0", "scale-[0.98]");
          }
        } else {
          fs.classList.add("hidden");
          fs.classList.remove("opacity-100", "scale-100");
          fs.classList.add("opacity-0", "scale-[0.98]");
        }
      });

      // step circles
      circles.forEach((c, i) => {
        const stepNum = i + 1;
        if (stepNum < idx) {
          c.className =
            "mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white font-bold ring-4 ring-white shadow";
        } else if (stepNum === idx) {
          c.className =
            "mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold ring-4 ring-white shadow scale-110 transition-transform duration-300";
        } else {
          c.className =
            "mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-white font-bold ring-4 ring-white";
        }
      });

      // buttons
      prevBtn?.classList.toggle("hidden", idx === 1);
      nextBtn?.classList.toggle("hidden", idx === total);
      submitBtn?.classList.toggle("hidden", idx !== total);

      // aria
      document.querySelectorAll("#prediksi li.step").forEach((li) => {
        li.setAttribute(
          "aria-current",
          Number(li.dataset.step) === idx ? "step" : "false"
        );
      });

      // auto-fill review when entering step 5
      if (idx === 5) fillReview();

      setProgress(idx);
      current = idx;
    };

    // ====== Light validation + utility ======
    const ageInput = document.getElementById("Age");
    const ageHelp = document.getElementById("ageHelp");
    const shake = (el) => {
      el.classList.add(
        "ring-2",
        "ring-rose-500",
        "animate-[wiggle_300ms_ease-in-out]"
      );
      setTimeout(
        () => el.classList.remove("animate-[wiggle_300ms_ease-in-out]"),
        300
      );
    };

    const validateStep = (idx) => {
      const fs = steps.find((s) => Number(s.dataset.step) === idx);
      if (!fs) return true;
      const required = Array.from(fs.querySelectorAll("[required]"));
      let ok = true;

      // custom age
      if (idx === 1 && ageInput) {
        const v = Number(ageInput.value);
        const valid = v >= 18 && v <= 60;
        ageHelp?.classList.toggle("hidden", valid);
        ageInput.setAttribute("aria-invalid", valid ? "false" : "true");
        if (!valid) {
          ok = false;
          shake(ageInput);
        }
      }

      required.forEach((inp) => {
        const emptyNum = inp.type === "number" && inp.value === "";
        const emptySel = inp.tagName === "SELECT" && inp.value === "";
        const emptyOther =
          !["number", "select-one"].includes(inp.type) &&
          inp.required &&
          !inp.value;
        if (emptyNum || emptySel || emptyOther) {
          ok = false;
          shake(inp);
        }
      });
      return ok;
    };

    // ====== Autosave / restore, prevent Enter submit ======
    qsa("input, select", form).forEach((el) => {
      if (!el.name) return;
      const saved = localStorage.getItem(el.name);
      if (saved !== null) el.value = saved;
      on(el, "input", () => localStorage.setItem(el.name, el.value));
    });

    if (ageInput) {
      on(ageInput, "blur", (e) => {
        const v = Number(e.target.value);
        const invalid = v < 18 || v > 60;
        ageHelp?.classList.toggle("hidden", !invalid);
        ageInput.setAttribute("aria-invalid", invalid ? "true" : "false");
      });
    }

    on(form, "keydown", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });

    // ====== Step navigation ======
    on(nextBtn, "click", () => {
      if (validateStep(current) && current < total) showStep(current + 1);
    });
    on(prevBtn, "click", () => {
      if (current > 1) showStep(current - 1, { animate: false });
    });

    // "Edit" buttons in review
    on(document, "click", (e) => {
      const btn = e.target.closest(".review-edit");
      if (btn) {
        const go = Number(btn.dataset.gotoStep || 1);
        showStep(go);
        window.scrollTo({
          top: document.getElementById("prediksi").offsetTop - 80,
          behavior: "smooth",
        });
      }
    });

    // ====== Fill review (step 5) ======
    const fillReview = () => {
      const get = (id) => {
        const el = document.getElementById(id);
        return (el?.value ?? "").toString().trim();
      };
      const fill = (dl, entries) => {
        if (!dl) return;
        dl.innerHTML = entries
          .map(
            ([k, v]) =>
              `<div class="flex justify-between gap-4">
           <dt class="text-slate-500">${k}</dt>
           <dd class="font-medium">${v || "-"}</dd>
         </div>`
          )
          .join("");
      };
      fill(document.getElementById("review-personal"), [
        ["Name", get("EmployeeName")],
        ["Age", get("Age")],
        ["MaritalStatus", get("MaritalStatus")],
      ]);
      fill(document.getElementById("review-job"), [
        ["Department", get("Department")],
        ["Job Role", get("JobRole")],
        ["Level", get("JobLevel")],
        ["Job Involvement", get("JobInvolvement")],
        ["Job Satisfaction", get("JobSatisfaction")],
      ]);
      fill(document.getElementById("review-fin"), [
        ["Monthly Income", get("MonthlyIncome")],
        ["Daily Rate", get("DailyRate")],
        ["Stock Option", get("StockOptionLevel")],
      ]);
      fill(document.getElementById("review-life"), [
        ["Distance From Home", get("DistanceFromHome")],
        ["Environment Satisfaction", get("EnvironmentSatisfaction")],
        ["OverTime", get("OverTime")],
        ["Total Working Years", get("TotalWorkingYears")],
        ["Training Times Last Year", get("TrainingTimesLastYear")],
        ["Work Life Balance", get("WorkLifeBalance")],
        ["Years At Company", get("YearsAtCompany")],
        ["Years In Current Role", get("YearsInCurrentRole")],
        ["Years With Current Manager", get("YearsWithCurrManager")],
      ]);
    };

    // ====== Submit to /predict_api ======
    on(form, "submit", async function (e) {
      e.preventDefault();
      if (!validateStep(current)) return;

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

        if (!resultBox) return;

        // normalize probabilities (support 0–1 or 0–100)
        let b = Number(result?.probability?.bertahan ?? 0);
        let r = Number(result?.probability?.resign ?? 0);
        if (b <= 1 && r <= 1) {
          b = b * 100;
          r = r * 100;
        }

        const highB = b >= r;
        const bertahanClass = highB
          ? "text-green-600 font-bold"
          : "text-gray-700";
        const resignClass = !highB ? "text-red-600 font-bold" : "text-gray-700";
        const namaLine = result?.employee_name
          ? `<p class="text-gray-700 mb-2 dark:text-cyan-200"><span class="font-semibold dark:text-cyan-200">Name:</span> ${result.employee_name}</p>`
          : "";

        resultBox.innerHTML = `
<div role="status" aria-live="polite"
     class="max-w-3xl mx-auto mt-8 rounded-3xl p-6 md:p-8
            bg-white/70 dark:bg-white/10 backdrop-blur
            ring-1 ring-slate-200/70 dark:ring-white/10 shadow-2xl
            transition-all duration-500 ease-out reveal opacity-0 translate-y-2">

  <!-- Header -->
  <div class="flex items-center gap-3 mb-5">
    <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl
                 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow">
      <!-- crystal ball -->
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M12 2a8 8 0 0 0-6 13.3V18H6v2h12v-2h0v-2.7A8 8 0 0 0 12 2zM8 18v-1.4a7.96 7.96 0 0 0 8 0V18H8z"/>
      </svg>
    </span>
    <h4 class="text-2xl md:text-3xl font-extrabold tracking-tight
               bg-clip-text text-transparent
               bg-gradient-to-r from-cyan-300 to-emerald-200">
      Attrition Prediction Result
    </h4>
  </div>

  ${
    namaLine
      ? `<p class="text-sm md:text-base text-slate-700 dark:text-slate-200 mb-2">
         <span class="font-semibold">Name:</span> ${result.employee_name}
       </p>`
      : ""
  }

  <!-- status pill -->
  <div class="mb-6">
    <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ring-1
                 ${
                   String(result?.prediction || "").includes("Resign")
                     ? "bg-rose-50 text-rose-700 ring-rose-200/60 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20"
                     : "bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20"
                 }">
      ${
        String(result?.prediction || "").includes("Resign")
          ? "⚠️ At Risk of Resignation"
          : "🟢 Employee Retained"
      }
    </span>
  </div>

  <!-- two result cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
    <!-- Retained -->
    <article class="rounded-2xl p-5 ring-1 ring-emerald-200/50 dark:ring-emerald-400/20
                    bg-gradient-to-br from-emerald-50 to-emerald-100/60
                    dark:from-emerald-400/10 dark:to-emerald-400/5 shadow-sm">
      <header class="flex items-center justify-between">
        <h5 class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Retained</h5>
        <span class="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-300/30">Prob</span>
      </header>
      <div class="mt-3 h-3 w-full rounded-full overflow-hidden
                  bg-slate-200 dark:bg-white/10 ring-1 ring-slate-200/60 dark:ring-white/10"
           role="progressbar" aria-label="Retention Probability"
           aria-valuemin="0" aria-valuemax="100" aria-valuenow="${b.toFixed(
             2
           )}">
        <div class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600
                    transition-[width] duration-700 ease-out"
             style="width:0%" data-w="${b.toFixed(2)}%"></div>
      </div>
      <p class="mt-2 text-center text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
        ${b.toFixed(2)}%
      </p>
    </article>

    <!-- Resignation -->
    <article class="rounded-2xl p-5 ring-1 ring-rose-200/50 dark:ring-rose-400/20
                    bg-gradient-to-br from-rose-50 to-rose-100/60
                    dark:from-rose-400/10 dark:to-rose-400/5 shadow-sm">
      <header class="flex items-center justify-between">
        <h5 class="text-sm font-semibold text-rose-700 dark:text-rose-300">Resignation</h5>
        <span class="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-1 ring-rose-300/30">Prob</span>
      </header>
      <div class="mt-3 h-3 w-full rounded-full overflow-hidden
                  bg-slate-200 dark:bg-white/10 ring-1 ring-slate-200/60 dark:ring-white/10"
           role="progressbar" aria-label="Resignation Probability"
           aria-valuemin="0" aria-valuemax="100" aria-valuenow="${r.toFixed(
             2
           )}">
        <div class="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600
                    transition-[width] duration-700 ease-out"
             style="width:0%" data-w="${r.toFixed(2)}%"></div>
      </div>
      <p class="mt-2 text-center text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
        ${r.toFixed(2)}%
      </p>
    </article>
  </div>

  <!-- meta & confidence -->
  <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
    <div class="rounded-xl px-4 py-3 text-center ring-1 ring-slate-200/60 dark:ring-white/10 bg-slate-900/5 dark:bg-white/10">
      <div class="text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">Confidence</div>
      <div class="text-base font-bold text-slate-900 dark:text-white">${
        result?.confidence ?? "-"
      }</div>
    </div>
    <div class="rounded-xl px-4 py-3 text-center ring-1 ring-slate-200/60 dark:ring-white/10 bg-slate-900/5 dark:bg-white/10">
      <div class="text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">Prediction</div>
      <div class="text-base font-bold ${
        String(result?.prediction || "").includes("Resign")
          ? "text-rose-600 dark:text-rose-300"
          : "text-emerald-600 dark:text-emerald-300"
      }">
        ${result?.prediction ?? "-"}
      </div>
    </div>
    <div class="rounded-xl px-4 py-3 text-center ring-1 ring-slate-200/60 dark:ring-white/10 bg-slate-900/5 dark:bg-white/10">
      <div class="text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">Model</div>
      <div class="text-base font-bold text-slate-900 dark:text-white">${
        result?.model ?? "Random Forest (RF)"
      }</div>
    </div>
  </div>

  <!-- main factors / insights (optional) -->
  <div class="mt-6">
    <h6 class="text-sm font-semibold text-slate-800 dark:text-cyan-200 mb-2">Key Factors</h6>
    <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
      ${
        Array.isArray(result?.top_factors) && result.top_factors.length
          ? result.top_factors
              .slice(0, 4)
              .map(
                (f) =>
                  `<li class="inline-flex items-center gap-2 rounded-lg px-3 py-2 ring-1 ring-slate-200/60 dark:ring-white/10
                           bg-slate-900/5 dark:bg-white/10">
                 <span class="h-1.5 w-1.5 rounded-full ${
                   String(result?.prediction || "").includes("Resign")
                     ? "bg-rose-500"
                     : "bg-emerald-500"
                 }"></span>
                 ${f}
               </li>`
              )
              .join("")
          : ["OverTime", "JobSatisfaction", "YearsAtCompany"]
              .map(
                (f) =>
                  `<li class="inline-flex items-center gap-2 rounded-lg px-3 py-2 ring-1 ring-slate-200/60 dark:ring-white/10
                           bg-slate-900/5 dark:bg-white/10">
                 <span class="h-1.5 w-1.5 rounded-full ${
                   String(result?.prediction || "").includes("Resign")
                     ? "bg-rose-500"
                     : "bg-emerald-500"
                 }"></span>
                 ${f}
               </li>`
              )
              .join("")
      }
    </ul>
  </div>

  <!-- Actions -->
  <div class="mt-7 flex flex-wrap justify-center gap-3">
    <button id="retryBtn"
            class="inline-flex items-center gap-2 justify-center rounded-xl px-6 py-2.5 text-sm font-semibold
                   bg-gradient-to-r from-indigo-500 to-cyan-500 text-white
                   ring-1 ring-indigo-500/30 shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-400">
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 6v3l4-4-4-4v3a8 8 0 1 0 8 8h-2a6 6 0 1 1-6-6z"/></svg>
      Predict Again
    </button>
    <button id="clearBtn"
            class="inline-flex items-center gap-2 justify-center rounded-xl px-6 py-2.5 text-sm font-semibold
                   bg-rose-600 text-white shadow-sm hover:bg-rose-500
                   focus:outline-none focus:ring-2 focus:ring-rose-500">
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 7h12v2H6zm2 3h8l-1 9H9L8 10zm2-6h4l1 2H9l1-2z"/></svg>
      Clear All Data
    </button>
  </div>
</div>`;

        // reveal + animate bars
        const card = resultBox.querySelector(".reveal");
        requestAnimationFrame(() => {
          card.classList.remove("opacity-0", "translate-y-2");
          card.classList.add("opacity-100", "translate-y-0");
          qsa("[data-w]", card).forEach((el) => {
            requestAnimationFrame(
              () => (el.style.width = el.getAttribute("data-w"))
            );
          });
        });

        // actions
        on(qs("#retryBtn"), "click", () => {
          showStep(1);
          resultBox.replaceChildren();
          window.scrollTo({
            top: document.getElementById("prediksi").offsetTop - 80,
            behavior: "smooth",
          });
        });
        on(qs("#clearBtn"), "click", () => {
          localStorage.clear();
          form.reset();
          showStep(1);
          resultBox.replaceChildren();
        });

        window.Toast &&
          window.Toast("success", "Prediction processed successfully.");
      } catch (err) {
        console.error(err);
        if (resultBox) {
          resultBox.innerHTML = `
<div class="max-w-xl mx-auto bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mt-6">
  <h4 class="font-bold mb-2">An Error Occurred!</h4>
  <p>Prediction failed to process. Please try again or check your internet connection.</p>
</div>`;
        }
        window.Toast && window.Toast("error", "Failed to process prediction.");
      } finally {
        qs("#loadingSpinner")?.classList.add("hidden");
        if (btn) {
          btn.disabled = false;
          btn.classList.remove("opacity-50", "cursor-not-allowed");
        }
      }
    });

    // ====== first init ======
    showStep(1, { animate: false });
  })();

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

  /** Normalize various prediction strings to canonical labels */
  const normalizePrediction = (x = "") => {
    const p = String(x).toLowerCase().trim();
    if (
      p.includes("resign") ||
      p.includes("resignation") ||
      p.includes("mungkin resign")
    )
      return "Resignation";
    if (
      p.includes("retain") ||
      p.includes("retained") ||
      p.includes("bertahan")
    )
      return "Retained";
    return "";
  };

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
    const canon = normalizePrediction(pred);
    if (canon === "Resignation")
      return `<span class="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Resignation</span>`;
    if (String(pred).toLowerCase().includes("error"))
      return `<span class="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Error</span>`;
    return `<span class="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Retained</span>`;
  };

  const bar = (label, pct, color) => {
    const w = clampPct(pct);
    return `
  <div class="min-w-[140px]">
    <div class="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
      <div class="h-2 rounded-full ${color}" style="width:${w}%"></div>
    </div>
    <div class="mt-1 flex justify-between text-xs font-semibold text-white">
      <span>${label}</span>
      <span>${w.toFixed(2)}%</span>
    </div>
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
    <div class="bg-white rounded-xl border border-slate-200 p-4"><div class="text-xs text-slate-500">Total Rows (after filters)</div><div class="text-xl font-semibold mt-1">${count}</div></div>
    <div class="bg-white rounded-xl border border-slate-200 p-4"><div class="text-xs text-slate-500">Average % Retained</div><div class="text-xl font-semibold text-emerald-700 mt-1">${fmtPct(
      stayAvg
    )}</div></div>
    <div class="bg-white rounded-xl border border-slate-200 p-4"><div class="text-xs text-slate-500">Average Confidence</div><div class="text-xl font-semibold text-blue-700 mt-1">${fmtPct(
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
      const matchF = !f || normalizePrediction(r.prediction) === f;
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
    if (CSV.els.count) CSV.els.count.textContent = `${rows.length} rows`;
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
      CSV.els.pageInfo.textContent = `Showing ${start}–${end} of ${total}`;

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
          const name = row.employee_name ?? row.EmployeeName ?? "-";
          const initials = String(name).trim()
            ? name.slice(0, 2).toUpperCase()
            : "??";
          const idx = row.index ?? start + i + 1;
          return `
<tr class="transition-colors">
  <td class="px-5 py-3">${idx}</td>
  <td class="px-5 py-3">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-xs text-blue-700 font-semibold">${initials}</div>
      <div><div class="font-medium">${name}</div></div>
    </div>
  </td>
  <td class="px-5 py-3">${predChip(row.prediction ?? "-")}</td>
  <td class="px-5 py-3 ">${bar("Retained", stay, "bg-green-500")}</td>
  <td class="px-5 py-3">${bar("Resignation", quit, "bg-red-500")}</td>
  <td class="px-5 py-3">${confidenceBadge(row.confidence ?? "0%")}</td>
</tr>`;
        })
        .join("") ||
      `<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">No matching data.</td></tr>`;
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
    Toast("info", "Filters & sort reset.");
  });

  // Download PDF
  on(qs("#csvDownloadPdf"), "click", () => {
    if (!CSV.filtered.length) return Toast("error", "No data to download.");
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) return Toast("error", "jsPDF not loaded yet.");
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("CSV Prediction Results - AttritionPredict", 14, 14);

    const head = [
      [
        "Index",
        "Employee Name",
        "Prediction",
        "% Retained",
        "% Resignation",
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
        const predRaw = String(d.cell?.raw || "");
        if (d.section === "body" && d.column.index === 2) {
          const canon = normalizePrediction(predRaw);
          if (canon === "Resignation") d.cell.styles.textColor = [220, 38, 38];
          if (canon === "Retained") d.cell.styles.textColor = [22, 163, 74];
        }
      },
    });
    doc.save("AttritionPredict_CSV_Results.pdf");
  });

  // Upload handlers (dropzone + validate)
  const csvRootExists = !!csvRoot;
  if (csvRootExists) {
    on(CSV.els.form, "submit", (e) => e.preventDefault());

    const isCSV = (f) =>
      !!f && (/\.csv$/i.test(f.name) || f.type === "text/csv" || f.type === "");
    const renderName = () => {
      const f = CSV.els.input?.files?.[0];
      if (CSV.els.name)
        CSV.els.name.textContent = f
          ? `Selected file: ${f.name}`
          : "No file selected yet";
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
      if (!isCSV(file)) return alert("File must be .csv");
      const dt = new DataTransfer();
      dt.items.add(file);
      if (CSV.els.input) CSV.els.input.files = dt.files;
      renderName();
      enablePrimary();
    });

    on(CSV.els.input, "change", () => {
      const f = CSV.els.input?.files?.[0];
      if (f && !isCSV(f)) {
        alert("File must be .csv");
        CSV.els.input.value = "";
      }
      renderName();
      enablePrimary();
      clearCsvError();
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

    // Process CSV (AJAX)
    on(CSV.els.btn, "click", async () => {
      clearCsvError();
      const file = CSV.els.input?.files?.[0];
      if (!file) return alert("Please select a CSV file first.");
      if (!isCSV(file)) return alert("File must be in .csv format.");

      const fd = new FormData();
      fd.append("csvFile", file);
      CSV.els.result?.classList.add("hidden");
      if (CSV.els.tbody) CSV.els.tbody.innerHTML = "";

      // simple loader
      CSV.els.loader?.classList.remove("hidden");
      if (CSV.els.loaderBar) CSV.els.loaderBar.style.width = "0%";
      if (CSV.els.loaderTxt)
        CSV.els.loaderTxt.textContent = "Processing CSV… 0%";

      let p = 0;
      const itv = setInterval(() => {
        if (p < 90) {
          p += 10;
          if (CSV.els.loaderBar) CSV.els.loaderBar.style.width = p + "%";
          if (CSV.els.loaderTxt)
            CSV.els.loaderTxt.textContent = `Processing CSV… ${p}%`;
        }
      }, 200);

      try {
        const resp = await fetch("/predict_csv", { method: "POST", body: fd });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        clearInterval(itv);
        if (CSV.els.loaderBar) CSV.els.loaderBar.style.width = "100%";
        if (CSV.els.loaderTxt) CSV.els.loaderTxt.textContent = "Done!";

        if (data.success && Array.isArray(data.results)) {
          setCsvDataAndRender(data.results);
          Toast("success", "CSV processed successfully.");
        } else {
          showCsvError(data.message || "Response format is invalid.");
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

    // click backdrop
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) close();
    });

    // close button & Esc
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      close();
    });
    dialog
      .querySelectorAll("[data-close-modal]")
      .forEach((btn) => btn.addEventListener("click", close));
  })();

  /* =============== Scroll Animation & AOS =============== */
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

(() => {
  const els = document.querySelectorAll(".animate-reveal");
  if (!("IntersectionObserver" in window) || !els.length) {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  els.forEach((el) => io.observe(el));
})();

(() => {
  // 1) Reveal on scroll
  const els = document.querySelectorAll(".reveal");
  const show = (el) => {
    el.classList.remove("opacity-0", "translate-y-4");
    el.classList.add("opacity-100", "translate-y-0");
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            show(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach(show);
  }

  // 2) Light parallax for blobs (without custom CSS)
  const up = document.querySelector('[data-parallax="up"]');
  const down = document.querySelector('[data-parallax="down"]');
  const onScroll = () => {
    const y = window.scrollY || 0;
    // smooth movement: small scale to keep it elegant
    const t1 = `translateY(${Math.min(20, y * 0.04)}px)`;
    const t2 = `translateY(${Math.max(-20, -y * 0.03)}px)`;
    up && (up.style.transform = t1);
    down && (down.style.transform = t2);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();
(() => {
  // Reveal on scroll
  const els = document.querySelectorAll("#fitur-data .reveal");
  const show = (el) => {
    el.classList.remove("opacity-0", "translate-y-4");
    el.classList.add("opacity-100", "translate-y-0");
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            show(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach(show);
  }

  // Light parallax for blobs
  const up = document.querySelector('#fitur-data [data-parallax="up"]');
  const down = document.querySelector('#fitur-data [data-parallax="down"]');
  const onScroll = () => {
    const y = window.scrollY || 0;
    const t1 = `translateY(${Math.min(24, y * 0.05)}px)`;
    const t2 = `translateY(${Math.max(-24, -y * 0.04)}px)`;
    up && (up.style.transform = t1);
    down && (down.style.transform = t2);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();
(() => {
  // helper: reveal
  const revealEls = document.querySelectorAll(
    "#model .reveal, #cara-kerja .reveal"
  );
  const doReveal = (el) => {
    el.classList.remove("opacity-0", "translate-y-4");
    el.classList.add("opacity-100", "translate-y-0");
  };

  // helper: animate progress widths inside a revealed container
  const fillBars = (root) => {
    root.querySelectorAll("[data-w]").forEach((bar) => {
      const target = bar.getAttribute("data-w");
      // force reflow to ensure transition
      bar.getBoundingClientRect();
      bar.style.width = target;
    });
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            doReveal(e.target);
            fillBars(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => {
      doReveal(el);
      fillBars(el);
    });
  }

  // Light parallax for blobs (both sections)
  const parallaxUp = document.querySelectorAll('[data-parallax="up"]');
  const parallaxDown = document.querySelectorAll('[data-parallax="down"]');
  const onScroll = () => {
    const y = window.scrollY || 0;
    const tUp = `translateY(${Math.min(30, y * 0.05)}px)`;
    const tDown = `translateY(${Math.max(-30, -y * 0.04)}px)`;
    parallaxUp.forEach((el) => (el.style.transform = tUp));
    parallaxDown.forEach((el) => (el.style.transform = tDown));
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();
