import { Worker, Queue } from "bullmq";
import { getBullConnection } from "@/lib/queue/redis";
import { db } from "@/lib/db";
import { taskSla } from "@/lib/db/schema/sla";
import { eq } from "drizzle-orm";

const connection = getBullConnection();
export const slaQueue = new Queue("sla-monitoring", { connection });

export const slaWorker = new Worker(
  "sla-monitoring",
  async (job) => {
    const { taskSlaId } = job.data as { taskSlaId: string };
    const rows = await db.select().from(taskSla).where(eq(taskSla.id, taskSlaId));
    const currentSla = rows[0];
    if (!currentSla || currentSla.stage !== "in_progress") return;
    const now = new Date();
    if (currentSla.plannedEndTime && now >= new Date(currentSla.plannedEndTime as any)) {
      await db
        .update(taskSla)
        .set({ stage: "breached", hasBreached: true, percentageElapsed: "100.00" as any })
        .where(eq(taskSla.id, taskSlaId));
      console.log(`[SLA BREACH] taskSla ${taskSlaId} breached`);
    }
  },
  { connection }
);
