
const $ = id => document.getElementById(id);

const state = {
  questions: [],
  chart: null,
  quizDone: false
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  }[c]));
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");

  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 2800);
}

// NAVIGATION

$("menuButton").addEventListener("click", () => {
  $("navigation").classList.toggle("open");
});

document.querySelectorAll("#navigation a").forEach(link => {
  link.addEventListener("click", () => {
    $("navigation").classList.remove("open");
  });
});

// SCROLL ANIMATIONS

function setupAnimations() {
  if (!window.gsap) {
    document.querySelectorAll(".reveal").forEach(el => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  gsap.from(".hero-content > *", {
    opacity: 0,
    y: 30,
    duration: 0.9,
    stagger: 0.13,
    ease: "power3.out"
  });

  gsap.from(".earth-stage", {
    opacity: 0,
    scale: 0.85,
    duration: 1.3,
    ease: "power3.out"
  });

  gsap.utils.toArray(".reveal").forEach(element => {
    gsap.fromTo(element,
      { opacity: 0, y: 35 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          once: true
        }
      }
    );
  });

  gsap.to(".float-one", {
    y: -12,
    duration: 2.5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });

  gsap.to(".float-two", {
    y: 12,
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });

  gsap.utils.toArray(".stat-card").forEach((card, index) => {
    gsap.from(card, {
      opacity: 0,
      y: 25,
      duration: 0.6,
      delay: index * 0.08,
      scrollTrigger: {
        trigger: card,
        start: "top 90%",
        once: true
      }
    });
  });
}

// THREE.JS EARTH

function setupEarth() {
  const container = $("earthCanvas");

  if (!window.THREE || !container) {
    container.textContent = "🌍";
    container.style.fontSize = "120px";
    return;
  }

  const THREE = window.THREE;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );

  camera.position.z = 4.2;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const earthGroup = new THREE.Group();
  scene.add(earthGroup);

  const geometry = new THREE.SphereGeometry(1.2, 64, 64);

  const material = new THREE.MeshPhongMaterial({
    color: 0x3d824b,
    emissive: 0x102e19,
    shininess: 25,
    specular: 0x8ed66c
  });

  const earth = new THREE.Mesh(geometry, material);
  earthGroup.add(earth);

  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(1.205, 24, 16),
    new THREE.MeshBasicMaterial({
      color: 0x9ce66e,
      wireframe: true,
      transparent: true,
      opacity: 0.09
    })
  );

  earthGroup.add(wire);

  const light = new THREE.DirectionalLight(0xc4ff91, 2.2);
  light.position.set(3, 2, 4);
  scene.add(light);

  scene.add(new THREE.AmbientLight(0x789a7a, 1.3));

  const starGeometry = new THREE.BufferGeometry();
  const starPositions = [];

  for (let i = 0; i < 400; i++) {
    starPositions.push(
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 8
    );
  }

  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starPositions, 3)
  );

  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0xb8f36d,
      size: 0.012,
      transparent: true,
      opacity: 0.7
    })
  );

  scene.add(stars);

  let pointerX = 0;
  let pointerY = 0;

  container.addEventListener("pointermove", event => {
    const rect = container.getBoundingClientRect();

    pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.5;
    pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.3;
  });

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(container);
  } else {
    window.addEventListener("resize", resize);
  }

  function animate() {
    requestAnimationFrame(animate);

    earth.rotation.y += 0.0018;
    wire.rotation.y = earth.rotation.y;
    earthGroup.rotation.x += (pointerY - earthGroup.rotation.x) * 0.025;
    earthGroup.rotation.z += (pointerX - earthGroup.rotation.z) * 0.025;

    stars.rotation.y += 0.00015;

    renderer.render(scene, camera);
  }

  animate();
}

// DASHBOARD

async function loadDashboard() {
  try {
    const data = await api("/api/stats");

    $("statReports").textContent = data.reports;
    $("statQuizzes").textContent = data.quiz_attempts;
    $("statParticipants").textContent = data.participants;

    const chartLabels = data.categories.map(item => item.issue);
    const chartValues = data.categories.map(item => item.total);

    if (window.Chart) {
      if (state.chart) state.chart.destroy();

      state.chart = new Chart($("wasteChart"), {
        type: "doughnut",
        data: {
          labels: chartLabels.length ? chartLabels : ["No reports yet"],
          datasets: [{
            data: chartValues.length ? chartValues : [1],
            backgroundColor: chartValues.length
              ? ["#b8f36d", "#4d9770", "#9dca82", "#d2ad72", "#b67861", "#6a94aa"]
              : ["#263b2d"],
            borderColor: "#0d1e16",
            borderWidth: 5,
            hoverOffset: 8
          }]
        },
        options: {
          maintainAspectRatio: false,
          cutout: "70%",
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "#a5b7a7",
                boxWidth: 8,
                padding: 15,
                font: { size: 9 }
              }
            }
          }
        }
      });
    }
  } catch (error) {
    console.warn("Dashboard:", error.message);
  }
}

