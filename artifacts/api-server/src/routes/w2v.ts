import { Router, type IRouter } from "express";
import {
  AnalyzeEnergyBody,
  CreateRecoveryListingBody,
  CreateRegistrationBody,
  DecideApplicationBody,
  GeneratePlanBody,
  GetDashboardQueryParams,
  GetImpactQueryParams,
  VerifyRegistrationBody,
} from "@workspace/api-zod";
import { db, w2vRecordsTable } from "@workspace/db";

const router: IRouter = Router();

type Application = {
  id: number;
  organizationName: string;
  representative: string;
  contact: string;
  location: string;
  authorityType: string;
  status: string;
  submittedAt: string;
  proofId: string;
};

const applications: Application[] = [
  {
    id: 101,
    organizationName: "Sahyadri Community Kitchen",
    representative: "Meera Joshi",
    contact: "meera@sahyadri.org",
    location: "Nagpur, Maharashtra",
    authorityType: "kitchen",
    status: "pending",
    submittedAt: "Today, 09:42",
    proofId: "MH-KIT-4821",
  },
  {
    id: 102,
    organizationName: "HarvestLoop Foods",
    representative: "Arjun Rao",
    contact: "arjun@harvestloop.in",
    location: "Wardha, Maharashtra",
    authorityType: "fpu",
    status: "pending",
    submittedAt: "Yesterday, 16:18",
    proofId: "FSSAI-21908",
  },
];

const listings = [
  {
    id: 1,
    material: "Prepared dal",
    quantity: 18,
    category: "Ready food",
    condition: "Fresh · same day",
    location: "Sadar, Nagpur",
    availability: "Available until 8:30 PM",
    matchCount: 4,
  },
  {
    id: 2,
    material: "Vegetable trimmings",
    quantity: 46,
    category: "Organic material",
    condition: "Clean & sorted",
    location: "Hingna, Nagpur",
    availability: "Pickup tomorrow",
    matchCount: 2,
  },
  {
    id: 3,
    material: "Multigrain bread",
    quantity: 12,
    category: "Bakery",
    condition: "Best before today",
    location: "Civil Lines, Nagpur",
    availability: "Available until 6:00 PM",
    matchCount: 3,
  },
];

const storageReadings = [
  { room: "Cold room A", item: "Paneer", quantity: 48, temperature: 3.8, humidity: 62, timestamp: "2 min ago", status: "Within range", limit: 5 },
  { room: "Cold room B", item: "Leafy greens", quantity: 32, temperature: 7.4, humidity: 74, timestamp: "4 min ago", status: "Check temperature", limit: 6 },
  { room: "Dry store", item: "Rice flour", quantity: 120, temperature: 22.1, humidity: 48, timestamp: "5 min ago", status: "Within range", limit: 28 },
];

const machineReadings = [
  { machine: "Filler line 01", status: "Running", power: 74, energy: 18.4, runtime: 412, downtime: 12, output: 1840, events: ["Routine calibration complete"] },
  { machine: "Sealer line 02", status: "Attention", power: 91, energy: 26.7, runtime: 286, downtime: 38, output: 1260, events: ["Abnormal downtime detected", "Temperature variance at 14:20"] },
  { machine: "Mixer 03", status: "Running", power: 62, energy: 11.8, runtime: 505, downtime: 6, output: 2310, events: ["Motor health nominal"] },
];

router.post("/registrations", async (req, res) => {
  const input = CreateRegistrationBody.parse(req.body);
  const id = Math.floor(Date.now() / 1000);
  await db.insert(w2vRecordsTable).values({
    type: "registration",
    status: "otp_pending",
    organizationName: input.organizationName,
    authorityType: input.authorityType,
    payload: input,
  });
  res.status(201).json({
    id,
    organizationName: input.organizationName,
    authorityType: input.authorityType,
    status: "otp_pending",
    message: "OTP sent to your registered contact.",
  });
});

router.post("/registrations/:id/verify", async (req, res) => {
  const input = VerifyRegistrationBody.parse(req.body);
  const id = Number(req.params.id);
  const status = input.otp === "246810" || input.otp === "123456" ? "pending_admin_verification" : "otp_invalid";
  res.json({
    id,
    organizationName: "Your W2V organization",
    authorityType: "kitchen",
    status,
    message: status === "otp_invalid" ? "That OTP could not be verified." : "Your account is pending admin verification.",
  });
});

router.get("/applications", (_req, res) => res.json(applications));

router.post("/applications/:id/decision", async (req, res) => {
  const input = DecideApplicationBody.parse(req.body);
  const application = applications.find((item) => item.id === Number(req.params.id));
  if (!application) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  application.status = input.decision === "approve" ? "approved" : input.decision === "reject" ? "rejected" : "more_info";
  await db.insert(w2vRecordsTable).values({
    type: "verification_decision",
    status: application.status,
    organizationName: application.organizationName,
    authorityType: application.authorityType,
    payload: { ...input, applicationId: application.id },
  });
  res.json(application);
});

