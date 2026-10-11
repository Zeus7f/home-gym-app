import { motion } from "motion/react";
import { GYM, SESSIONS, STATUS, fa } from "./data.js";

export const Card = ({ className = "", children, ...p }) => (
  <section {...p} className={`rounded-2xl bg-white border border-[#dfe6ec] ${className}`}>{children}</section>
);

export const H = ({ children, sub, action }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="min-w-0">
      <h2 className="text-[17px] font-bold text-[#041d2c]">{children}</h2>
      {sub && <div className="text-[14px] text-[#5d7181] mt-0.5">{sub}</div>}
    </div>
    {action}
  </div>
);

export const Pill = ({ s }) => (
  <span className={`inline-flex items-center whitespace-nowrap px-2.5 h-7 rounded-md text-[14px] font-medium ${STATUS[s].cls}`}>{STATUS[s].l}</span>
);

export const Btn = ({ v = "primary", className = "", children, ...p }) => {
  const k = {
    primary: "bg-[#06314e] text-white hover:bg-[#041d2c]",
    ghost: "border border-[#c9d6e0] text-[#06314e] bg-white hover:border-[#06314e]",
    brass: "bg-[#d1b252] text-black hover:bg-[#c7a744]",
    danger: "bg-[#c4472c] text-white hover:bg-[#a8381f]",
    soft: "bg-[#eef2f5] text-[#06314e] hover:bg-[#e3ebf1]",
  }[v];
  return <button {...p} className={`h-10 px-4 rounded-lg text-[14px] font-semibold inline-flex items-center justify-center gap-2 transition whitespace-nowrap ${k} ${className}`}>{children}</button>;
};

export const Avatar = ({ name, size = 40, tone = "mist" }) => {
  const t = tone === "ink" ? "bg-[#06314e] text-white" : tone === "brass" ? "bg-[#d1b252] text-[#041d2c]" : "bg-[#e3ecf3] text-[#06314e]";
  return <span style={{ width: size, height: size, fontSize: size * 0.4 }} className={`shrink-0 rounded-full grid place-items-center font-bold ${t}`}>{name.split(" ")[0][0]}</span>;
};

export const Chips = ({ items, value, onChange }) => (
  <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
    {items.map(([k, l]) => (
      <button key={k} onClick={() => onChange(k)} className={`h-9 px-3.5 rounded-full text-[14px] whitespace-nowrap transition border ${value === k ? "bg-[#06314e] text-white border-[#06314e] font-semibold" : "bg-white text-[#3d4f5c] border-[#d8e1e8]"}`}>{l}</button>
    ))}
  </div>
);

export const Seg = ({ items, value, onChange, full }) => (
  <div className={`flex p-1 rounded-lg bg-[#eef2f5] ${full ? "w-full" : ""}`}>
    {items.map(([k, l]) => (
      <button key={k} onClick={() => onChange(k)} className={`${full ? "flex-1" : ""} px-3 h-8 rounded-md text-[14px] whitespace-nowrap transition ${value === k ? "bg-white text-[#041d2c] font-semibold shadow-sm" : "text-[#5d7181]"}`}>{l}</button>
    ))}
  </div>
);