async function loadHealth() {
  try {
    const data = await api("/api/health");
    $("aiStatus").textContent =
      data.ai_mode === "hybrid"
        ? "Generative AI connected"
        : "Local knowledge engine";

    $("chatMode").textContent =
      data.ai_mode === "hybrid"
        ? "HYBRID AI CONNECTED"
        : "LOCAL AI READY";
  } catch {
    $("aiStatus").textContent = "Connection unavailable";
  }
}

// WASTE CLASSIFIER

async function classifyItem() {
  const item = $("wasteInput").value.trim();

  if (!item) {
    toast("Enter a waste item first.");
    return;
  }

  const result = $("classifyResult");
  result.classList.remove("hidden");
  result.innerHTML = "Analysing item...";

  try {
    const data = await api("/api/classify", {
      method: "POST",
      body: JSON.stringify({ item })
    });

    result.innerHTML = `
      <span class="eyebrow">CLASSIFICATION RESULT</span>
      <h3>${escapeHTML(data.category)}</h3>
      <b>${escapeHTML(data.bin)}</b>
      <p>${escapeHTML(data.advice)}</p>
      <small>${data.matched ? "Item matched in knowledge database." : "No exact database match."}</small>
    `;
  } catch (error) {
    result.textContent = error.message;
  }
}

$("classifyButton").addEventListener("click", classifyItem);

$("wasteInput").addEventListener("keydown", event => {
  if (event.key === "Enter") classifyItem();
});

document.querySelectorAll("[data-item]").forEach(button => {
  button.addEventListener("click", () => {
    $("wasteInput").value = button.dataset.item;
    classifyItem();
  });
});

// ECO AI CHAT

function addMessage(text, type, mode = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "message " +
    (type === "user" ? "user-message" : "bot-message");

  const avatar = document.createElement("span");
  avatar.className = "message-avatar";
  avatar.textContent = type === "user" ? "●" : "✳";

  const content = document.createElement("div");
  const heading = document.createElement("b");
  heading.textContent = type === "user" ? "YOU" : "ECO AI";

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  content.append(heading, paragraph);

  if (mode) {
    const small = document.createElement("small");
    small.textContent = mode;
    small.style.color = "#9bb78a";
    content.appendChild(small);
  }

  wrapper.append(avatar, content);
  $("chatMessages").appendChild(wrapper);

  $("chatMessages").scrollTop = $("chatMessages").scrollHeight;

  return wrapper;
}

async function askAI(message) {
  addMessage(message, "user");

  const waiting = addMessage("Thinking about your question...", "bot");
  $("chatInput").disabled = true;

  try {
    const data = await api("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message })
    });

    waiting.querySelector("p").textContent = data.answer;
    waiting.querySelector("small")?.remove();

    const mode = document.createElement("small");
    mode.textContent = data.mode || "ECO AI";
    mode.style.color = "#9bb78a";
    waiting.querySelector("div").appendChild(mode);

  } catch (error) {
    waiting.querySelector("p").textContent =
      "I couldn't connect just now. Please try again.";

    toast(error.message);
  } finally {
    $("chatInput").disabled = false;
    $("chatInput").focus();
    $("chatMessages").scrollTop = $("chatMessages").scrollHeight;
  }
}

$("chatForm").addEventListener("submit", event => {
  event.preventDefault();

  const input = $("chatInput");
  const message = input.value.trim();

  if (!message) return;

  input.value = "";
  askAI(message);
});

document.querySelectorAll("[data-prompt]").forEach(button => {
  button.addEventListener("click", () => {
    askAI(button.dataset.prompt);
  });
});

// CHALLENGES

async function loadChallenges() {
  try {
    const data = await api("/api/challenges");

    $("challengeGrid").innerHTML = data.challenges.map(challenge => `
      <article class="challenge-card">
        <div class="challenge-icon">${escapeHTML(challenge.icon)}</div>
        <h3>${escapeHTML(challenge.title)}</h3>
        <p>${escapeHTML(challenge.description)}</p>
        <div class="challenge-points">✦ ${challenge.points} POTENTIAL ECO POINTS</div>
      </article>
    `).join("");
  } catch {
    $("challengeGrid").textContent = "Challenges unavailable.";
  }
}

