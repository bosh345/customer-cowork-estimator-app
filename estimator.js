const DEFAULTS = {
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

function getAssumptions() {
  return {
    knowledge: inputValue("knowledge"),
    customer: inputValue("customer"),
    technical: inputValue("technical"),
    leaders: inputValue("leaders"),
    knowledgeLight: inputValue("knowledgeLight"),
    knowledgeMedium: inputValue("knowledgeMedium"),
    knowledgeHeavy: inputValue("knowledgeHeavy"),
    customerLight: inputValue("customerLight"),
    customerMedium: inputValue("customerMedium"),
    customerHeavy: inputValue("customerHeavy"),
    technicalLight: inputValue("technicalLight"),
    technicalMedium: inputValue("technicalMedium"),
    technicalHeavy: inputValue("technicalHeavy"),
    leadersLight: inputValue("leadersLight"),
    leadersMedium: inputValue("leadersMedium"),
    leadersHeavy: inputValue("leadersHeavy"),
    lightCredits: inputValue("lightCredits"),
    mediumCredits: inputValue("mediumCredits"),
    heavyCredits: inputValue("heavyCredits"),
    costPerCredit: inputValue("costPerCredit"),
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

  setText("totalUsers", numberFormat.format(totalUsers));
  setText("monthlyCredits", creditFormat.format(monthlyCredits));
  setText("monthlyCost", moneyFormat.format(monthlyCost));
  setText("annualCost", moneyFormat.format(annualCost));
  setText("costPerUser", decimalMoneyFormat.format(costPerUser));
  setText("creditsPerUser", creditFormat.format(creditsPerUser));
  segmentRows.forEach((row) => {
    setText(`${row.key}CreditsPerUser`, creditFormat.format(row.creditsPerUser));
  });

  renderBreakdown(segmentRows);
  return { assumptions, totalUsers, monthlyCredits, monthlyCost, annualCost, costPerUser, creditsPerUser };
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

async function copySummary() {
  const estimate = calculate();
  const summary = [
    "Copilot Cowork Estimator",
    `Total users: ${numberFormat.format(estimate.totalUsers)}`,
    `Monthly credits: ${creditFormat.format(estimate.monthlyCredits)}`,
    `Monthly cost: ${moneyFormat.format(estimate.monthlyCost)}`,
    `Annual cost: ${moneyFormat.format(estimate.annualCost)}`,
    `Cost per user/month: ${decimalMoneyFormat.format(estimate.costPerUser)}`,
    `Light/Medium/Heavy credits per prompt: ${estimate.assumptions.lightCredits}/${estimate.assumptions.mediumCredits}/${estimate.assumptions.heavyCredits}`,
    `Cost per Copilot Credit: ${decimalMoneyFormat.format(estimate.assumptions.costPerCredit)}`,
    "Assumption basis: Anthropic Opus 4.8; Microsoft Frontier customer usage as of 5/27/2026.",
    "Illustrative estimate only; validate final pricing before sharing externally.",
  ].join("\n");

  await navigator.clipboard.writeText(summary);
  const button = document.getElementById("copyButton");
  const originalText = button.textContent;
  button.textContent = "Copied";
  window.setTimeout(() => {
    button.textContent = originalText;
  }, 1600);
}

function resetAssumptions() {
  Object.entries(DEFAULTS).forEach(([id, value]) => {
    document.getElementById(id).value = value;
  });
  calculate();
}

document.getElementById("calculateButton").addEventListener("click", calculate);
document.getElementById("resetButton").addEventListener("click", resetAssumptions);
document.getElementById("copyButton").addEventListener("click", copySummary);
document.getElementById("estimatorForm").addEventListener("input", calculate);
document.getElementById("estimatorForm").addEventListener("submit", (event) => {
  event.preventDefault();
  calculate();
});

calculate();
