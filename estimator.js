const DEFAULTS = {
  model: "opus",
  knowledge: 200,
  customer: 100,
  technical: 10,
  leaders: 40,
  knowledgeLight: 0,
  knowledgeMedium: 0,
  knowledgeHeavy: 0,
  customerLight: 0,
  customerMedium: 0,
  customerHeavy: 0,
  technicalLight: 0,
  technicalMedium: 0,
  technicalHeavy: 0,
  leadersLight: 0,
  leadersMedium: 0,
  leadersHeavy: 0,
  lightCredits: 125,
  mediumCredits: 500,
  heavyCredits: 1200,
  costPerCredit: 0.01,
  targetBudget: 0,
  hoursSavedPerUser: 0,
  hourlyValue: 75,
};

const MODEL_CREDIT_DEFAULTS = {
  sonnet: {
    lightCredits: 90,
    mediumCredits: 300,
    heavyCredits: 700,
  },
  gpt55: {
    lightCredits: 110,
    mediumCredits: 425,
    heavyCredits: 950,
  },
  opus: {
    lightCredits: 125,
    mediumCredits: 500,
    heavyCredits: 1200,
  },
};

const FIELD_IDS = Object.keys(DEFAULTS).filter((id) => id !== "model");
const PROMPT_FIELD_IDS = [
  "knowledgeLight",
  "knowledgeMedium",
  "knowledgeHeavy",
  "customerLight",
  "customerMedium",
  "customerHeavy",
  "technicalLight",
  "technicalMedium",
  "technicalHeavy",
  "leadersLight",
  "leadersMedium",
  "leadersHeavy",
];
let activePreset = null;
let activeModel = DEFAULTS.model;

const PRESETS = {
  conservative: {
    knowledgeLight: 8,
    knowledgeMedium: 1,
    knowledgeHeavy: 0,
    customerLight: 6,
    customerMedium: 1,
    customerHeavy: 0,
    technicalLight: 4,
    technicalMedium: 1,
    technicalHeavy: 0,
    leadersLight: 4,
    leadersMedium: 1,
    leadersHeavy: 0,
  },
  expected: {
    knowledgeLight: 16,
    knowledgeMedium: 3,
    knowledgeHeavy: 0,
    customerLight: 12,
    customerMedium: 4,
    customerHeavy: 1,
    technicalLight: 8,
    technicalMedium: 4,
    technicalHeavy: 2,
    leadersLight: 8,
    leadersMedium: 3,
    leadersHeavy: 1,
  },
  high: {
    knowledgeLight: 28,
    knowledgeMedium: 8,
    knowledgeHeavy: 1,
    customerLight: 20,
    customerMedium: 8,
    customerHeavy: 2,
    technicalLight: 12,
    technicalMedium: 8,
    technicalHeavy: 5,
    leadersLight: 14,
    leadersMedium: 8,
    leadersHeavy: 2,
  },
};

