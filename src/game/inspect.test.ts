import { describe, it, expect } from "vitest";
import { inspectAt } from "./inspect";
import { structureAt, FLAT, type Seed } from "./world";
import { findSite } from "./world";

const NOW = Date.UTC(2026, 6, 1, 10);
