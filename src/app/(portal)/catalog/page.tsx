"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PortalShell } from "@/components/deck/portal-shell";
import { SuccessCheck } from "@/components/motion/micro";
import { useToast } from "@/components/motion/toast";
import { RevealText } from "@/components/motion/micro";

const schema = z.object({
  short_description: z.string().min(4, "Give the issue a few more words."),
  description: z.string().optional(),
  urgency: z.coerce.number().min(1).max(3),
  impact: z.coerce.number().min(1).max(3),
  category: z.string().default("inquiry"),
});

export default function CatalogPage() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const [ticket, setTicket] = React.useState("");
  const [failed, setFailed] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const toast = useToast();

  return (
    <PortalShell title="Request catalog">
      <RevealText
        lines={[
          <strong key="a" className="font-display text-2xl font-bold text-slate-900">Report an issue</strong>,
          <span key="b" className="mt-1 text-sm text-slate-500">Urgency × impact sets priority automatically.</span>,
        ]}
      />
      <form
        className="mt-5 space-y-3"
        onSubmit={handleSubmit(
          async (v: any) => {
            try {
              const r = await fetch("/api/now/table/incident", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(v),
              });
              const j = await r.json();
              if (r.ok) {
                setTicket(j.result.number);
                toast({ title: `Filed as ${j.result.number}`, body: `Priority P${j.result.priority}` });
                reset();
                setFailed(false);
              } else {
                setFailed(true);
                toast({ title: "Submission rejected", body: j.error || "Please check the form" });
                const wrap = wrapRef.current;
                const box = boxRef.current;
                wrap?.classList.add("is-error");
                box?.classList.add("is-error");
                box?.classList.remove("is-shaking");
                void box?.offsetWidth;
                box?.classList.add("is-shaking");
              }
            } catch (e: any) {
              setFailed(true);
              toast({ title: "Network error", body: e.message || "Failed to reach server" });
              const wrap = wrapRef.current;
              const box = boxRef.current;
              wrap?.classList.add("is-error");
              box?.classList.add("is-error");
              box?.classList.remove("is-shaking");
              void box?.offsetWidth;
              box?.classList.add("is-shaking");
            }
          },
          () => {
            setFailed(true);
            const wrap = wrapRef.current;
            const box = boxRef.current;
            wrap?.classList.add("is-error");
            box?.classList.add("is-error");
            box?.classList.remove("is-shaking");
            void box?.offsetWidth;
            box?.classList.add("is-shaking");
          }
        )}
      >
        <div ref={wrapRef} className="t-input-wrap">
          <div ref={boxRef} className="t-input rounded-lg border border-transparent">
            <input
              {...register("short_description")}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--signal))]"
              placeholder="Short description"
            />
          </div>
          <p className="t-error-msg mt-1 text-xs text-rose-600">
            {failed ? errors.short_description?.message?.toString() || "Could not file — check the form." : ""}
          </p>
        </div>
        <textarea
          {...register("description")}
          className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--signal))]"
          rows={4}
          placeholder="Describe the issue"
        />
        <div className="grid grid-cols-3 gap-2">
          <select {...register("urgency")} className="rounded-lg border border-slate-300 bg-white p-2 text-sm" aria-label="Urgency">
            <option value="1">High urgency</option>
            <option value="2">Medium urgency</option>
            <option value="3">Low urgency</option>
          </select>
          <select {...register("impact")} className="rounded-lg border border-slate-300 bg-white p-2 text-sm" aria-label="Impact">
            <option value="1">High impact</option>
            <option value="2">Medium impact</option>
            <option value="3">Low impact</option>
          </select>
          <select {...register("category")} className="rounded-lg border border-slate-300 bg-white p-2 text-sm" aria-label="Category">
            <option value="software">Software</option>
            <option value="hardware">Hardware</option>
            <option value="network">Network</option>
            <option value="inquiry">Inquiry</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-10 flex-1 rounded-lg bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-slate-700">
            File request
          </button>
          <SuccessCheck show={!!ticket} className="text-emerald-600" />
        </div>
        {ticket && (
          <p className="font-ticket text-sm text-slate-600">
            Last filed · <span className="font-bold text-slate-900">{ticket}</span>
          </p>
        )}
      </form>
    </PortalShell>
  );
}