/* Package meter: one tick per session in the package. */
export const Meter = ({ total, used, h = 8 }) => {
  const l = total - used;
  const low = l <= 2;
  return (
    <div className="flex gap-[2px]" aria-label={`${l} از ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{ height: h }} className={`flex-1 rounded-[2px] ${i >= l ? "bg-[#dfe6ec]" : low ? "bg-[#c4472c]" : "bg-[#06314e]"}`} />
      ))}
    </div>
  );
};

/* ---------- Today's capacity: stacked bar + hour-by-hour floor ---------- */
const ORDER = ["done", "live", "wait", "noshow"];
const SEGC = { done: "#06314e", live: "#d1b252", wait: "#8fb0c8", noshow: "#c4472c" };
const SEGL = { done: "تکمیل", live: "داخل سالن", wait: "در راه", noshow: "غیبت" };

export function Capacity({ compact = false }) {
  const occ = SESSIONS.filter((s) => s.s !== "cancel");
  const counts = Object.fromEntries(ORDER.map((k) => [k, occ.filter((s) => s.s === k).length]));
  const free = GYM.capacity - occ.length;
  const hours = Array.from({ length: 15 }, (_, i) => 8 + i);
  const pct = Math.round((occ.length / GYM.capacity) * 100);

  return (
    <Card className={compact ? "p-4" : "p-6"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[14px] text-[#5d7181]">ظرفیت امروز باشگاه</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`font-display leading-[0.9] text-[#06314e] tnum ${compact ? "text-[52px]" : "text-[68px]"}`}>{fa(occ.length)}</span>
            <span className={`font-display text-[#6b7d8a] ${compact ? "text-[24px]" : "text-[30px]"}`}>/ {fa(GYM.capacity)} نفر</span>
          </div>
        </div>
        <div className="text-left">
          <div className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-[#eaf3ec] text-[#22603a] text-[14px] font-semibold">
            <span className="h-2 w-2 rounded-full bg-[#2f8a52]" /> {fa(free)} جای خالی
          </div>
          <div className="text-[14px] text-[#5d7181] mt-2">{fa(pct)}٪ پر شده</div>
        </div>
      </div>

      {/* stacked bar */}
      <div className={`${compact ? "mt-4 h-4" : "mt-5 h-5"} flex rounded-full overflow-hidden bg-[repeating-linear-gradient(135deg,#eef2f5_0_6px,#e3e9ee_6px_12px)]`}>
        {ORDER.map((k, i) => (
          <motion.div key={k} initial={{ width: 0 }} animate={{ width: `${(counts[k] / GYM.capacity) * 100}%` }} transition={{ delay: 0.1 + i * 0.12, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ background: SEGC[k] }} className={`h-full ${k === "live" ? "live-pulse" : ""} ${i ? "border-r-2 border-white" : ""}`} />
        ))}
      </div>
      <div className={`mt-3 grid ${compact ? "grid-cols-2 gap-y-2" : "grid-cols-5"} gap-x-3`}>
        {ORDER.map((k) => (
          <Leg key={k} c={SEGC[k]} n={counts[k]} l={SEGL[k]} />
        ))}
        {!compact && <Leg c="free" n={free} l="خالی" />}
      </div>

      {/* hour by hour */}
      <div className={`${compact ? "mt-5" : "mt-6"} pt-4 border-t border-[#eef2f5]`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[14px] font-semibold text-[#041d2c]">شلوغی ساعت به ساعت</span>
          <span className="text-[14px] text-[#5d7181]">هر ساعت {fa(GYM.hourCap)} جا</span>
        </div>
        <div className={`flex items-end ${compact ? "gap-[3px]" : "gap-1.5"}`}>
          {hours.map((h) => {
            const list = occ.filter((s) => s.h === h);
            const isNow = h === GYM.now;
            const full = list.length >= GYM.hourCap;
            return (
              <div key={h} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <div className={`w-full flex flex-col-reverse gap-[2px] rounded-md p-[2px] ${isNow ? "ring-2 ring-[#d1b252] bg-[#fbf6e6]" : ""}`}>
                  {Array.from({ length: GYM.hourCap }, (_, i) => {
                    const s = list[i];
                    return <span key={i} className={`block w-full rounded-[2px] ${compact ? "h-[7px]" : "h-[10px]"} ${s ? "" : "bg-[#eef2f5]"} ${s?.s === "live" ? "live-pulse" : ""}`} style={s ? { background: SEGC[s.s] } : undefined} />;
                  })}
                </div>
                <span className={`text-[14px] tnum leading-none ${isNow ? "text-[#a97f2f] font-bold" : full ? "text-[#c4472c]" : "text-[#8a99a5]"} ${compact && h % 2 ? "opacity-0" : ""}`}>{fa(h)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

const Leg = ({ c, n, l }) => (
  <div className="flex items-center gap-2 min-w-0">
    <span className={`h-3 w-3 rounded-[3px] shrink-0 ${c === "free" ? "bg-[repeating-linear-gradient(135deg,#eef2f5_0_3px,#d3dce3_3px_6px)]" : ""}`} style={c !== "free" ? { background: c } : undefined} />
    <span className="text-[14px] text-[#5d7181] truncate">{l}</span>
    <span className="text-[15px] font-bold text-[#041d2c] tnum">{fa(n)}</span>
  </div>
);