const SEGMENTS = [
  { key: "knowledge", label: "Corporate Knowledge Workers" },
  { key: "customer", label: "Customer-Facing Knowledge Workers" },
  { key: "technical", label: "Technical Workers" },
  { key: "leaders", label: "Managers & Senior Leaders" },
];

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const creditFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const decimalMoneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function inputValue(id) {
  const value = Number(document.getElementById(id).value);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function setField(id, value) {
  const field = document.getElementById(id);
  if (field) {
    field.value = value;
  }
}

function getAssumptions() {
  return {
    model: activeModel,
    ...Object.fromEntries(FIELD_IDS.map((id) => [id, inputValue(id)])),
  };
}

function calculate() {
  const assumptions = getAssumptions();
  const segmentRows = SEGMENTS.map((segment) => {
    const users = assumptions[segment.key];
    const lightPrompts = assumptions[`${segment.key}Light`];
    const mediumPrompts = assumptions[`${segment.key}Medium`];
    const heavyPrompts = assumptions[`${segment.key}Heavy`];
    const creditsPerUser =
      (lightPrompts * assumptions.lightCredits) +
      (mediumPrompts * assumptions.mediumCredits) +
      (heavyPrompts * assumptions.heavyCredits);
    const monthlyCredits = users * creditsPerUser;
    const monthlyCost = monthlyCredits * assumptions.costPerCredit;

    return {
      ...segment,
      users,
      lightPrompts,
      mediumPrompts,
      heavyPrompts,
      creditsPerUser,
      monthlyCredits,
      monthlyCost,
    };
  });

  const totalUsers = segmentRows.reduce((sum, row) => sum + row.users, 0);
  const monthlyCredits = segmentRows.reduce((sum, row) => sum + row.monthlyCredits, 0);
  const monthlyCost = segmentRows.reduce((sum, row) => sum + row.monthlyCost, 0);
  const annualCost = monthlyCost * 12;
  const costPerUser = totalUsers ? monthlyCost / totalUsers : 0;
  const creditsPerUser = totalUsers ? monthlyCredits / totalUsers : 0;
  const monthlyValue = totalUsers * assumptions.hoursSavedPerUser * assumptions.hourlyValue;
  const netMonthlyValue = monthlyValue - monthlyCost;

  const budget = getBudgetStatus(monthlyCost, assumptions.targetBudget);

  setText("totalUsers", numberFormat.format(totalUsers));
  setText("monthlyCredits", creditFormat.format(monthlyCredits));
  setText("monthlyCost", moneyFormat.format(monthlyCost));
  setText("annualCost", moneyFormat.format(annualCost));
  setText("costPerUser", decimalMoneyFormat.format(costPerUser));
  setText("creditsPerUser", creditFormat.format(creditsPerUser));
  setText("budgetStatus", budget.label);
  setText("monthlyValue", moneyFormat.format(monthlyValue));
  setText("netMonthlyValue", moneyFormat.format(netMonthlyValue));
  segmentRows.forEach((row) => {
    setText(`${row.key}CreditsPerUser`, creditFormat.format(row.creditsPerUser));
  });

  renderBreakdown(segmentRows);
  renderBudgetGuidance(budget, monthlyCost, assumptions.targetBudget);
  return {
    assumptions,
    segmentRows,
    totalUsers,
    monthlyCredits,
    monthlyCost,
    annualCost,
    costPerUser,
    creditsPerUser,
    monthlyValue,
    netMonthlyValue,
    budget,
  };
}

function getBudgetStatus(monthlyCost, targetBudget) {
  if (!targetBudget) {
    return { label: "Not set", className: "neutral", message: "Enter a target monthly budget to see whether this scenario is under, near, or over budget." };
  }

  const ratio = monthlyCost / targetBudget;
  const variance = targetBudget - monthlyCost;
  if (ratio <= 0.9) {
    return { label: "Under budget", className: "under", variance, message: `This scenario is ${moneyFormat.format(Math.abs(variance))} under the target monthly budget.` };
  }
  if (ratio <= 1.1) {
    return { label: "Near budget", className: "near", variance, message: `This scenario is within 10% of the target monthly budget (${moneyFormat.format(Math.abs(variance))} ${variance >= 0 ? "under" : "over"}).` };
  }
  return { label: "Over budget", className: "over", variance, message: `This scenario is ${moneyFormat.format(Math.abs(variance))} over the target monthly budget. Reduce prompt volume, shift heavy work to medium, or review the model mix.` };
}

function renderBudgetGuidance(budget, monthlyCost, targetBudget) {
  const panel = document.getElementById("budgetGuidance");
  panel.className = `guidance-panel ${budget.className}`;
  const budgetLine = targetBudget ? ` Target: ${moneyFormat.format(targetBudget)}. Estimate: ${moneyFormat.format(monthlyCost)}.` : "";
  panel.textContent = `${budget.message}${budgetLine}`;
}

function renderBreakdown(rows) {
  const body = document.getElementById("breakdownBody");
  body.innerHTML = rows.map((row) => `
    <tr>
      <td>${row.label}</td>
      <td>${numberFormat.format(row.users)}</td>
      <td>${numberFormat.format(row.lightPrompts)} / ${numberFormat.format(row.mediumPrompts)} / ${numberFormat.format(row.heavyPrompts)}</td>
      <td>${creditFormat.format(row.creditsPerUser)}</td>
      <td>${creditFormat.format(row.monthlyCredits)}</td>
      <td>${moneyFormat.format(row.monthlyCost)}</td>
    </tr>
  `).join("");
}

function buildSummaryText() {
  const estimate = calculate();
  const lines = [
    "Copilot Cowork Estimator",
    "",
    "Model selection",
    `Selected model: ${getModelLabel(estimate.assumptions.model)}`,
    `Light/Medium/Heavy credits per prompt: ${estimate.assumptions.lightCredits}/${estimate.assumptions.mediumCredits}/${estimate.assumptions.heavyCredits}`,
    "",
    "Usage and cost",
    `Total users: ${numberFormat.format(estimate.totalUsers)}`,
    `Monthly credits: ${creditFormat.format(estimate.monthlyCredits)}`,
    `Monthly cost: ${moneyFormat.format(estimate.monthlyCost)}`,
    `Annual cost: ${moneyFormat.format(estimate.annualCost)}`,
    "",
    "Per-user view",
    `Cost per user/month: ${decimalMoneyFormat.format(estimate.costPerUser)}`,
    `Average credits per user/month: ${creditFormat.format(estimate.creditsPerUser)}`,
    "",
    "Budget and value",
    `Budget status: ${estimate.budget.label}`,
    `Monthly value estimate: ${moneyFormat.format(estimate.monthlyValue)}`,
    `Net monthly value: ${moneyFormat.format(estimate.netMonthlyValue)}`,
    "",
    "Segment breakdown:",
    ...estimate.segmentRows.map((row) =>
      `- ${row.label}: ${numberFormat.format(row.users)} users; ${numberFormat.format(row.lightPrompts)} / ${numberFormat.format(row.mediumPrompts)} / ${numberFormat.format(row.heavyPrompts)} light/medium/heavy prompts; ${creditFormat.format(row.monthlyCredits)} monthly credits; ${moneyFormat.format(row.monthlyCost)} monthly cost.`
    ),
    "",
    `Cost per Copilot Credit: ${decimalMoneyFormat.format(estimate.assumptions.costPerCredit)}`,
    "Assumption basis: Microsoft Frontier customer usage as of 27/5/2026.",
    "Illustrative estimate only; validate final pricing before sharing externally.",
  ];
  return lines.join("\n");
}

async function copySummary() {
  await navigator.clipboard.writeText(buildSummaryText());
  flashButton("copyButton", "Copied");
}

function downloadSummary() {
  const blob = new Blob([buildSummaryText()], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "copilot-cowork-estimate-summary.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function printSummary() {
  const summary = buildSummaryText()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\n", "<br>");
  const popup = window.open("", "_blank", "noopener,noreferrer");
  if (!popup) {
    window.print();
    return;
  }
  popup.document.write(`
    <html>
      <head>
        <title>Copilot Cowork Estimate Summary</title>
        <style>
          body { font-family: "Segoe UI", Aptos, Calibri, sans-serif; margin: 32px; line-height: 1.45; }
          h1 { margin-top: 0; }
          .summary { white-space: normal; }
        </style>
      </head>
      <body>
        <h1>Copilot Cowork Estimate Summary</h1>
        <div class="summary">${summary}</div>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}

async function copyScenarioLink() {
  const params = new URLSearchParams();
  if (activeModel !== DEFAULTS.model) {
    params.set("model", activeModel);
  }
  FIELD_IDS.forEach((id) => {
    const value = document.getElementById(id).value;
    if (value !== String(DEFAULTS[id])) {
      params.set(id, value);
    }
  });
  const url = `${window.location.origin}${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
  await navigator.clipboard.writeText(url);
  flashButton("shareScenarioButton", "Link copied");
}

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) {
    return;
  }
  if (activePreset === name) {
    PROMPT_FIELD_IDS.forEach((id) => setField(id, DEFAULTS[id]));
    activePreset = null;
    updatePresetHighlight();
    calculate();
    return;
  }
  Object.entries(preset).forEach(([id, value]) => setField(id, value));
  activePreset = name;
  updatePresetHighlight();
  calculate();
}

function resetAssumptions() {
  activeModel = DEFAULTS.model;
  Object.entries(DEFAULTS).forEach(([id, value]) => setField(id, value));
  activePreset = null;
  updatePresetHighlight();
  updateModelHighlight();
  calculate();
}

function applyModel(model) {
  const defaults = MODEL_CREDIT_DEFAULTS[model];
  if (!defaults) {
    return;
  }
  activeModel = model;
  Object.entries(defaults).forEach(([id, value]) => setField(id, value));
  updateModelHighlight();
  calculate();
}

function getModelLabel(model) {
  if (model === "sonnet") {
    return "Sonnet 4.6";
  }
  if (model === "gpt55") {
    return "GPT-5.5";
  }
  return "Opus 4.8";
}

function updateModelHighlight() {
  document.querySelectorAll("[data-model]").forEach((button) => {
    const isActive = button.dataset.model === activeModel;
    button.classList.toggle("selected", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function presetMatchesCurrentValues(name) {
  const preset = PRESETS[name];
  if (!preset) {
    return false;
  }
  return Object.entries(preset).every(([id, value]) => inputValue(id) === value);
}

function clearPresetIfPromptChanged(changedId) {
  if (!activePreset || !PROMPT_FIELD_IDS.includes(changedId)) {
    return;
  }
  if (!presetMatchesCurrentValues(activePreset)) {
    activePreset = null;
    updatePresetHighlight();
  }
}

function updatePresetHighlight() {
  document.querySelectorAll("[data-preset]").forEach((button) => {
    const isActive = button.dataset.preset === activePreset;
    button.classList.toggle("selected", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function flashButton(id, text) {
  const button = document.getElementById(id);
  const originalText = button.textContent;
  button.textContent = text;
  window.setTimeout(() => {
    button.textContent = originalText;
  }, 1600);
}

function applyQueryParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("model") && MODEL_CREDIT_DEFAULTS[params.get("model")]) {
    activeModel = params.get("model");
    Object.entries(MODEL_CREDIT_DEFAULTS[activeModel]).forEach(([id, value]) => setField(id, value));
  }
  FIELD_IDS.forEach((id) => {
    if (params.has(id)) {
      setField(id, params.get(id));
    }
  });
}

document.getElementById("calculateButton").addEventListener("click", calculate);
document.getElementById("resetButton").addEventListener("click", resetAssumptions);
document.getElementById("copyButton").addEventListener("click", copySummary);
document.getElementById("downloadSummaryButton").addEventListener("click", downloadSummary);
document.getElementById("printSummaryButton").addEventListener("click", printSummary);
document.getElementById("shareScenarioButton").addEventListener("click", copyScenarioLink);
document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => applyPreset(button.dataset.preset));
});
document.querySelectorAll("[data-model]").forEach((button) => {
  button.addEventListener("click", () => applyModel(button.dataset.model));
});
document.getElementById("estimatorForm").addEventListener("input", (event) => {
  clearPresetIfPromptChanged(event.target.id);
  calculate();
});
document.getElementById("estimatorForm").addEventListener("submit", (event) => {
  event.preventDefault();
  calculate();
});

applyQueryParams();
updateModelHighlight();
updatePresetHighlight();
calculate();
