/*
 Subject: HomeGym Ops (Zeus7f/home-gym-app) as a responsive Persian RTL web app. v2.
 Job: show every menu for 3 roles; owner works on desktop, tablet AND mobile; trainer + member are mobile-first.
 Type: Lalezar (Tehran poster lettering) for statement numbers, Vazirmatn for all UI. 14px floor.
 Color: ink #06314e lead, deep #041d2c, steel #18527e, brass #d1b252 (live / now), rubber #c4472c (low/debt), chalk #f7f9fb.
 Capacity v2: one stacked bar (done / on floor / coming / no-show / free) + hour-by-hour floor grid with "now" ring.
 Shell: desktop sidebar, tablet icon rail, mobile bottom tabs + "more" sheet + FAB. Detail = side drawer (desktop/tablet) or bottom sheet (mobile).
*/
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Monitor, Tablet, Smartphone, FileDown } from "lucide-react";
import "./index.css";
import OwnerApp from "./owner.jsx";
import TrainerApp from "./trainer.jsx";
import MemberApp from "./member.jsx";
import specUrl from "./spec.md";

const ROLES = [["owner", "مدیر باشگاه"], ["trainer", "مربی"], ["member", "ورزشکار"]];
const DEV = { desktop: [1280, 820, Monitor, "دسکتاپ"], tablet: [820, 1080, Tablet, "تبلت"], mobile: [390, 844, Smartphone, "موبایل"] };

export default function App() {
  const [role, setRole] = useState("owner");
  const [dev, setDev] = useState("desktop");
  const d = role === "owner" ? dev : "mobile";

  const download = async () => {
    const txt = await (await fetch(specUrl)).text();
    const url = URL.createObjectURL(new Blob([txt], { type: "text/markdown" }));
    const a = document.createElement("a"); a.href = url; a.download = "homegym-web-spec.md"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#e6ecf0] px-5 py-5">
      <div className="mx-auto max-w-[1320px]">
        <header className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex-1 min-w-[220px]">
            <div className="font-display text-[30px] leading-none text-[#06314e]">هوم‌جیم وب · نسخه ۲</div>
            <div className="text-[15px] text-[#3c4f5e] mt-1.5">همه منوها، سه نقش. مدیر روی هر سه دستگاه، مربی و ورزشکار موبایل‌محور</div>
          </div>
          <Toggle items={ROLES} value={role} onChange={setRole} id="role" />
          <div className={role === "owner" ? "" : "opacity-40 pointer-events-none"} title={role === "owner" ? "" : "این نقش موبایل‌محور است"}>
            <Toggle items={Object.entries(DEV).map(([k, v]) => [k, v[3], v[2]])} value={d} onChange={setDev} id="dev" />
          </div>
          <button onClick={download} className="h-11 px-4 rounded-xl bg-[#d1b252] text-black font-bold flex items-center gap-2 hover:bg-[#c7a744]"><FileDown size={18} />دانلود Markdown</button>
        </header>
        <Stage d={d} key={role + d}>
          {role === "owner" && <OwnerApp d={d} />}
          {role === "trainer" && <TrainerApp />}
          {role === "member" && <MemberApp />}
        </Stage>
      </div>
    </div>
  );
}

function Toggle({ items, value, onChange, id }) {
  return (
    <div className="flex p-1 rounded-xl bg-white border border-[#d3dde5]">
      {items.map(([k, l, I]) => (
        <button key={k} onClick={() => onChange(k)} className={`relative h-10 px-3.5 rounded-lg flex items-center gap-2 text-[15px] transition ${value === k ? "text-white" : "text-[#3d4f5c] hover:text-[#06314e]"}`}>
          {value === k && <motion.span layoutId={id} className="absolute inset-0 rounded-lg bg-[#06314e]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
          {I && <I size={17} className="relative" />}<span className="relative font-semibold">{l}</span>
        </button>
      ))}
    </div>
  );
}

function Stage({ d, children }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);
  const [w, h] = DEV[d];
  const bez = d === "desktop" ? 0 : d === "tablet" ? 28 : 24;
  const W = w + bez, Hh = h + bez + (d === "desktop" ? 40 : 0);
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / W)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [W]);
  return (
    <div ref={ref} className="w-full">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ height: Hh * scale }} className="relative">
        <div style={{ width: W, height: Hh, transform: `scale(${scale})`, transformOrigin: "top center", position: "absolute", left: "50%", marginLeft: -W / 2 }}>
          {d === "desktop" ? (
            <div className="h-full rounded-2xl overflow-hidden bg-white shadow-xl border border-[#cfd9e1] flex flex-col">
              <div className="h-10 shrink-0 bg-[#eef2f5] border-b border-[#d8e1e8] flex items-center gap-3 px-4" dir="ltr">
                <div className="flex gap-1.5"><span className="h-3 w-3 rounded-full bg-[#d6dde3]" /><span className="h-3 w-3 rounded-full bg-[#d6dde3]" /><span className="h-3 w-3 rounded-full bg-[#d6dde3]" /></div>
                <div className="flex-1 mx-auto max-w-md h-7 rounded-md bg-white text-[14px] text-[#5d7181] grid place-items-center">homegym.app/owner</div><div className="w-14" />
              </div>
              <div className="flex-1 min-h-0">{children}</div>
            </div>
          ) : (
            <div className={`h-full bg-[#1a2630] shadow-2xl ${d === "tablet" ? "rounded-[36px] p-[14px]" : "rounded-[50px] p-3"}`}>
              <div className={`relative h-full overflow-hidden bg-white ${d === "tablet" ? "rounded-[24px]" : "rounded-[40px]"}`}>
                {d === "mobile" && <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-7 w-28 rounded-full bg-[#1a2630] z-50" />}
                {children}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