// QUIZ

async function loadQuiz() {
  try {
    const data = await api("/api/quiz");
    state.questions = data.questions;

    $("quizQuestions").innerHTML = state.questions.map((q, i) => `
      <div class="quiz-question">
        <h3>${i + 1}. ${escapeHTML(q.question)}</h3>
        <div class="quiz-options">
          ${q.options.map((option, j) => `
            <label>
              <input type="radio" name="question${i}" value="${j}">
              ${escapeHTML(option)}
            </label>
          `).join("")}
        </div>
      </div>
    `).join("");
  } catch {
    $("quizQuestions").textContent = "Quiz unavailable.";
  }
}

$("submitQuiz").addEventListener("click", async () => {
  if (state.quizDone) return;

  const answers = state.questions.map((q, i) => {
    const selected = document.querySelector(
      `input[name="question${i}"]:checked`
    );
    return selected ? Number(selected.value) : null;
  });

  if (answers.length !== 5 || answers.some(value => value === null)) {
    toast("Please answer all questions.");
    return;
  }

  const username = $("quizName").value.trim() || "Eco Explorer";

  try {
    const result = await api("/api/quiz/submit", {
      method: "POST",
      body: JSON.stringify({ answers, username })
    });

    state.quizDone = true;

    $("quizResult").classList.remove("hidden");
    $("quizResult").innerHTML = `
      <b>YOUR SCORE: ${result.score}/${result.total}</b><br>
      <b>POINTS EARNED: ${result.points}</b>
      <p>${result.score === 5
        ? "Excellent! You are an eco champion."
        : "Good effort! Keep learning and improving."}</p>
      <ul>${result.explanations.map(text =>
        `<li>${escapeHTML(text)}</li>`
      ).join("")}</ul>
    `;

    $("submitQuiz").disabled = true;
    $("submitQuiz").textContent = "QUIZ COMPLETED ✓";

    await loadDashboard();
    await loadLeaderboard();

  } catch (error) {
    toast(error.message);
  }
});

// COMMUNITY REPORTING

$("reportForm").addEventListener("submit", async event => {
  event.preventDefault();

  const message = $("reportMessage");
  message.textContent = "Submitting...";

  const payload = {
    name: $("reportName").value,
    location: $("reportLocation").value,
    issue: $("reportIssue").value,
    description: $("reportDescription").value
  };

  try {
    const result = await api("/api/reports", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    message.textContent = result.message;
    event.target.reset();

    toast("Report successfully submitted.");

    await loadDashboard();

  } catch (error) {
    message.textContent = error.message;
  }
});

// LEADERBOARD

async function loadLeaderboard() {
  try {
    const data = await api("/api/leaderboard");

    if (!data.leaders.length) {
      $("leaderboardRows").innerHTML =
        '<div class="leader-empty">Be the first to complete the eco quiz.</div>';
      return;
    }

    $("leaderboardRows").innerHTML = data.leaders.map((leader, index) => `
      <div class="leader-row">
        <b>${String(index + 1).padStart(2, "0")}</b>
        <span>${escapeHTML(leader.username)}</span>
        <span>${leader.attempts}</span>
        <b>${leader.points} ✦</b>
      </div>
    `).join("");
  } catch {
    $("leaderboardRows").textContent = "Leaderboard unavailable.";
  }
}

// LANGUAGE SUPPORT

const translations = {
  en: {
    home: "Home",
    intelligence: "Intelligence",
    classifier: "Waste AI",
    learn: "Learn",
    community: "Community"
  },
  hi: {
    home: "होम",
    intelligence: "डैशबोर्ड",
    classifier: "वेस्ट AI",
    learn: "सीखें",
    community: "समुदाय"
  },
  as: {
    home: "গৃহ",
    intelligence: "ডেশ্বব'ৰ্ড",
    classifier: "আৱৰ্জনা AI",
    learn: "শিকক",
    community: "সমাজ"
  }
};

$("languageSelect").addEventListener("change", event => {
  const language = translations[event.target.value];

  document.querySelectorAll("[data-i18n]").forEach(element => {
    const key = element.dataset.i18n;
    if (language[key]) element.textContent = language[key];
  });
});

// STARTUP

async function startApp() {
  setupEarth();
  setupAnimations();

  await Promise.all([
    loadDashboard(),
    loadHealth(),
    loadQuiz(),
    loadChallenges(),
    loadLeaderboard()
  ]);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
