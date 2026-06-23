export const GOLD = "#f4af00";

export const SERVICES = {
  web: { label: "Custom Web Development", rate: 105, costRate: 58, hoursPerFeature: 13, icon: "◫" },
  mobile: { label: "Mobile App Development", rate: 125, costRate: 72, hoursPerFeature: 17, icon: "▣" },
  erp: { label: "ERP / Automation System", rate: 145, costRate: 88, hoursPerFeature: 22, icon: "◈" },
  ai: { label: "AI Integration", rate: 165, costRate: 102, hoursPerFeature: 20, icon: "✦" },
  marketing: { label: "AI Marketing Campaign", rate: 88, costRate: 48, hoursPerFeature: 9, icon: "◎" },
  saas: { label: "SaaS Product Development", rate: 135, costRate: 80, hoursPerFeature: 18, icon: "⬡" },
};

export const COMPLEXITIES = [
  { id: "simple", label: "Simple", factor: 0.9, risk: 1 },
  { id: "moderate", label: "Moderate", factor: 1.15, risk: 2 },
  { id: "complex", label: "Complex", factor: 1.55, risk: 3 },
  { id: "enterprise", label: "Enterprise", factor: 2.1, risk: 4 },
];

export const TIMELINES = [
  { id: "standard", label: "Standard · 8+ weeks", rush: 0, capacity: 1, risk: 1 },
  { id: "accelerated", label: "Accelerated · 4–8 weeks", rush: 0.1, capacity: 0.88, risk: 2 },
  { id: "rush", label: "Rush · 2–4 weeks", rush: 0.22, capacity: 0.72, risk: 3 },
  { id: "ultra", label: "Ultra rush · under 2 weeks", rush: 0.38, capacity: 0.58, risk: 4 },
];

export const SUPPORT_OPTIONS = [
  { id: "none", label: "No support", price: 0, cost: 0 },
  { id: "one", label: "1 month support", price: 300, cost: 130 },
  { id: "three", label: "3 months support", price: 780, cost: 330 },
  { id: "six", label: "6 months support", price: 1450, cost: 650 },
  { id: "twelve", label: "12 months support", price: 2600, cost: 1180 },
];

export const ADDONS = [
  { id: "seo", label: "SEO optimisation", price: 700, cost: 330, hours: 8, category: "Growth" },
  { id: "cms", label: "CMS integration", price: 950, cost: 480, hours: 12, category: "Build" },
  { id: "analytics", label: "Analytics dashboard", price: 650, cost: 300, hours: 7, category: "Growth" },
  { id: "auth", label: "Auth and user roles", price: 1050, cost: 560, hours: 13, category: "Build" },
  { id: "payments", label: "Payment gateway", price: 1250, cost: 670, hours: 15, category: "Build" },
  { id: "api", label: "Third-party API", price: 900, cost: 480, hours: 11, category: "Integration" },
  { id: "language", label: "Multi-language support", price: 840, cost: 400, hours: 9, category: "Experience" },
  { id: "chatbot", label: "AI chatbot", price: 1700, cost: 820, hours: 19, category: "AI" },
  { id: "training", label: "Team training session", price: 500, cost: 180, hours: 4, category: "Support" },
];

export const defaultForm = {
  quoteName: "",
  client: "",
  company: "",
  service: "web",
  complexity: "moderate",
  features: 8,
  teamSize: 2,
  timeline: "standard",
  support: "three",
  margin: 35,
  riskBuffer: 8,
  clientBudget: 8000,
  discount: 0,
  paymentTerms: "50% upfront · 30% midpoint · 20% launch",
  discovery: true,
  qualityAssurance: true,
  addOnIds: [],
  customAddOns: [],
  notes: "",
};

const findById = (items, id) => items.find((item) => item.id === id) || items[0];
const positive = (value) => Math.max(0, Number(value) || 0);

