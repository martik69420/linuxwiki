const STORAGE_KEY = "linux_wiki_commands";

const defaultCommands = [
  {
    name: "ls",
    description: "Lists files and directories in the current or specified path.",
    syntax: "ls [options] [path]",
    examples: ["ls -lah", "ls /var/log", "ls -R"],
    commonErrors: ["Forgetting -h with -l", "Using ls without quotes for filenames with spaces"],
    tips: ["Use ls --color=auto for colored output", "Combine with grep to filter results: ls | grep 'pattern'"],
    related: ["cd", "pwd", "tree"],
    images: ["images/ls-output.png"]
  },
  {
    name: "cd",
    description: "Changes the current directory to the specified path.",
    syntax: "cd [directory]",
    examples: ["cd /home/user", "cd .."],
    commonErrors: ["Using cd without specifying directory", "Not handling spaces in directory names"],
    tips: ["Use cd ~ to go to home directory", "Use cd - to return to previous directory"],
    related: ["pwd", "ls"],
    images: []
  },
  {
    name: "pwd",
    description: "Prints the current working directory path.",
    syntax: "pwd",
    examples: ["pwd"],
    commonErrors: [],
    tips: [],
    related: ["cd", "ls"],
    images: []
  }
];

function loadCommands() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultCommands);
  try {
    return JSON.parse(saved);
  } catch {
    return structuredClone(defaultCommands);
  }
}

function saveCommands() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(commands));
}

const commands = loadCommands();

const list = document.getElementById("command-list");
const searchInput = document.querySelector("input");
const detailDiv = document.getElementById("command-detail");

function render(items, query = "") {
  list.innerHTML = "";
  items.forEach(cmd => {
    const li = document.createElement("li");
    li.style.cursor = "pointer";

    if (query) {
      const regex = new RegExp(`(${query})`, "gi");
      li.innerHTML =
        cmd.name.replace(regex, "<mark>$1</mark>") +
        " — " +
        cmd.description.replace(regex, "<mark>$1</mark>");
    } else {
      li.textContent = `${cmd.name} — ${cmd.description}`;
    }

    li.onclick = () => showDetails(cmd);
    list.appendChild(li);
  });
}

function showDetails(cmd) {
  detailDiv.innerHTML = `
    <div class="card" data-section="description">
      <h2>${cmd.name}</h2>
      <p class="editable">${cmd.description}</p>
    </div>

    <div class="card" data-section="syntax">
      <h3>Syntax</h3>
      <pre class="editable">${cmd.syntax}</pre>
    </div>

    <div class="card" data-section="examples">
      <h3>Examples / Use Cases</h3>
      ${cmd.examples.map(e => `<pre class="editable">${e}</pre>`).join("")}
    </div>

    <div class="card" data-section="commonErrors">
      <h3>Common Errors</h3>
      <ul class="editable">${cmd.commonErrors.map(e => `<li>${e}</li>`).join("")}</ul>
    </div>

    <div class="card" data-section="tips">
      <h3>Tips</h3>
      <ul class="editable">${cmd.tips.map(e => `<li>${e}</li>`).join("")}</ul>
    </div>

    <div class="card" data-section="related">
      <h3>Related Commands</h3>
      <p>${cmd.related.map(r => `<span class="related" data-name="${r}">${r}</span>`).join(", ")}</p>
    </div>

    <div class="card" data-section="images">
      <h3>Images</h3>
      ${cmd.images.length ? cmd.images.map(i => `<img src="${i}">`).join("") : "<p>None</p>"}
    </div>
  `;

  detailDiv.querySelectorAll(".related").forEach(span => {
    span.style.cursor = "pointer";
    span.onclick = () => {
      const relatedCmd = commands.find(c => c.name === span.dataset.name);
      if (relatedCmd) showDetails(relatedCmd);
    };
  });

  detailDiv.scrollTo({ top: 0, behavior: "smooth" });
  addSingleEditButton(cmd);
}

function addSingleEditButton(cmd) {
  const existing = document.getElementById("page-edit-btn");
  if (existing) existing.remove();

  const btn = document.createElement("button");
  btn.id = "page-edit-btn";
  btn.textContent = "Edit";
  document.body.appendChild(btn);

  let editing = false;

  btn.onclick = () => {
    editing = !editing;

    if (editing) {
      btn.textContent = "Save";
      detailDiv.querySelectorAll(".editable").forEach(el => {
        el.contentEditable = true;
        el.style.background = "#ffffe0";
      });
    } else {
      btn.textContent = "Edit";

      detailDiv.querySelectorAll(".card").forEach(card => {
        const section = card.dataset.section;
        if (!section) return;

        if (section === "examples") {
          cmd.examples = Array.from(card.querySelectorAll("pre")).map(e => e.innerText.trim());
        } else if (section === "commonErrors" || section === "tips") {
          cmd[section] = Array.from(card.querySelectorAll("li")).map(e => e.innerText.trim());
        } else if (section === "images") {
          cmd.images = Array.from(card.querySelectorAll("img")).map(img => img.src);
        } else {
          const el = card.querySelector(".editable");
          if (el) cmd[section] = el.innerText.trim();
        }
      });

      saveCommands();

      detailDiv.querySelectorAll(".editable").forEach(el => {
        el.contentEditable = false;
        el.style.background = "transparent";
      });

      render(commands);
    }
  };
}

searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  const filtered = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(q) ||
    cmd.description.toLowerCase().includes(q)
  );
  render(filtered, q);
});

render(commands);

