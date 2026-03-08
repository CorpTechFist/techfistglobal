(function () {
  "use strict";

  function getCurrentFile() {
    var path = window.location.pathname || "";
    var file = path.split("/").pop();
    return file ? file : "index.html";
  }

  function parseNavHref(href) {
    if (!href) return null;
    if (href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return null;

    var clean = href.split("?")[0];
    var hashIndex = clean.indexOf("#");
    var hash = hashIndex >= 0 ? clean.slice(hashIndex) : "";
    var path = hashIndex >= 0 ? clean.slice(0, hashIndex) : clean;
    var file = path ? path.split("/").pop() : "";

    return {
      file: file || "index.html",
      hash: hash,
    };
  }

  function markNavLinkActive(link) {
    if (!link) return;
    link.setAttribute("aria-current", "page");
    link.classList.add("is-active");
  }

  function setActiveNavLink() {
    var currentFile = getCurrentFile();
    var currentHash = window.location.hash || "";
    var links = document.querySelectorAll(".eco-nav a.nav-link, .eco-nav .dropdown-item");

    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var meta = parseNavHref(a.getAttribute("href"));
      if (!meta) continue;

      var fileMatches = meta.file === currentFile;
      var hashMatches = !meta.hash || (currentHash && meta.hash === currentHash);

      if (!fileMatches || !hashMatches) continue;

      markNavLinkActive(a);

      var dropdown = a.closest(".dropdown");
      if (dropdown) markNavLinkActive(dropdown.querySelector(".dropdown-toggle"));
    }
  }

  function closeNavCollapse(collapseEl) {
    if (!collapseEl || !collapseEl.classList.contains("show")) return;

    if (window.jQuery && window.jQuery.fn && window.jQuery.fn.collapse) {
      window.jQuery(collapseEl).collapse("hide");
      return;
    }

    collapseEl.classList.remove("show");

    var toggler = document.querySelector("[data-target='#" + collapseEl.id + "']");
    if (toggler) {
      toggler.classList.add("collapsed");
      toggler.setAttribute("aria-expanded", "false");
    }
  }

  function resetDropdowns(navEl) {
    if (!navEl) return;

    var openDropdowns = navEl.querySelectorAll(".eco-dropdown.show");
    for (var i = 0; i < openDropdowns.length; i++) {
      openDropdowns[i].classList.remove("show");

      var toggle = openDropdowns[i].querySelector(".dropdown-toggle");
      var menu = openDropdowns[i].querySelector(".dropdown-menu");

      if (toggle) toggle.setAttribute("aria-expanded", "false");
      if (menu) menu.classList.remove("show");
    }
  }

  function initNavInteractions() {
    var nav = document.querySelector(".eco-nav");
    if (!nav) return;

    var collapse = nav.querySelector(".navbar-collapse");
    if (!collapse) return;

    var closeTargets = nav.querySelectorAll(".nav-link:not(.dropdown-toggle), .dropdown-item, .nav-cta .btn-eco");
    for (var i = 0; i < closeTargets.length; i++) {
      closeTargets[i].addEventListener("click", function () {
        closeNavCollapse(collapse);
      });
    }

    if (window.jQuery && window.jQuery.fn && window.jQuery.fn.collapse) {
      window.jQuery(collapse).on("hide.bs.collapse", function () {
        resetDropdowns(nav);
      });
    }
  }

  function initReveals() {
    var prefersReduced = false;
    try {
      prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      prefersReduced = false;
    }

    function mark(el, delayMs) {
      if (!el || !el.classList) return;
      if (!el.classList.contains("reveal")) el.classList.add("reveal");
      if (typeof delayMs === "number" && delayMs > 0) el.style.transitionDelay = delayMs + "ms";
    }

    var heads = document.querySelectorAll(".section-head");
    for (var i = 0; i < heads.length; i++) mark(heads[i], 0);

    var grids = document.querySelectorAll(
      ".card-grid, .metrics-grid, .flow-grid, .case-grid, .team-grid, .proof-grid, .badge-row"
    );
    for (var g = 0; g < grids.length; g++) {
      var children = grids[g].children;
      for (var c = 0; c < children.length; c++) {
        mark(children[c], Math.min(c, 10) * 70);
      }
    }

    var blocks = document.querySelectorAll(".hero-panel, .contact-card, .demo-log, .demo-step");
    for (var b = 0; b < blocks.length; b++) mark(blocks[b], 0);

    var targets = document.querySelectorAll(".reveal");
    if (prefersReduced || !("IntersectionObserver" in window)) {
      for (var t = 0; t < targets.length; t++) targets[t].classList.add("is-visible");
      return;
    }

    // Mark anything already in the viewport as visible before enabling animation CSS.
    var vh = window.innerHeight || 0;
    if (!vh) {
      for (var i = 0; i < targets.length; i++) targets[i].classList.add("is-visible");
      return;
    }

    for (var i = 0; i < targets.length; i++) {
      var rect = targets[i].getBoundingClientRect();
      if (rect.top < vh && rect.bottom > 0) targets[i].classList.add("is-visible");
    }

    // Enable reveal animations for the rest of the page (below-the-fold, etc).
    document.documentElement.classList.add("js-reveal");

    var obs = new IntersectionObserver(
      function (entries, observer) {
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    for (var k = 0; k < targets.length; k++) {
      if (!targets[k].classList.contains("is-visible")) obs.observe(targets[k]);
    }
  }

  function parseNumber(value) {
    var n = Number(String(value || "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : NaN;
  }

  function formatUSD(amount) {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
        amount
      );
    } catch (e) {
      return "$" + Math.round(amount).toString();
    }
  }

  function formatNumber(amount, maxFractionDigits) {
    var digits = typeof maxFractionDigits === "number" ? maxFractionDigits : 2;
    try {
      return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(amount);
    } catch (e) {
      return String(amount);
    }
  }

  function initRoiCalculator() {
    var form = document.getElementById("roi-calculator");
    if (!form) return;

    var kwhEl = form.querySelector("[name='annual_kwh']");
    var rateEl = form.querySelector("[name='cost_per_kwh']");
    var reductionEl = form.querySelector("[name='reduction_pct']");
    var factorEl = form.querySelector("[name='emissions_factor']");
    var projectCostEl = form.querySelector("[name='project_cost']");

    var outSavings = document.getElementById("roi-cost-savings");
    var outCo2 = document.getElementById("roi-co2-savings");
    var outPayback = document.getElementById("roi-payback");
    var outNote = document.getElementById("roi-note");
    var sampleBtn = form.querySelector("[data-roi-sample]");

    function update() {
      if (!kwhEl || !rateEl || !reductionEl || !factorEl) return;

      var kwh = parseNumber(kwhEl.value);
      var rate = parseNumber(rateEl.value);
      var reductionPct = parseNumber(reductionEl.value);
      var factor = parseNumber(factorEl.value);
      var projectCost = projectCostEl ? parseNumber(projectCostEl.value) : NaN;

      var ok =
        Number.isFinite(kwh) &&
        kwh > 0 &&
        Number.isFinite(rate) &&
        rate >= 0 &&
        Number.isFinite(reductionPct) &&
        reductionPct >= 0 &&
        Number.isFinite(factor) &&
        factor >= 0;

      if (!ok) {
        if (outSavings) outSavings.textContent = "--";
        if (outCo2) outCo2.textContent = "--";
        if (outPayback) outPayback.textContent = "--";
        if (outNote) outNote.textContent = "Enter your baselines to estimate savings.";
        return;
      }

      var reduction = reductionPct / 100;
      var costSavings = kwh * rate * reduction;
      var co2Kg = kwh * factor * reduction;
      var co2Tons = co2Kg / 1000;

      if (outSavings) outSavings.textContent = formatUSD(costSavings) + " / year";
      if (outCo2) outCo2.textContent = formatNumber(co2Tons, 1) + " tCO2e / year";

      if (outPayback) {
        if (Number.isFinite(projectCost) && projectCost > 0 && costSavings > 0) {
          var months = projectCost / (costSavings / 12);
          outPayback.textContent = formatNumber(months, 1) + " months";
        } else {
          outPayback.textContent = "Add project cost to estimate";
        }
      }

      if (outNote) {
        outNote.textContent =
          "Directional math only (not a guarantee). Verify with your utility rates, baselines, and grid factors.";
      }
    }

    form.addEventListener("input", update);
    form.addEventListener("change", update);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
    });

    if (sampleBtn) {
      sampleBtn.addEventListener("click", function () {
        if (kwhEl) kwhEl.value = "2500000";
        if (rateEl) rateEl.value = "0.12";
        if (reductionEl) reductionEl.value = "18";
        if (factorEl) factorEl.value = "0.38";
        if (projectCostEl) projectCostEl.value = "250000";
        update();
      });
    }

    update();
  }

  function initAgentDemo() {
    var demo = document.getElementById("agent-demo");
    if (!demo) return;

    var btn = demo.querySelector("[data-run-demo]");
    var log = demo.querySelector(".demo-log-body");
    var steps = Array.prototype.slice.call(demo.querySelectorAll(".demo-step"));

    if (!btn || !log || !steps.length) return;

    var running = false;

    function setStepState(stepEl, state, label) {
      stepEl.classList.remove("is-ready", "is-running", "is-done");
      if (state) stepEl.classList.add(state);
      var statusEl = stepEl.querySelector("[data-status]");
      if (statusEl && label) statusEl.textContent = label;
    }

    function reset() {
      log.textContent = "";
      for (var i = 0; i < steps.length; i++) setStepState(steps[i], "is-ready", "Ready");
    }

    function append(line) {
      log.textContent += line + "\n";
      log.scrollTop = log.scrollHeight;
    }

    function sleep(ms) {
      return new Promise(function (resolve) {
        window.setTimeout(resolve, ms);
      });
    }

    async function run() {
      if (running) return;
      running = true;
      btn.disabled = true;

      reset();
      append("Starting simulated IT support agent run...");
      await sleep(400);

      var messages = [
        "Ticket received: employee requests Adobe access and reports a VPN issue...",
        "Retrieving identity profile, manager, device status, policy rules, and prior tickets...",
        "Drafting a resolution plan with access recommendation, VPN checks, and employee response...",
        "Routing access change through manager approval and policy validation...",
        "Executing approved updates, notifying the employee, and logging the audit trail...",
      ];

      for (var i = 0; i < steps.length; i++) {
        setStepState(steps[i], "is-running", "Running");
        append(messages[i] || "Running step " + (i + 1) + "...");
        await sleep(800);
        setStepState(steps[i], "is-done", "Done");
        await sleep(250);
      }

      append("Run complete. Outcome: access request routed, support actions completed, and ticket history updated.");
      btn.disabled = false;
      running = false;
    }

    btn.addEventListener("click", function () {
      run();
    });

    reset();
  }

  function getSiteLinks() {
    var path = window.location.pathname || "";
    var isInner = path.indexOf("/pages/") >= 0;
    var pagePrefix = isInner ? "" : "pages/";
    var home = isInner ? "../index.html" : "index.html";

    return {
      home: home,
      contact: home + "#contact",
      team: home + "#team",
      corpus: isInner ? "../data/chatbot-corpus.json" : "data/chatbot-corpus.json",
      logo: isInner ? "../images/tfglogo.png" : "images/tfglogo.png",
      booking: "https://calendar.app.google/YKzYcc1ncdiGsNpD9",
      email: "mailto:contact@techfistglobal.com",
      phone: "tel:+16042607975",
      agentic: pagePrefix + "agentic-ai.html",
      sustainability: pagePrefix + "platform.html",
      trust: pagePrefix + "trust-infrastructure.html",
      compliance: pagePrefix + "compliance.html",
      automation: pagePrefix + "automation.html",
      qa: pagePrefix + "qa.html",
      cloud: pagePrefix + "cloud.html",
      supplier: pagePrefix + "salesforce.html",
      aiml: pagePrefix + "ai-ml.html",
      appdev: pagePrefix + "app-dev.html",
      staffing: pagePrefix + "staffing.html",
      product: pagePrefix + "inhouse.html",
      cases: pagePrefix + "case-studies.html",
    };
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s/&-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenizeForFuzzy(value) {
    var stopWords = {
      a: true,
      an: true,
      and: true,
      are: true,
      as: true,
      at: true,
      be: true,
      by: true,
      for: true,
      from: true,
      how: true,
      i: true,
      in: true,
      is: true,
      it: true,
      me: true,
      of: true,
      on: true,
      or: true,
      our: true,
      should: true,
      tell: true,
      the: true,
      their: true,
      there: true,
      this: true,
      to: true,
      us: true,
      we: true,
      what: true,
      when: true,
      where: true,
      who: true,
      why: true,
      with: true,
      you: true,
      your: true,
    };

    var words = normalizeText(value).split(" ");
    var out = [];
    var seen = {};

    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      if (!word || stopWords[word]) continue;
      if (seen[word]) continue;
      seen[word] = true;
      out.push(word);
    }

    return out;
  }

  function makeNgrams(value, size) {
    var input = normalizeText(value).replace(/\s+/g, " ");
    var out = [];
    var seen = {};
    var n = size || 3;
    var gram;
    var i;

    if (!input) return out;
    if (input.length <= n) return [input];

    for (i = 0; i <= input.length - n; i++) {
      gram = input.slice(i, i + n);
      if (seen[gram]) continue;
      seen[gram] = true;
      out.push(gram);
    }

    return out;
  }

  function overlapRatio(source, target) {
    var map = {};
    var matches = 0;
    var i;

    if (!source.length || !target.length) return 0;

    for (i = 0; i < target.length; i++) map[target[i]] = true;
    for (i = 0; i < source.length; i++) {
      if (map[source[i]]) matches += 1;
    }

    return matches / Math.max(source.length, target.length);
  }

  function diceCoefficient(a, b) {
    var aNgrams = makeNgrams(a, 3);
    var bNgrams = makeNgrams(b, 3);
    var map = {};
    var matches = 0;
    var i;

    if (!aNgrams.length || !bNgrams.length) return 0;

    for (i = 0; i < bNgrams.length; i++) map[bNgrams[i]] = true;
    for (i = 0; i < aNgrams.length; i++) {
      if (map[aNgrams[i]]) matches += 1;
    }

    return (2 * matches) / (aNgrams.length + bNgrams.length);
  }

  function phraseSimilarity(query, phrase) {
    var queryNorm = normalizeText(query);
    var phraseNorm = normalizeText(phrase);
    var queryTokens;
    var phraseTokens;
    var overlap;
    var dice;

    if (!queryNorm || !phraseNorm) return 0;
    if (queryNorm === phraseNorm) return 1;
    if (queryNorm.indexOf(phraseNorm) >= 0 || phraseNorm.indexOf(queryNorm) >= 0) return 0.96;

    queryTokens = tokenizeForFuzzy(queryNorm);
    phraseTokens = tokenizeForFuzzy(phraseNorm);
    overlap = overlapRatio(queryTokens, phraseTokens);
    dice = diceCoefficient(queryNorm, phraseNorm);

    return Math.max(overlap * 0.9, dice);
  }

  function resolveCorpusAction(action, links) {
    var hrefMap = {
      home: links.home,
      contact: links.contact,
      team: links.team,
      booking: links.booking,
      email: links.email,
      phone: links.phone,
      agentic: links.agentic,
      sustainability: links.sustainability,
      trust: links.trust,
      compliance: links.compliance,
      automation: links.automation,
      qa: links.qa,
      cloud: links.cloud,
      supplier: links.supplier,
      aiml: links.aiml,
      appdev: links.appdev,
      staffing: links.staffing,
      product: links.product,
      cases: links.cases,
    };
    var href = action && action.href ? action.href : hrefMap[action && action.key ? action.key : ""];
    var isExternal = href === links.booking || (action && action.external);

    if (!href || !action || !action.label) return null;

    return {
      label: action.label,
      href: href,
      external: !!isExternal,
      kind: action.kind,
    };
  }

  function loadChatbotCorpus(path) {
    if (!window.fetch || !path) return Promise.resolve([]);

    return window
      .fetch(path, { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) throw new Error("Failed to load chatbot corpus");
        return response.json();
      })
      .then(function (data) {
        return data && Array.isArray(data.entries) ? data.entries : [];
      })
      .catch(function () {
        return [];
      });
  }

  function canPersistChatbotSession() {
    try {
      if (!window.sessionStorage) return false;
      window.sessionStorage.setItem("__tf_chatbot_test__", "1");
      window.sessionStorage.removeItem("__tf_chatbot_test__");
      return true;
    } catch (error) {
      return false;
    }
  }

  function toAbsoluteHref(href) {
    var value = String(href || "");
    var anchor;

    if (!value) return "";
    if (/^(https?:|mailto:|tel:)/i.test(value)) return value;

    anchor = document.createElement("a");
    anchor.href = value;
    return anchor.href;
  }

  function sanitizeChatbotPayload(payload) {
    var safe = {
      badge: "",
      title: "",
      text: "",
      paragraphs: [],
      bullets: [],
      actions: [],
      topic: "",
    };
    var i;

    if (!payload) return safe;

    safe.badge = payload.badge ? String(payload.badge) : "";
    safe.title = payload.title ? String(payload.title) : "";
    safe.text = payload.text ? String(payload.text) : "";
    safe.topic = payload.topic ? String(payload.topic) : "";

    if (Array.isArray(payload.paragraphs)) {
      for (i = 0; i < payload.paragraphs.length && i < 6; i++) {
        safe.paragraphs.push(String(payload.paragraphs[i]));
      }
    }

    if (Array.isArray(payload.bullets)) {
      for (i = 0; i < payload.bullets.length && i < 8; i++) {
        safe.bullets.push(String(payload.bullets[i]));
      }
    }

    if (Array.isArray(payload.actions)) {
      for (i = 0; i < payload.actions.length && i < 4; i++) {
        if (!payload.actions[i] || !payload.actions[i].label || !payload.actions[i].href) continue;
        safe.actions.push({
          label: String(payload.actions[i].label),
          href: toAbsoluteHref(payload.actions[i].href),
          external: !!payload.actions[i].external,
          kind: payload.actions[i].kind ? String(payload.actions[i].kind) : "",
        });
      }
    }

    return safe;
  }

  function loadPersistedChatbotSession() {
    var raw;
    var data;
    var history = [];
    var i;

    if (!canPersistChatbotSession()) return null;

    try {
      raw = window.sessionStorage.getItem("tf-chatbot-session-v1");
      if (!raw) return null;
      data = JSON.parse(raw);
      if (!data || typeof data !== "object") return null;

      if (Array.isArray(data.history)) {
        for (i = 0; i < data.history.length; i++) {
          if (!data.history[i] || !data.history[i].role || !data.history[i].payload) continue;
          history.push({
            role: data.history[i].role === "user" ? "user" : "assistant",
            payload: sanitizeChatbotPayload(data.history[i].payload),
          });
        }
      }

      return {
        isOpen: !!data.isOpen,
        lastTopic: data.lastTopic ? String(data.lastTopic) : "",
        page: data.page ? String(data.page) : "",
        resumeFocus: !!data.resumeFocus,
        resumeScrollY: typeof data.resumeScrollY === "number" ? data.resumeScrollY : null,
        history: history,
      };
    } catch (error) {
      return null;
    }
  }

  function savePersistedChatbotSession(data) {
    if (!canPersistChatbotSession()) return;

    try {
      window.sessionStorage.setItem("tf-chatbot-session-v1", JSON.stringify(data));
    } catch (error) {
      // Ignore storage failures so the chatbot still works without persistence.
    }
  }

  function focusChatbotInput(input, preventScroll) {
    if (!input || typeof input.focus !== "function") return;

    try {
      if (preventScroll) input.focus({ preventScroll: true });
      else input.focus();
    } catch (error) {
      input.focus();
    }
  }

  function scoreCorpusEntry(query, entry, context, state) {
    var prompt = normalizeText(query);
    var promptTokens = tokenizeForFuzzy(prompt);
    var phrases = [];
    var keywordTokens = [];
    var bestPhrase = 0;
    var keywordOverlap = 0;
    var titleScore = 0;
    var score = 0;
    var i;

    if (!entry) return 0;

    if (Array.isArray(entry.questions)) phrases = phrases.concat(entry.questions);
    if (Array.isArray(entry.keywords)) phrases = phrases.concat(entry.keywords);
    if (entry.title) phrases.push(entry.title);

    for (i = 0; i < phrases.length; i++) {
      bestPhrase = Math.max(bestPhrase, phraseSimilarity(prompt, phrases[i]));
    }

    if (Array.isArray(entry.keywords)) {
      for (i = 0; i < entry.keywords.length; i++) {
        keywordTokens = keywordTokens.concat(tokenizeForFuzzy(entry.keywords[i]));
      }
    }

    if (keywordTokens.length) keywordOverlap = overlapRatio(promptTokens, keywordTokens);
    if (entry.title) titleScore = phraseSimilarity(prompt, entry.title);

    score = bestPhrase * 0.62 + keywordOverlap * 0.22 + titleScore * 0.1;

    if (context && entry.topic && context.id === entry.topic) score += 0.05;
    if (state && state.lastTopic && entry.topic && state.lastTopic === entry.topic) score += 0.04;
    if (prompt.indexOf("this page") >= 0 && context && entry.topic === context.id) score += 0.08;

    return Math.min(score, 1);
  }

  function buildCorpusResponse(entry, links) {
    var actions = [];
    var i;
    var resolved;

    if (entry && Array.isArray(entry.actions)) {
      for (i = 0; i < entry.actions.length; i++) {
        resolved = resolveCorpusAction(entry.actions[i], links);
        if (resolved) actions.push(resolved);
      }
    }

    return withTopic(entry.topic || entry.id || "general", {
      badge: entry.badge || "TechFist Agent",
      title: entry.title || "TechFist Agent",
      text: entry.answer || "",
      bullets: Array.isArray(entry.bullets) ? entry.bullets : [],
      actions: actions,
    });
  }

  function buildCorpusFallbackResponse(matches, links, context) {
    var bullets = [];
    var i;

    if (matches && matches.length) {
      for (i = 0; i < matches.length && i < 3; i++) {
        bullets.push("Closest match: " + matches[i].entry.title);
      }
    }

    if (context && context.label) {
      bullets.push("You are on the " + context.label + " page, so questions about this service will usually match more accurately.");
    }

    bullets.push("Try asking about AI agent onboarding, Technology Consulting, Sustainability verification, blockchain attestation, implementation, pricing, or booking an assessment.");

    return withTopic("general", {
      badge: "TechFist Agent",
      title: "I could not find a strong enough match yet",
      text: "Type the question a little more directly and I will match it against the knowledge base again.",
      bullets: bullets,
      actions: [
        { label: "Book Assessment", href: links.booking, external: true, kind: "primary" },
        { label: "Email Delivery Team", href: links.email },
      ],
    });
  }

  function scoreTerms(text, terms) {
    var score = 0;
    for (var i = 0; i < terms.length; i++) {
      var term = normalizeText(terms[i]);
      if (!term) continue;
      if (text.indexOf(term) >= 0) score += term.indexOf(" ") >= 0 ? 5 : 2;
    }
    return score;
  }

  function createChatbotAction(action) {
    var link = document.createElement("a");
    link.className = "tf-chatbot-action";
    if (action.kind === "primary") link.className += " tf-chatbot-action-primary";
    link.href = action.href;
    link.textContent = action.label;

    if (action.external) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    return link;
  }

  function withTopic(topic, payload) {
    if (payload) payload.topic = topic;
    return payload;
  }

  function getChatbotContext(currentFile) {
    var contexts = {
      "agentic-ai.html": {
        id: "agentic",
        label: "Agentic AI",
        prompt: "What can your Agentic AI service automate?",
      },
      "platform.html": {
        id: "sustainability",
        label: "Sustainability",
        prompt: "How does the Sustainability platform work?",
      },
      "trust-infrastructure.html": {
        id: "trust",
        label: "Trust Infrastructure",
        prompt: "How does Trust Infrastructure use blockchain?",
      },
      "compliance.html": {
        id: "compliance",
        label: "Compliance Automation",
        prompt: "What does Compliance Automation cover?",
      },
      "automation.html": {
        id: "automation",
        label: "Compliance Automation Services",
        prompt: "What does the Compliance Automation Services page cover?",
      },
      "qa.html": {
        id: "qa",
        label: "Data Assurance",
        prompt: "What is included in Data Assurance?",
      },
      "cloud.html": {
        id: "cloud",
        label: "Cloud Infrastructure",
        prompt: "How does Cloud Infrastructure support the platform?",
      },
      "salesforce.html": {
        id: "supplier",
        label: "Supplier Engagement",
        prompt: "How does Supplier Engagement fit Sustainability?",
      },
      "ai-ml.html": {
        id: "aiml",
        label: "Predictive Energy Optimization",
        prompt: "How does Predictive Energy Optimization reduce cost and carbon?",
      },
      "app-dev.html": {
        id: "appdev",
        label: "Custom Sustainability Apps",
        prompt: "What kinds of custom sustainability apps does TechFist build?",
      },
      "staffing.html": {
        id: "staffing",
        label: "Technology Consulting",
        prompt: "What does Technology Consulting cover?",
      },
      "inhouse.html": {
        id: "product",
        label: "EcoSustainability Platform",
        prompt: "How is the EcoSustainability Platform product page structured?",
      },
      "case-studies.html": {
        id: "cases",
        label: "Case Studies",
        prompt: "Can you show proof or examples?",
      },
    };

    return contexts[currentFile] || null;
  }

  function getChatbotQuickPrompts(context) {
    var prompts = [
      "We want to onboard AI agents. Where should we start?",
      "Should we start with Technology Consulting or a core offer?",
      "What is the difference between Sustainability and Trust Infrastructure?",
      "What happens during the assessment?",
      "Do you build multi-agent systems?",
    ];

    if (context && context.prompt) prompts.unshift(context.prompt);

    return prompts.slice(0, 5);
  }

  function getWelcomeResponse(context, links) {
    var bullets = [
      "Agentic AI for onboarding AI agents, governed automation, and multi-agent delivery.",
      "Sustainability for campaigns, evidence collection, verification, and audit-ready reporting.",
      "Trust Infrastructure for decentralized evidence, blockchain-backed attestation, and traceability.",
      "Technology Consulting when you need roadmap, architecture, governance, or rollout planning before choosing a build.",
    ];

    if (context && context.label) {
      bullets.unshift("You are currently on the " + context.label + " page, so I can answer page-specific questions too.");
    }

    return {
      badge: "TechFist Agent",
      title: "Ask me about services, fit, or booking",
      text: "I can answer questions about the three core offers, the Technology Consulting entry point, how they fit together, what implementation usually looks like, and whether an assessment is the right next step.",
      bullets: bullets,
      actions: [
        { label: "Book Assessment", href: links.booking, external: true, kind: "primary" },
        { label: "View Case Studies", href: links.cases },
      ],
      suggestions: getChatbotQuickPrompts(context),
    };
  }

  function getOfferingsResponse(links) {
    return {
      badge: "Three Core Offers",
      title: "TechFist Global offer structure",
      text: "The site is organized around three buyer-facing offers plus a supporting Technology Consulting entry point for teams that need the roadmap before delivery.",
      bullets: [
        "Agentic AI: onboard AI agents, build multi-agent systems, and automate support, IT, revenue, engineering, and operations.",
        "Sustainability: run Scope 1 and 2 campaigns, collect evidence, verify submissions, and produce audit-ready reporting.",
        "Trust Infrastructure: verify, attest, and defend evidence with audit trails, decentralized evidence exchange, and blockchain-backed attestation.",
        "Technology Consulting: assess use cases, define architecture and governance, select systems or vendors, and sequence rollout.",
      ],
      actions: [
        { label: "Explore Agentic AI", href: links.agentic, kind: "primary" },
        { label: "Explore Sustainability", href: links.sustainability },
        { label: "Explore Trust Infrastructure", href: links.trust },
        { label: "Explore Technology Consulting", href: links.staffing },
      ],
      suggestions: [
        "Which service should I start with?",
        "What does Technology Consulting cover?",
        "Do you build multi-agent systems?",
        "How does blockchain fit Sustainability?",
      ],
    };
  }

  function getCompareResponse(links) {
    return {
      badge: "Service Fit",
      title: "Which core service fits which problem",
      text: "Choose the offer based on the operational problem you are trying to solve.",
      bullets: [
        "Choose Agentic AI when you want to automate work, onboard AI agents, or build multi-agent systems with human oversight.",
        "Choose Sustainability when you need to run sustainability programs, launch campaigns, manage evidence, and report with operational control.",
        "Choose Trust Infrastructure when the highest-value problem is verification, attestation, package lineage, or defensible evidence across industries.",
        "Choose Technology Consulting first when you still need the roadmap, architecture, governance model, or vendor strategy before committing to delivery.",
      ],
      actions: [
        { label: "Book Assessment", href: links.booking, external: true, kind: "primary" },
        { label: "Explore Technology Consulting", href: links.staffing },
        { label: "Open Contact Section", href: links.contact },
      ],
      suggestions: [
        "Tell me more about Agentic AI",
        "Should I start with Technology Consulting?",
        "Tell me more about Sustainability",
        "Tell me more about Trust Infrastructure",
      ],
    };
  }

  function getBookingResponse(links) {
    return {
      badge: "Booking",
      title: "Book an assessment",
      text: "The fastest route is the live Google booking calendar already connected on the site.",
      bullets: [
        "Choose a live slot in your timezone.",
        "Add context about your priorities before the call.",
        "Google sends the invite and calendar confirmation automatically.",
      ],
      actions: [
        { label: "Open Booking Calendar", href: links.booking, external: true, kind: "primary" },
        { label: "Email Delivery Team", href: links.email },
      ],
      suggestions: [
        "What should I prepare for the call?",
        "Which service fits my use case?",
      ],
    };
  }

  function getPricingResponse(links) {
    return {
      badge: "Commercial Model",
      title: "Pricing is scoped, not flat-rate",
      text: "There is no public fixed price because scope depends on workflow complexity, data environment, verification controls, integrations, and rollout model.",
      bullets: [
        "Assessments are used to define the use case, pilot shape, and governance model.",
        "Agentic AI scope changes based on workflow count, approvals, system integration, and human-in-the-loop controls.",
        "Sustainability and Trust Infrastructure scope changes based on evidence policy, reporting depth, verification queues, and attestation requirements.",
      ],
      actions: [{ label: "Book Assessment", href: links.booking, external: true, kind: "primary" }],
      suggestions: [
        "What do you offer?",
        "How does Trust Infrastructure work?",
      ],
    };
  }

  function getAgenticAiResponse(links) {
    return {
      badge: "Agentic AI",
      title: "Agentic AI services",
      text: "This offer is for enterprise teams that want governed automation and agent rollout, not isolated AI demos.",
      bullets: [
        "AI onboarding and readiness: identify workflows, guardrails, approval points, and rollout priorities.",
        "Multi-agent system development: coordinate specialized agents across support, IT, revenue, engineering, and back-office operations.",
        "Governed production rollout: human oversight, escalation paths, observability, security boundaries, and fallback handling.",
      ],
      actions: [
        { label: "Explore Agentic AI", href: links.agentic, kind: "primary" },
        { label: "Book AI Assessment", href: links.booking, external: true },
      ],
      suggestions: [
        "Do you support employee IT agents?",
        "Can you onboard AI agents for our team?",
        "Which service fits a multi-agent build?",
      ],
    };
  }

  function getSustainabilityResponse(links) {
    return {
      badge: "Sustainability",
      title: "EcoSustainability Platform",
      text: "The Sustainability offer is positioned as an operating platform, not generic ESG messaging.",
      bullets: [
        "Launch campaigns with guided setup, manager propose and admin approve workflow, and policy-safe defaults.",
        "Collect evidence with pre-submit checks, deterministic reason codes, verification queues, SLA visibility, and release gates.",
        "Produce audit-ready reporting while linking evidence lineage to the Trust Infrastructure layer for stronger defensibility.",
      ],
      actions: [
        { label: "Explore Sustainability", href: links.sustainability, kind: "primary" },
        { label: "Explore Trust Infrastructure", href: links.trust },
      ],
      suggestions: [
        "How does verification work?",
        "How does Trust Infrastructure fit Sustainability?",
        "Can I book a sustainability assessment?",
      ],
    };
  }

  function getTrustResponse(links) {
    return {
      badge: "Trust Infrastructure",
      title: "Evidence trust and blockchain-backed attestation",
      text: "Trust Infrastructure is the standalone service for verification, decentralized evidence, and defensible reporting across industries.",
      bullets: [
        "Deterministic validation, reason-coded review decisions, and release gates before high-risk claims move forward.",
        "Audit-ready lifecycle trace with actor, timestamp, reason, and evidence linkage for every important decision.",
        "Blockchain-backed package attestation for trust and lineage, with no raw PII required on-chain.",
      ],
      actions: [
        { label: "Explore Trust Infrastructure", href: links.trust, kind: "primary" },
        { label: "See Sustainability Fit", href: links.sustainability },
      ],
      suggestions: [
        "How does blockchain fit Sustainability?",
        "Can Trust Infrastructure work outside Sustainability?",
        "Book a trust infrastructure assessment",
      ],
    };
  }

  function getTrustInSustainabilityResponse(links) {
    return {
      badge: "Cross-Offer Fit",
      title: "How Trust Infrastructure fits Sustainability",
      text: "Sustainability runs the program. Trust Infrastructure hardens the evidence behind it.",
      bullets: [
        "Sustainability handles campaigns, evidence collection, reporting workflows, and operational rollout.",
        "Trust Infrastructure adds verification controls, package lineage, audit traceability, and blockchain-backed attestation.",
        "Together they reduce greenwashing risk while keeping enterprise workflows practical.",
      ],
      actions: [
        { label: "Explore Sustainability", href: links.sustainability, kind: "primary" },
        { label: "Explore Trust Infrastructure", href: links.trust },
      ],
      suggestions: [
        "Show me the verification workflow",
        "How do I book an assessment?",
      ],
    };
  }

  function getComplianceResponse(links) {
    return {
      badge: "Supporting Module",
      title: "Compliance Automation",
      text: "Compliance Automation sits under the Sustainability offer and focuses on governed workflows, controls, and release readiness.",
      bullets: [
        "Submission rules, review queues, escalations, and approval flow control.",
        "Policy-safe defaults and deterministic checks to reduce setup or evidence errors.",
        "Useful when teams need auditability and operational discipline instead of spreadsheet coordination.",
      ],
      actions: [
        { label: "Explore Compliance Automation", href: links.compliance, kind: "primary" },
        { label: "Book Assessment", href: links.booking, external: true },
      ],
      suggestions: [
        "What is included in Data Assurance?",
        "How does verification work?",
      ],
    };
  }

  function getQaResponse(links) {
    return {
      badge: "Supporting Module",
      title: "Data Assurance",
      text: "Data Assurance is the quality-control layer for data reliability, validation rules, and defensible operational outputs.",
      bullets: [
        "Data checks, validation logic, and consistency controls before evidence or reports move forward.",
        "Useful where enterprise teams need cleaner operational data and fewer manual review surprises.",
        "Often paired with Sustainability and Trust Infrastructure for higher-confidence evidence handling.",
      ],
      actions: [
        { label: "Explore Data Assurance", href: links.qa, kind: "primary" },
        { label: "Explore Sustainability", href: links.sustainability },
      ],
      suggestions: [
        "How does Trust Infrastructure fit Sustainability?",
        "Book an assessment",
      ],
    };
  }

  function getCloudResponse(links) {
    return {
      badge: "Supporting Module",
      title: "Cloud Infrastructure",
      text: "Cloud Infrastructure supports data ingestion, sensor connectivity, secure processing, and platform scale for sustainability operations.",
      bullets: [
        "IoT and cloud patterns for monitoring and operational visibility.",
        "Useful when evidence or sustainability signals depend on distributed assets and connected systems.",
        "Works alongside Sustainability, Data Assurance, and Trust Infrastructure as the delivery backbone.",
      ],
      actions: [
        { label: "Explore Cloud Infrastructure", href: links.cloud, kind: "primary" },
        { label: "Book Assessment", href: links.booking, external: true },
      ],
      suggestions: [
        "Tell me more about Sustainability",
        "What do you offer?",
      ],
    };
  }

  function getSupplierResponse(links) {
    return {
      badge: "Supporting Module",
      title: "Supplier Engagement",
      text: "Supplier Engagement is the workflow layer for collecting, coordinating, and managing supplier-side inputs inside the Sustainability stack.",
      bullets: [
        "Useful when evidence, reporting, or compliance programs depend on external suppliers or partner submissions.",
        "Supports more structured data capture and follow-up than ad hoc email collection.",
        "Can be reinforced by Trust Infrastructure when evidence lineage and defensibility matter.",
      ],
      actions: [
        { label: "Explore Supplier Engagement", href: links.supplier, kind: "primary" },
        { label: "Explore Trust Infrastructure", href: links.trust },
      ],
      suggestions: [
        "How does Trust Infrastructure fit Sustainability?",
        "Book an assessment",
      ],
    };
  }

  function getCaseStudiesResponse(links) {
    return {
      badge: "Proof",
      title: "Where to find proof and examples",
      text: "The Case Studies section is the best starting point when a buyer wants evidence before a call.",
      bullets: [
        "Use it to understand how sustainability operations, AI services, and delivery outcomes are framed on the site.",
        "It helps anchor conversations with enterprise buyers who want evidence before committing time.",
        "If you want a more tailored example, the assessment call is still the faster route.",
      ],
      actions: [
        { label: "View Case Studies", href: links.cases, kind: "primary" },
        { label: "Book Assessment", href: links.booking, external: true },
      ],
      suggestions: [
        "What do you offer?",
        "Which service should I start with?",
      ],
    };
  }

  function getContactResponse(links) {
    return {
      badge: "Contact",
      title: "Direct contact options",
      text: "You can book directly, email the delivery team, or open the homepage contact section.",
      bullets: [
        "Booking is the fastest option if you already want a working session.",
        "Email works as the fallback path when no available slot fits.",
        "Phone and location details are shown in the contact section on the homepage.",
      ],
      actions: [
        { label: "Open Contact Section", href: links.contact, kind: "primary" },
        { label: "Email Delivery Team", href: links.email },
        { label: "Book Assessment", href: links.booking, external: true },
      ],
      suggestions: [
        "How do I book an assessment?",
        "What do you offer?",
      ],
    };
  }

  function getIdentityResponse(links) {
    return {
      badge: "TechFist Agent",
      title: "I am TechFist Agent",
      text: "I am the site assistant for TechFist Global. I can explain the offerings, compare them, answer common implementation questions, and route you to the assessment calendar when you are ready.",
      actions: [
        { label: "Book Assessment", href: links.booking, external: true, kind: "primary" },
        { label: "See All Offers", href: links.home },
      ],
      suggestions: [
        "What do you offer?",
        "Do you onboard AI agents and build multi-agent systems?",
      ],
    };
  }

  function getThanksResponse(links) {
    return {
      badge: "TechFist Agent",
      title: "Happy to help",
      text: "Ask me about service fit, implementation, verification, blockchain, or what happens during the assessment.",
      actions: [{ label: "Book Assessment", href: links.booking, external: true, kind: "primary" }],
      suggestions: [
        "Which service should I start with?",
        "What happens during the assessment?",
      ],
    };
  }

  function getAssessmentPrepResponse(links) {
    return {
      badge: "Assessment",
      title: "What happens during the assessment",
      text: "It is intended to be a working session, not a generic intro call.",
      bullets: [
        "Clarify whether the best fit is Agentic AI, Sustainability, Trust Infrastructure, or a combined rollout.",
        "Define pilot scope, integrations, governance controls, and who needs to approve what.",
        "Leave with a clearer next step such as a pilot, architecture sprint, or verification design phase.",
      ],
      actions: [
        { label: "Open Booking Calendar", href: links.booking, external: true, kind: "primary" },
        { label: "Email Delivery Team", href: links.email },
      ],
      suggestions: [
        "How long does implementation take?",
        "Do you onboard AI agents and build multi-agent systems?",
      ],
    };
  }

  function getImplementationResponse(links) {
    return {
      badge: "Implementation",
      title: "How implementation usually works",
      text: "Most engagements move in phases so the first release is controlled, measurable, and realistic for the enterprise team running it.",
      bullets: [
        "Phase 1: opportunity mapping, workflow selection, data and stakeholder review, and governance setup.",
        "Phase 2: pilot build with the core workflow, approvals, validation logic, and required integrations.",
        "Phase 3: rollout, observability, training, and expansion into adjacent workflows or evidence streams.",
      ],
      actions: [
        { label: "Book Assessment", href: links.booking, external: true, kind: "primary" },
        { label: "View Case Studies", href: links.cases },
      ],
      suggestions: [
        "How do integrations work?",
        "What governance controls do you use?",
      ],
    };
  }

  function getIntegrationResponse(links) {
    return {
      badge: "Integrations",
      title: "How integrations typically fit",
      text: "The service model assumes enterprise integration work, not standalone tools living in isolation.",
      bullets: [
        "Agentic AI often needs identity systems, ticketing, knowledge bases, CRM, or internal workflow tools.",
        "Sustainability often needs operational data, evidence submission workflows, supplier inputs, and reporting outputs.",
        "Trust Infrastructure often needs verification systems, submission packages, audit trails, and attestation or lineage controls.",
      ],
      actions: [
        { label: "Book Assessment", href: links.booking, external: true, kind: "primary" },
        { label: "Explore Trust Infrastructure", href: links.trust },
      ],
      suggestions: [
        "How long does implementation take?",
        "Do you build multi-agent systems?",
      ],
    };
  }

  function getGovernanceResponse(links) {
    return {
      badge: "Governance",
      title: "Governance and control model",
      text: "The offers are positioned around governed deployment, not automation without controls.",
      bullets: [
        "Human-in-the-loop review, approvals, and override reasons where business risk justifies them.",
        "Deterministic checks, reason codes, release gates, and SLA-aware review queues for evidence-heavy workflows.",
        "Auditability, observability, security boundaries, and fallback handling for production use.",
      ],
      actions: [
        { label: "Explore Agentic AI", href: links.agentic, kind: "primary" },
        { label: "Explore Trust Infrastructure", href: links.trust },
      ],
      suggestions: [
        "How does verification work?",
        "What is the difference between Sustainability and Trust Infrastructure?",
      ],
    };
  }

  function getIndustriesResponse(links) {
    return {
      badge: "Buyer Fit",
      title: "Where the offers fit best",
      text: "The positioning is enterprise-first and operations-first, not tied to a single narrow vertical.",
      bullets: [
        "Agentic AI fits support, IT, shared services, revenue operations, engineering, and internal workflow automation.",
        "Sustainability fits teams running emissions, evidence, verification, supplier, or reporting programs.",
        "Trust Infrastructure fits any industry where evidence must be verified, defended, traced, or attested across approvals and submissions.",
      ],
      actions: [
        { label: "View Case Studies", href: links.cases, kind: "primary" },
        { label: "Book Assessment", href: links.booking, external: true },
      ],
      suggestions: [
        "Which service should I start with?",
        "How does blockchain fit Sustainability?",
      ],
    };
  }

  function getDifferentiatorResponse(links) {
    return {
      badge: "Positioning",
      title: "What makes the offer set different",
      text: "The differentiation is not just AI or blockchain as standalone buzzwords. It is the combination of workflow execution, verification discipline, and defensible evidence design.",
      bullets: [
        "Agentic AI is framed as governed enterprise delivery, including onboarding and multi-agent orchestration.",
        "Sustainability is framed as an operating platform with concrete campaign and verification workflows.",
        "Trust Infrastructure gives the site a separate trust layer for evidence, blockchain-backed attestation, and audit traceability.",
      ],
      actions: [
        { label: "Explore All Offers", href: links.home, kind: "primary" },
        { label: "Book Assessment", href: links.booking, external: true },
      ],
      suggestions: [
        "Do you onboard AI agents and build multi-agent systems?",
        "How does Trust Infrastructure fit Sustainability?",
      ],
    };
  }

  function getConsultingResponse(links) {
    return {
      badge: "Consulting",
      title: "Consulting is part of the offer model",
      text: "Consulting is most credible here when it is tied to implementation readiness, rollout design, and governed execution.",
      bullets: [
        "AI onboarding and readiness workshops to identify the right workflows and guardrails.",
        "Multi-agent architecture and delivery planning for enterprise automation programs.",
        "Sustainability and trust design conversations around evidence policy, verification, reporting, and attestation.",
      ],
      actions: [
        { label: "Book Assessment", href: links.booking, external: true, kind: "primary" },
        { label: "Explore Agentic AI", href: links.agentic },
      ],
      suggestions: [
        "How long does implementation take?",
        "Which service should I start with?",
      ],
    };
  }

  function getVerificationResponse(links) {
    return {
      badge: "Verification",
      title: "How verification works",
      text: "Verification is treated as an operational layer, not just a final reviewer clicking approve.",
      bullets: [
        "Deterministic checks run before reviewer action and produce reason-coded outcomes.",
        "Managers or admins can review, request change, approve, or override with mandatory rationale where needed.",
        "High-risk items can be blocked by release gates until required verification tasks are closed.",
      ],
      actions: [
        { label: "Explore Sustainability", href: links.sustainability, kind: "primary" },
        { label: "Explore Trust Infrastructure", href: links.trust },
      ],
      suggestions: [
        "How does blockchain fit Sustainability?",
        "What governance controls do you use?",
      ],
    };
  }

  function getMultiAgentResponse(links) {
    return {
      badge: "Multi-Agent Delivery",
      title: "Yes, multi-agent systems are part of the Agentic AI offer",
      text: "The positioning is not just one chatbot. It is coordinated agents with roles, approvals, escalation paths, and system actions.",
      bullets: [
        "Useful where work crosses multiple steps, teams, or systems instead of a single prompt-response interaction.",
        "Can support service, IT, revenue, engineering, and back-office workflows.",
        "Works best when paired with governance, human oversight, and a clear rollout scope.",
      ],
      actions: [
        { label: "Explore Agentic AI", href: links.agentic, kind: "primary" },
        { label: "Book AI Assessment", href: links.booking, external: true },
      ],
      suggestions: [
        "How do you onboard AI agents?",
        "How does implementation usually work?",
      ],
    };
  }

  function getFallbackResponse(context, links) {
    var text = "I can help with Agentic AI, Sustainability, Trust Infrastructure, supporting modules, proof, or booking.";
    if (context && context.label) {
      text += " Since you are on the " + context.label + " page, I can also explain how this page fits the broader offer set.";
    }

    return {
      badge: "Quick Help",
      title: "Ask me a direct question",
      text: text,
      actions: [
        { label: "Book Assessment", href: links.booking, external: true, kind: "primary" },
        { label: "See All Offers", href: links.home },
      ],
      suggestions: getChatbotQuickPrompts(context),
    };
  }

  function buildChatbotResponse(query, context, links, state) {
    var prompt = normalizeText(query);
    var matches = [];
    var i;
    var entry;
    var score;

    if (!prompt) return withTopic("general", getWelcomeResponse(context, links));

    if (!state || !state.corpusReady) {
      return withTopic("general", {
        badge: "TechFist Agent",
        title: "Loading the knowledge base",
        text: "Try your question again in a second while I finish loading the answer corpus.",
      });
    }

    if (!state.corpus || !state.corpus.length) {
      return withTopic("general", {
        badge: "TechFist Agent",
        title: "The answer corpus is not available",
        text: "I could not load the JSON knowledge base on this page. You can still book an assessment or email the delivery team.",
        actions: [
          { label: "Book Assessment", href: links.booking, external: true, kind: "primary" },
          { label: "Email Delivery Team", href: links.email },
        ],
      });
    }

    for (i = 0; i < state.corpus.length; i++) {
      entry = state.corpus[i];
      score = scoreCorpusEntry(prompt, entry, context, state);
      matches.push({ entry: entry, score: score });
    }

    matches.sort(function (a, b) {
      return b.score - a.score;
    });

    if (matches.length && matches[0].score >= 0.34) {
      return buildCorpusResponse(matches[0].entry, links);
    }

    return buildCorpusFallbackResponse(matches, links, context);
  }

  function appendChatbotMessage(log, role, payload) {
    if (!log || !payload) return;

    var wrap = document.createElement("div");
    wrap.className = "tf-chatbot-message tf-chatbot-message-" + role;

    var bubble = document.createElement("div");
    bubble.className = "tf-chatbot-bubble";

    if (role === "assistant" && payload.badge) {
      var badge = document.createElement("div");
      badge.className = "tf-chatbot-badge";
      badge.textContent = payload.badge;
      bubble.appendChild(badge);
    }

    if (payload.title) {
      var title = document.createElement("h3");
      title.className = "tf-chatbot-title";
      title.textContent = payload.title;
      bubble.appendChild(title);
    }

    if (payload.text) {
      var text = document.createElement("p");
      text.className = "tf-chatbot-text";
      text.textContent = payload.text;
      bubble.appendChild(text);
    }

    if (payload.paragraphs && payload.paragraphs.length) {
      for (var p = 0; p < payload.paragraphs.length; p++) {
        var paragraph = document.createElement("p");
        paragraph.className = "tf-chatbot-text";
        paragraph.textContent = payload.paragraphs[p];
        bubble.appendChild(paragraph);
      }
    }

    if (payload.bullets && payload.bullets.length) {
      var list = document.createElement("ul");
      list.className = "tf-chatbot-list";
      for (var i = 0; i < payload.bullets.length; i++) {
        var item = document.createElement("li");
        item.textContent = payload.bullets[i];
        list.appendChild(item);
      }
      bubble.appendChild(list);
    }

    if (payload.actions && payload.actions.length) {
      var actions = document.createElement("div");
      actions.className = "tf-chatbot-actions";
      for (var a = 0; a < payload.actions.length; a++) actions.appendChild(createChatbotAction(payload.actions[a]));
      bubble.appendChild(actions);
    }

    wrap.appendChild(bubble);
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
  }

  function appendChatbotUserMessage(log, text) {
    appendChatbotMessage(log, "user", {
      title: text,
    });
  }

  function appendChatbotTyping(log) {
    var wrap = document.createElement("div");
    wrap.className = "tf-chatbot-message tf-chatbot-message-assistant tf-chatbot-message-typing";

    var bubble = document.createElement("div");
    bubble.className = "tf-chatbot-bubble tf-chatbot-typing";
    bubble.setAttribute("aria-hidden", "true");

    for (var i = 0; i < 3; i++) {
      var dot = document.createElement("span");
      dot.className = "tf-chatbot-typing-dot";
      bubble.appendChild(dot);
    }

    wrap.appendChild(bubble);
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
    return wrap;
  }

  function initChatbot() {
    if (!document.body) return;

    var links = getSiteLinks();
    var currentFile = getCurrentFile();
    var context = getChatbotContext(currentFile);
    var widget = document.createElement("div");

    widget.className = "tf-chatbot";
    widget.innerHTML =
      '<button type="button" class="tf-chatbot-launcher" aria-expanded="false" aria-controls="tf-chatbot-panel">' +
      '<span class="tf-chatbot-launcher-brand" aria-hidden="true"><img class="tf-chatbot-launcher-logo" src="' +
      links.logo +
      '" alt=""></span>' +
      '<span class="tf-chatbot-launcher-copy"><strong>TechFist Agent</strong><small>Conversational answers and booking</small></span>' +
      "</button>" +
      '<section class="tf-chatbot-panel" id="tf-chatbot-panel" hidden role="dialog" aria-labelledby="tf-chatbot-heading">' +
      '<div class="tf-chatbot-header">' +
      '<div class="tf-chatbot-eyebrow tf-chatbot-header-brand"><img class="tf-chatbot-header-logo" src="' +
      links.logo +
      '" alt=""><span>TechFist Agent</span></div>' +
      '<div class="tf-chatbot-header-row">' +
      '<div class="tf-chatbot-header-copy">' +
      '<h2 id="tf-chatbot-heading">Ask anything about the offerings</h2>' +
      '<p>Conversational answers for Agentic AI, Sustainability, Trust Infrastructure, implementation, and assessment booking.</p>' +
      "</div>" +
      '<div class="tf-chatbot-header-actions">' +
      '<a class="tf-chatbot-book" href="' +
      links.booking +
      '" target="_blank" rel="noopener noreferrer">Book</a>' +
      '<button type="button" class="tf-chatbot-close" aria-label="Close assistant">Close</button>' +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="tf-chatbot-log" data-chatbot-log role="log" aria-live="polite" aria-relevant="additions text"></div>' +
      '<form class="tf-chatbot-form" data-chatbot-form>' +
      '<input class="tf-chatbot-input" data-chatbot-input type="text" autocomplete="off" placeholder="Type your question about services, implementation, blockchain, or booking" aria-label="Ask TechFist a question">' +
      '<button class="tf-chatbot-send" type="submit">Send</button>' +
      "</form>" +
      "</section>";

    document.body.appendChild(widget);

    var launcher = widget.querySelector(".tf-chatbot-launcher");
    var panel = widget.querySelector(".tf-chatbot-panel");
    var closeBtn = widget.querySelector(".tf-chatbot-close");
    var log = widget.querySelector("[data-chatbot-log]");
    var form = widget.querySelector("[data-chatbot-form]");
    var input = widget.querySelector("[data-chatbot-input]");
    var restored = loadPersistedChatbotSession();
    var busy = false;
    var state = {
      lastTopic: restored && restored.lastTopic ? restored.lastTopic : context ? context.id : "general",
      corpus: [],
      corpusReady: false,
      resumeFocus: restored && restored.resumeFocus ? true : false,
      resumeScrollY: restored && typeof restored.resumeScrollY === "number" ? restored.resumeScrollY : null,
      history: restored && Array.isArray(restored.history) ? restored.history : [],
    };

    function persistChatbotState() {
      savePersistedChatbotSession({
        isOpen: widget.classList.contains("is-open"),
        lastTopic: state.lastTopic,
        page: currentFile || "index.html",
        resumeFocus: !!state.resumeFocus,
        resumeScrollY: typeof state.resumeScrollY === "number" ? state.resumeScrollY : null,
        history: state.history,
      });
    }

    function rememberChatbotMessage(role, payload) {
      state.history.push({
        role: role === "user" ? "user" : "assistant",
        payload: sanitizeChatbotPayload(payload),
      });

      if (state.history.length > 40) state.history = state.history.slice(-40);
      persistChatbotState();
    }

    function renderChatbotMessage(role, payload, options) {
      appendChatbotMessage(log, role, payload);
      if (!options || !options.skipStore) rememberChatbotMessage(role, payload);
    }

    loadChatbotCorpus(links.corpus).then(function (entries) {
      state.corpus = entries;
      state.corpusReady = true;
    });

    function setOpen(open, options) {
      widget.classList.toggle("is-open", !!open);
      panel.hidden = !open;
      launcher.setAttribute("aria-expanded", open ? "true" : "false");
      if (open && input && (!options || options.focus !== false)) focusChatbotInput(input, !!(options && options.preventScroll));
      persistChatbotState();
    }

    function submitQuery(text) {
      var value = String(text || "").trim();
      var typing;

      if (!value || busy) return;

      setOpen(true);
      renderChatbotMessage("user", { title: value, topic: state.lastTopic || "general" });
      busy = true;
      if (input) input.value = "";
      typing = appendChatbotTyping(log);

      window.setTimeout(function () {
        if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
        var response = buildChatbotResponse(value, context, links, state);
        if (response && response.topic) state.lastTopic = response.topic;
        renderChatbotMessage("assistant", response);
        busy = false;
      }, 320);
    }

    if (state.history.length) {
      for (var i = 0; i < state.history.length; i++) {
        appendChatbotMessage(log, state.history[i].role, state.history[i].payload);
      }
    } else {
      renderChatbotMessage("assistant", withTopic("general", getWelcomeResponse(context, links)));
    }

    if (restored && restored.page && restored.page !== (currentFile || "index.html") && context && context.label) {
      renderChatbotMessage(
        "assistant",
        withTopic(context.id, {
          badge: "Context updated",
          title: "Now viewing " + context.label,
          text: "I kept the conversation. Ask follow-up questions about this page or the broader offer set.",
        })
      );
    }

    setOpen(!!(restored && restored.isOpen), { focus: false });
    if (state.resumeFocus || typeof state.resumeScrollY === "number") {
      window.requestAnimationFrame(function () {
        if (typeof state.resumeScrollY === "number") window.scrollTo(0, Math.max(0, state.resumeScrollY));
        if (widget.classList.contains("is-open") && state.resumeFocus) focusChatbotInput(input, true);
        state.resumeFocus = false;
        state.resumeScrollY = null;
        persistChatbotState();
      });
    }

    launcher.addEventListener("click", function () {
      setOpen(!widget.classList.contains("is-open"));
    });

    closeBtn.addEventListener("click", function () {
      setOpen(false);
      launcher.focus();
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      submitQuery(input ? input.value : "");
    });
    log.addEventListener("click", function (event) {
      var action = event.target.closest(".tf-chatbot-action");
      var href;
      var targetMeta;

      if (!action) return;

      href = action.getAttribute("href") || "";
      if (!href || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0 || action.getAttribute("target") === "_blank") return;

      targetMeta = parseNavHref(href);
      if (!targetMeta || targetMeta.file === (currentFile || "index.html")) return;

      state.resumeFocus = true;
      state.resumeScrollY = window.scrollY || window.pageYOffset || 0;
      persistChatbotState();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && widget.classList.contains("is-open")) {
        setOpen(false);
        launcher.focus();
      }
    });

    window.addEventListener("pagehide", persistChatbotState);
  }

  function onReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  onReady(function () {
    setActiveNavLink();
    initNavInteractions();
    initReveals();
    initRoiCalculator();
    initAgentDemo();
    initChatbot();
  });
})();