export function formatMoney(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

export function calculateQuote(form) {
  const service = SERVICES[form.service] || SERVICES.web;
  const complexity = findById(COMPLEXITIES, form.complexity);
  const timeline = findById(TIMELINES, form.timeline);
  const support = findById(SUPPORT_OPTIONS, form.support);
  const selectedAddOns = ADDONS.filter((item) => form.addOnIds.includes(item.id));
  const customAddOns = (form.customAddOns || []).filter((item) => item.label && positive(item.price) > 0).map((item) => ({ ...item, price: positive(item.price), cost: positive(item.cost), hours: positive(item.hours), custom: true }));
  const allAddOns = [...selectedAddOns, ...customAddOns];

  const features = Math.max(1, positive(form.features));
  const teamSize = Math.max(1, positive(form.teamSize));
  const targetMargin = Math.min(0.75, Math.max(0.1, positive(form.margin) / 100));
  const riskRate = Math.min(0.25, Math.max(0, positive(form.riskBuffer) / 100));
  const discountRate = Math.min(0.3, Math.max(0, positive(form.discount) / 100));

  const coreHours = features * service.hoursPerFeature * complexity.factor;
  const discoveryHours = form.discovery ? Math.max(8, coreHours * 0.1) : 0;
  const qaHours = form.qualityAssurance ? Math.max(6, coreHours * 0.13) : 0;
  const projectManagementHours = (coreHours + discoveryHours + qaHours) * (0.12 + (teamSize - 1) * 0.015);
  const addOnHours = allAddOns.reduce((sum, item) => sum + positive(item.hours), 0);
  const totalHours = coreHours + discoveryHours + qaHours + projectManagementHours + addOnHours;

  const laborCost = (coreHours + discoveryHours + qaHours + projectManagementHours) * service.costRate;
  const addOnCost = allAddOns.reduce((sum, item) => sum + positive(item.cost), 0);
  const coordinationCost = laborCost * Math.max(0, teamSize - 1) * 0.035;
  const rushFee = (coreHours + discoveryHours + qaHours) * service.rate * timeline.rush;
  const riskBufferAmount = (laborCost + addOnCost + support.cost + coordinationCost) * riskRate;
  const totalCost = laborCost + addOnCost + support.cost + coordinationCost + riskBufferAmount;

  const marketValue = (totalHours * service.rate) + allAddOns.reduce((sum, item) => sum + item.price, 0) + support.price + rushFee;
  const marginFloor = totalCost / (1 - Math.max(0.12, targetMargin - 0.12));
  const targetPrice = totalCost / (1 - targetMargin);
  const preDiscountPrice = Math.max(targetPrice, marketValue);
  const discountAmount = preDiscountPrice * discountRate;
  const recommendedPrice = Math.max(marginFloor, preDiscountPrice - discountAmount);
  const profit = recommendedPrice - totalCost;
  const actualMargin = recommendedPrice ? (profit / recommendedPrice) * 100 : 0;
  const budget = positive(form.clientBudget);
  const budgetFit = budget ? (budget / recommendedPrice) * 100 : 0;
  const expectedWeeks = Math.max(1, Math.ceil(totalHours / (teamSize * 28 * timeline.capacity)));
  const perMemberHours = totalHours / teamSize;

  const riskScore = Math.min(100, Math.round((complexity.risk * 16) + (timeline.risk * 11) + (teamSize === 1 ? 8 : 0) + (form.qualityAssurance ? 0 : 12) + (riskRate < 0.06 ? 10 : 0)));
  const riskBand = riskScore < 38 ? "Low" : riskScore < 65 ? "Moderate" : "High";

  let decision = { kind: "Review", title: "Set client budget", detail: "Add a client budget to receive a commercial recommendation." };
  if (budget) {
    if (budget >= recommendedPrice && actualMargin >= form.margin - 1) decision = { kind: "Accept", title: "Accept this opportunity", detail: "The client budget supports the recommended price and your target margin." };
    else if (budget >= marginFloor) decision = { kind: "Negotiate", title: "Negotiate scope or terms", detail: `The budget is ${Math.round(budgetFit)}% of the recommended price. Consider a phased rollout, reduced scope, or payment plan.` };
    else decision = { kind: "Decline", title: "Decline or re-scope", detail: `The budget is below your protected margin floor of ${formatMoney(marginFloor)}. Do not proceed without changing scope or budget.` };
  }

  const scenarios = [
    { name: "Starter", scope: "Essential outcome", featureFactor: 0.62, priceFactor: 0.78, includes: "Core build · limited add-ons · 1 review" },
    { name: "Professional", scope: "Recommended balance", featureFactor: 1, priceFactor: 1, includes: "Full scope · QA · support package" },
    { name: "Enterprise", scope: "Scale and resilience", featureFactor: 1.35, priceFactor: 1.38, includes: "Expanded scope · priority support · team training" },
  ].map((scenario) => {
    const price = recommendedPrice * scenario.priceFactor;
    const scenarioHours = totalHours * scenario.featureFactor;
    return { ...scenario, price, hours: scenarioHours, margin: Math.max(0, ((price - totalCost * scenario.featureFactor) / price) * 100) };
  });

  return {
    service, complexity, timeline, support, selectedAddOns: allAddOns,
    coreHours, discoveryHours, qaHours, projectManagementHours, addOnHours, totalHours,
    laborCost, addOnCost, coordinationCost, rushFee, riskBufferAmount, totalCost,
    marketValue, marginFloor, targetPrice, discountAmount, recommendedPrice, profit, actualMargin,
    budget, budgetFit, expectedWeeks, perMemberHours, riskScore, riskBand, decision, scenarios,
  };
}

export function quoteToText(form, quote) {
  const lines = [
    "ELITE ERA DEVELOPMENT L.L.C — SMART QUOTE",
    "Made by Hira Khyzer",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "--- CLIENT ---",
    `Client: ${form.client || "Not specified"}`,
    `Company: ${form.company || "Not specified"}`,
    `Quote: ${form.quoteName || "Untitled quote"}`,
    "",
    "--- SCOPE ---",
    `Service: ${quote.service.label}`,
    `Complexity: ${quote.complexity.label}`,
    `Features: ${form.features}`,
    `Team size: ${form.teamSize}`,
    `Timeline: ${quote.timeline.label}`,
    "",
    "--- COMMERCIAL SUMMARY ---",
    `Recommended price: ${formatMoney(quote.recommendedPrice)}`,
    `Delivery cost: ${formatMoney(quote.totalCost)}`,
    `Expected profit: ${formatMoney(quote.profit)}`,
    `Profit margin: ${quote.actualMargin.toFixed(1)}%`,
    `Margin floor: ${formatMoney(quote.marginFloor)}`,
    `Client budget: ${formatMoney(quote.budget)}`,
    `Budget fit: ${quote.budgetFit.toFixed(1)}%`,
    `Recommendation: ${quote.decision.kind}`,
    "",
    "--- DELIVERY ---",
    `Estimated work: ${Math.round(quote.totalHours)} hours`,
    `Estimated duration: ${quote.expectedWeeks} weeks`,
    `Risk: ${quote.riskBand} (${quote.riskScore}/100)`,
    "",
    "--- ADD-ONS ---",
    ...(quote.selectedAddOns.length ? quote.selectedAddOns.map((item) => `${item.label}: ${formatMoney(item.price)}`) : ["No add-ons selected"]),
    "",
    "--- NOTES ---",
    form.notes || "No notes added",
  ];
  return lines.join("\n") + "\n";
}

export function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
