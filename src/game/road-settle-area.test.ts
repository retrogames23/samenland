// The road-settle suite once more, with the equal-area coastal shape (villages founded from COAST_AREA_SINCE):
// the staggered settling must hold in the new geometry exactly as in the legacy one. Own file = own worker, so no
// geometry cache is shared with road-settle.test.ts.
process.env["COAST_SHAPE"] = "area";
await import("./road-settle.test");
export {};