router.get("/dashboard", (req, res) => {
  const query = GetDashboardQueryParams.parse(req.query);
  const isFpu = query.role === "fpu";
  const isAdmin = query.role === "admin";
  res.json({
    organizationName: isAdmin ? "W2V operations" : query.organization || (isFpu ? "HarvestLoop Foods" : "Sahyadri Community Kitchen"),
    role: query.role,
    status: isAdmin ? "Live operations" : "Verified organization",
    points: isFpu ? 184 : 246,
    leaderboard: isFpu ? 8 : 4,
    stats: isAdmin
      ? [
          { label: "Pending reviews", value: applications.filter((item) => item.status === "pending").length, unit: "applications", trend: 12 },
          { label: "Active recovery", value: listings.length, unit: "listings", trend: 8 },
          { label: "Food redirected", value: 842, unit: "kg", trend: 19 },
          { label: "CO2e avoided", value: 1.24, unit: "t", trend: 14 },
        ]
      : [
          { label: isFpu ? "Production saved" : "Food rescued", value: isFpu ? 312 : 184, unit: "kg", trend: 16 },
          { label: "Waste prevented", value: isFpu ? 68 : 42, unit: "kg", trend: 11 },
          { label: "CO2e avoided", value: isFpu ? 0.86 : 0.54, unit: "t", trend: 18 },
          { label: "Impact points", value: isFpu ? 184 : 246, unit: "points", trend: 9 },
        ],
    activities: [
      { title: "Recovery pickup completed", detail: "Prepared dal · 18 kg redirected to Asha Shelter", time: "24 min ago", kind: "recovery" },
      { title: isFpu ? "Storage alert acknowledged" : "Smart plan confirmed", detail: isFpu ? "Leafy greens moved to Cold room A" : "Lunch plan updated for 320 servings", time: "2 hr ago", kind: "plan" },
      { title: "Impact points earned", detail: "Your team earned 18 new points", time: "Yesterday", kind: "impact" },
    ],
  });
});

router.post("/planning", async (req, res) => {
  const input = GeneratePlanBody.parse(req.body);
  const requested = input.quantity ?? 0;
  const stock = input.currentStock ?? 0;
  const orders = input.confirmedOrders ?? 0;
  const baseDemand = Math.max(requested, orders, Math.round(requested * 0.82 + (input.product.length * 3)));
  const safetyBuffer = Math.max(4, Math.round(baseDemand * 0.08));
  const requiredProduction = Math.max(0, baseDemand + safetyBuffer - stock);
  const recommended = Math.max(0, requiredProduction);
  await db.insert(w2vRecordsTable).values({
    type: "plan",
    status: "saved",
    organizationName: input.product,
    authorityType: input.mode,
    payload: { ...input, baseDemand, safetyBuffer, recommended },
  });
  res.json({
    product: input.product,
    expectedDemand: baseDemand,
    requiredProduction,
    safetyBuffer,
    recommended,
    explanation: `Based on ${input.product} demand signals, ${input.meal || "the selected service"} timing, and ${stock} units currently available, the plan keeps a ${safetyBuffer}-unit buffer without overproducing.`,
    history: [
      { label: "Avg demand", value: Math.max(0, baseDemand - 9), unit: "units", trend: 8 },
      { label: "Recent demand", value: baseDemand, unit: "units", trend: 14 },
      { label: "Current stock", value: stock, unit: "units", trend: 0 },
      { label: "Confirmed orders", value: orders, unit: "units", trend: 5 },
    ],
  });
});

router.post("/energy", async (req, res) => {
  const input = AnalyzeEnergyBody.parse(req.body);
  const sourceFactor = input.source === "LPG" ? 0.84 : input.source === "Other" ? 0.92 : 0.68;
  const estimatedEnergy = Math.round(input.quantity * sourceFactor * 10) / 10;
  const savings = Math.round(estimatedEnergy * 0.18 * 10) / 10;
  res.json({
    method: input.equipment.toLowerCase().includes("pressure") ? "Batch pressure cooking" : "Staged batch cooking",
    equipment: input.equipment,
    estimatedEnergy,
    savings,
    co2Reduction: Math.round(savings * 0.41 * 100) / 100,
  });
});

router.post("/inventory/calculate", (req, res) => {
  const quantity = Number(req.body.quantity || 1);
  const product = String(req.body.product || "selected recipe");
  const multiplier = Math.max(1, product.length % 4);
  res.json([
    { ingredient: "Primary grain", required: quantity * 0.12 * multiplier, available: quantity * 0.09, shortage: quantity * 0.03, surplus: 0 },
    { ingredient: "Seasonal vegetables", required: quantity * 0.18, available: quantity * 0.22, shortage: 0, surplus: quantity * 0.04 },
    { ingredient: "Cooking oil", required: quantity * 0.015, available: quantity * 0.018, shortage: 0, surplus: quantity * 0.003 },
  ]);
});

router.get("/recovery", (_req, res) => res.json(listings));

router.post("/recovery", async (req, res) => {
  const input = CreateRecoveryListingBody.parse(req.body);
  const listing = { id: listings.length + 1, ...input, availability: "New listing · matching now", matchCount: input.category === "Ready food" ? 4 : 2 };
  listings.unshift(listing);
  await db.insert(w2vRecordsTable).values({
    type: "recovery_listing",
    status: "active",
    organizationName: input.location,
    authorityType: "recovery",
    payload: input,
  });
  res.status(201).json(listing);
});

router.get("/monitoring/storage", (_req, res) => res.json(storageReadings));
router.get("/monitoring/machines", (_req, res) => res.json(machineReadings));

router.get("/impact", (req, res) => {
  const query = GetImpactQueryParams.parse(req.query);
  const scale = query.range === "today" ? 0.18 : query.range === "year" ? 5.4 : 1;
  res.json({
    foodRescued: Math.round(184 * scale),
    foodDonated: Math.round(126 * scale),
    deliveries: Math.max(1, Math.round(12 * scale)),
    wastePrevented: Math.round(68 * scale),
    energySaved: Math.round(126 * scale),
    co2Avoided: Math.round(0.54 * scale * 100) / 100,
    points: Math.round(246 * scale),
    leaderboard: 4,
    series: [
      { label: "Week 1", value: Math.round(42 * scale) },
      { label: "Week 2", value: Math.round(58 * scale) },
      { label: "Week 3", value: Math.round(64 * scale) },
      { label: "Week 4", value: Math.round(82 * scale) },
    ],
  });
});

export default router;