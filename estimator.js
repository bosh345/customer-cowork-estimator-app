const DEFAULTS = {
  knowledge: 1000,
  customer: 500,
  technical: 250,
  leaders: 100,
  lightCredits: 125,
  mediumCredits: 500,
  heavyCredits: 2500,
  promptsPerUser: 20,
  costPerThousand: 0.01,
  adoptionUplift: 0,
};

const SEGMENTS = [
  { key: "knowledge", label: "Knowledge Workers", band: "Light", creditsKey: "lightCredits" },
  { key: "customer", label: "Customer Facing Workers", band: "Medium", creditsKey: "mediumCredits" },
  { key: "technical", label: "Technical Workers", band: "Heavy", creditsKey: "heavyCredits" },
  { key: "leaders", label: "Managers & Leaders", band: "Medium", creditsKey: "mediumCredits" },
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
    lightCredits: inputValue("lightCredits"),
    mediumCredits: inputValue("mediumCredits"),
    heavyCredits: inputValue("heavyCredits"),
    promptsPerUser: inputValue("promptsPerUser"),
    costPerThousand: inputValue("costPerThousand"),
    adoptionUplift: inputValue("adoptionUplift"),
  };
}

function calculate() {
  const assumptions = getAssumptions();
  const upliftMultiplier = 1 + assumptions.adoptionUplift / 100;
  const segmentRows = SEGMENTS.map((segment) => {
    const users = assumptions[segment.key];
    const creditsPerPrompt = assumptions[segment.creditsKey];
    const monthlyCredits = users * assumptions.promptsPerUser * creditsPerPrompt * upliftMultiplier;
    const monthlyCost = (monthlyCredits / 1000) * assumptions.costPerThousand;

    return {
      ...segment,
      users,
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

  renderBreakdown(segmentRows);
  return { assumptions, totalUsers, monthlyCredits, monthlyCost, annualCost, costPerUser, creditsPerUser };
}

function renderBreakdown(rows) {
  const body = document.getElementById("breakdownBody");
  body.innerHTML = rows.map((row) => `
    <tr>
      <td>${row.label}</td>
      <td>${numberFormat.format(row.users)}</td>
      <td>${row.band}</td>
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
    `Prompts per user/month: ${estimate.assumptions.promptsPerUser}`,
    `Cost per 1,000 credits: ${decimalMoneyFormat.format(estimate.assumptions.costPerThousand)}`,
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
