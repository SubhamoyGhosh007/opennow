import "./slaWorker";
import { Queue, Worker } from "bullmq";
import { getBullConnection } from "@/lib/queue/redis";
import { db } from "@/lib/db";
import { taskSla } from "@/lib/db/schema/sla";
import { eq, and, lte } from "drizzle-orm";

const connection = getBullConnection();

// 60s cron: update percentage_elapsed + breach overdue SLAs
const intervalSec = Number(process.env.SLA_CHECK_INTERVAL_SECONDS || 60);
let isRunning = false;

async function tick() {
  if (isRunning) return;
  isRunning = true;
  try {
    const rows = await db.select().from(taskSla).where(eq(taskSla.stage, "in_progress")).limit(500);
    const now = new Date().getTime();
    for (const sla of rows as any[]) {
      const start = new Date(sla.startTime).getTime();
      const end = new Date(sla.plannedEndTime).getTime();
      const total = Math.max(1, end - start - (sla.pauseDurationSeconds || 0) * 1000);
      const elapsed = Math.min(100, ((now - start - (sla.pauseDurationSeconds || 0) * 1000) / total) * 100);
      if (now >= end) {
        await db.update(taskSla).set({ stage: "breached", hasBreached: true, percentageElapsed: "100.00" as any }).where(eq(taskSla.id, sla.id));
        console.log(`[SLA BREACH cron] ${sla.id}`);
      } else {
        await db.update(taskSla).set({ percentageElapsed: elapsed.toFixed(2) as any }).where(eq(taskSla.id, sla.id));
      }
    }
  } catch (e) {
    console.error("SLA tick error", e);
  } finally {
    isRunning = false;
  }
}

console.log(`SLA worker started (interval ${intervalSec}s)`);
setInterval(tick, intervalSec * 1000);
tick();

