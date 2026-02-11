const STORAGE_KEY = "linux_wiki_commands";

const defaultCommands = [
  {
    name: "ls",
    category: undefined,
    description: "Lists files and directories in the current or specified path.",
    syntax: "ls [options] [path]",
    examples: ["ls -lah", "ls /var/log", "ls -R"],
    commonErrors: ["Forgetting -h with -l", "Using ls without quotes for filenames with spaces"],
    tips: ["Use ls --color=auto for colored output", "Combine with grep: ls | grep pattern"],
    related: ["cd", "pwd"],
    images: []
  },
  {
    name: "cd",
    category: "Filesystem",
    description: "Changes the current directory.",
    syntax: "cd [directory]",
    examples: ["cd /home/user", "cd ..", "cd ~"],
    commonErrors: ["Not quoting paths with spaces"],
    tips: ["cd - returns to previous directory"],
    related: ["pwd", "ls"],
    images: []
  },
  {
    name: "pwd",
    category: "Filesystem",
    description: "Prints the current working directory.",
    syntax: "pwd",
    examples: ["pwd"],
    commonErrors: [],
    tips: [],
    related: ["cd", "ls"],
    images: []
  }
];

let commands = loadCommands();
let activeCategory = "All";
let currentCommand = null;
let editing = false;

const list = document.getElementById("command-list");
const searchInput = document.getElementById("search-input");
const detailDiv = document.getElementById("command-detail");
const categoryList = document.getElementById("category-list");
const editBtn = document.getElementById("page-edit-btn");
const resetBtn = document.getElementById("page-reset-btn");
const addBtn = document.getElementById("command-add-btn");
const modal = document.getElementById("add-article-modal");
const modalSave = document.getElementById("modal-save-btn");
const modalCancel = document.getElementById("modal-cancel-btn");

editBtn.style.display = "none";
resetBtn.style.display = "none";

function loadCommands() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultCommands);
  try { return JSON.parse(saved); }
  catch { return structuredClone(defaultCommands); }
}

function saveCommands() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(commands));
}

function renderCategories() {
  const categories = ["All", ...new Set(commands.map(c => c.category || "Uncategorized").filter(Boolean))];
  categoryList.innerHTML = "";
  categories.forEach(cat => {
    const li = document.createElement("li");
    li.textContent = cat;
    li.style.cursor = "pointer";
    if (cat === activeCategory) li.style.fontWeight = "bold";
    li.onclick = () => {
      activeCategory = cat;
      renderCategories();
      renderFiltered();
    };
    categoryList.appendChild(li);
  });
}

function renderFiltered() {
  const q = searchInput.value.toLowerCase();
  const filtered = commands.filter(cmd => {
    const matchesSearch = cmd.name.toLowerCase().includes(q) || cmd.description.toLowerCase().includes(q);
    const cmdCategory = cmd.category || "Uncategorized";
    const matchesCategory = activeCategory === "All" || cmdCategory === activeCategory;
    return matchesSearch && matchesCategory;
  });
  render(filtered, q);
}

function render(items, query = "") {
  list.innerHTML = "";
  items.forEach(cmd => {
    const li = document.createElement("li");
    li.style.cursor = "pointer";
    if (query) {
      const regex = new RegExp(`(${query})`, "gi");
      li.innerHTML = cmd.name.replace(regex, "<mark>$1</mark>") + " — " + cmd.description.replace(regex, "<mark>$1</mark>");
    } else {
      li.textContent = `${cmd.name} — ${cmd.description}`;
    }
    li.onclick = () => showDetails(cmd);
    list.appendChild(li);
  });
}

function showDetails(cmd) {
  currentCommand = cmd;
  editing = false;

  editBtn.style.display = "inline-block";
  editBtn.textContent = "Edit";
  resetBtn.style.display = "none";

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
      <h3>Examples</h3>
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
      <h3>Related</h3>
      <p>${cmd.related.map(r => `<span class="related" data-name="${r}">${r}</span>`).join(", ")}</p>
    </div>
  `;

  detailDiv.querySelectorAll(".related").forEach(span => {
    span.style.cursor = "pointer";
    span.onclick = () => {
      const relatedCmd = commands.find(c => c.name === span.dataset.name);
      if (relatedCmd) showDetails(relatedCmd);
    };
  });

  detailDiv.scrollTop = 0;
}

editBtn.onclick = () => {
  if (!currentCommand) return;
  editing = !editing;

  if (editing) {
    editBtn.textContent = "Save";
    resetBtn.style.display = "inline-block";
    detailDiv.querySelectorAll(".editable").forEach(el => { el.contentEditable = true; el.style.background = "#ffffe0"; });
  } else {
    editBtn.textContent = "Edit";

    detailDiv.querySelectorAll(".card").forEach(card => {
      const section = card.dataset.section;
      if (!section) return;
      if (section === "examples") currentCommand.examples = [...card.querySelectorAll("pre")].map(e=>e.innerText.trim());
      else if (section === "commonErrors" || section === "tips") currentCommand[section] = [...card.querySelectorAll("li")].map(e=>e.innerText.trim());
      else {
        const el = card.querySelector(".editable");
        if(el) currentCommand[section] = el.innerText.trim();
      }
    });

    saveCommands();
    renderFiltered();
    detailDiv.querySelectorAll(".editable").forEach(el=>{el.contentEditable=false; el.style.background="transparent";});
    resetBtn.style.display = "none";
  }
};

resetBtn.onclick = () => {
  if(!currentCommand) return;
  const original = defaultCommands.find(c=>c.name===currentCommand.name);
  if(!original) return;
  Object.keys(original).forEach(k=>currentCommand[k]=structuredClone(original[k]));
  saveCommands();
  showDetails(currentCommand);
  renderFiltered();
};

addBtn.onclick = () => modal.style.display = "block";
modalCancel.onclick = () => modal.style.display = "none";
modalSave.onclick = () => {
  const name = document.getElementById("new-name").value.trim();
  if(!name) return alert("Name cannot be empty!");
  const category = document.getElementById("new-category").value.trim() || "Misc";
  const description = document.getElementById("new-description").value.trim() || "";
  const syntax = document.getElementById("new-syntax").value.trim() || "";
  const examples = document.getElementById("new-examples").value.split(",").map(e=>e.trim()).filter(Boolean);
  const tips = document.getElementById("new-tips").value.split(",").map(e=>e.trim()).filter(Boolean);
  const errors = document.getElementById("new-errors").value.split(",").map(e=>e.trim()).filter(Boolean);
  const related = document.getElementById("new-related").value.split(",").map(e=>e.trim()).filter(Boolean);

  const newCmd = {name, category, description, syntax, examples, tips, commonErrors:errors, related, images:[]};
  commands.push(newCmd);
  saveCommands();
  renderCategories();
  renderFiltered();
  showDetails(newCmd);

  modal.style.display = "none";
  document.querySelectorAll("#add-article-modal input,#add-article-modal textarea").forEach(el=>el.value="");
};

window.onclick = (e) => { if(e.target===modal) modal.style.display="none"; };

searchInput.addEventListener("input", renderFiltered);

renderCategories();
renderFiltered();
