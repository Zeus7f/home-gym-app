import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Minus, Plus, WifiOff, Search, ChevronRight, CalendarCheck, Users, History, BookOpen, Bell, Trophy } from "lucide-react";
import { Card, H, Btn, Avatar, Chips, Meter } from "./ui.jsx";
import { WORKOUT, CATALOG, CATS, MEMBERS, SESSIONS, STATUS, left, fa } from "./data.js";

const ME = "ali";
const TABS = [["today", CalendarCheck, "امروز"], ["mem", Users, "ورزشکاران"], ["hist", History, "سوابق"], ["cat", BookOpen, "حرکات"]];

export default function TrainerApp() {
  const [tab, setTab] = useState("today");
  const [session, setSession] = useState(false);
  return (
    <div className="relative h-full bg-[#f7f9fb] overflow-hidden">
      <div className="h-full flex flex-col">
        <header className="pt-11 px-4 pb-3 bg-white border-b border-[#dfe6ec] flex items-center gap-3">
          <Avatar name="علی" size={40} tone="ink" />
          <div className="flex-1"><div className="text-[14px] text-[#5d7181]">مربی · سه‌شنبه ۱۴ مهر</div><div className="text-[19px] font-extrabold text-[#041d2c]">{{ today: "ورزشکاران امروز", mem: "ورزشکاران من", hist: "سوابق تمرین", cat: "کاتالوگ حرکات" }[tab]}</div></div>
          <button className="relative h-10 w-10 rounded-lg border border-[#dfe6ec] grid place-items-center text-[#06314e]"><Bell size={19} /></button>
        </header>
        <div className="flex-1 overflow-auto no-scrollbar px-4 py-4 pb-28">
          {tab === "today" && <Today open={() => setSession(true)} />}
          {tab === "mem" && <MyMembers />}
          {tab === "hist" && <Hist />}
          {tab === "cat" && <Catalog />}
        </div>
      </div>
      <nav className="absolute bottom-0 inset-x-0 bg-white border-t border-[#dfe6ec] grid grid-cols-4 pt-2 pb-5">
        {TABS.map(([k, I, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex flex-col items-center gap-1 ${tab === k ? "text-[#06314e]" : "text-[#8a99a5]"}`}>
            <span className={`h-8 w-14 rounded-full grid place-items-center ${tab === k ? "bg-[#e3ecf3]" : ""}`}><I size={21} strokeWidth={tab === k ? 2.2 : 1.8} /></span>
            <span className={`text-[14px] ${tab === k ? "font-bold" : ""}`}>{l}</span>
          </button>
        ))}
      </nav>
      <AnimatePresence>{session && <Session close={() => setSession(false)} />}</AnimatePresence>
    </div>
  );
}

function Today({ open }) {
  const mine = SESSIONS.filter((s) => s.tr === ME);
  const active = mine.filter((s) => !["cancel", "noshow"].includes(s.s));
  const byS = (k) => mine.filter((s) => s.s === k);
  const mm = (n) => MEMBERS.find((x) => x.m === n) || { total: 12, used: 5 };
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div><div className="text-[14px] text-[#5d7181]">ظرفیت امروز من</div><div className="font-display text-[40px] leading-none text-[#06314e] tnum mt-1">{fa(active.length)} <span className="text-[20px] text-[#6b7d8a]">/ ۶</span></div></div>
          <div className="text-left text-[14px] text-[#5d7181] leading-7"><div>تکمیل <b className="text-[#041d2c] tnum">{fa(byS("done").length)}</b></div><div>در سالن <b className="text-[#041d2c] tnum">{fa(byS("live").length)}</b></div><div>در انتظار <b className="text-[#041d2c] tnum">{fa(byS("wait").length)}</b></div></div>
        </div>
        <div className="mt-3 flex gap-1">{Array.from({ length: 6 }, (_, i) => { const s = active[i]; return <span key={i} className={`h-3 flex-1 rounded-full ${s ? STATUS[s.s].dot : "bg-[#eef2f5]"} ${s?.s === "live" ? "live-pulse" : ""}`} />; })}</div>
      </Card>

      <div className="text-[14px] font-bold text-[#a97f2f]">داخل سالن</div>
      {byS("live").map((s) => (
        <button key={s.id} onClick={open} className="w-full text-right rounded-2xl bg-[#06314e] text-white p-4 flex items-center gap-3 shadow-md">
          <Avatar name={s.m} size={46} tone="brass" />
          <div className="flex-1 min-w-0"><div className="text-[17px] font-bold">{s.m}</div><div className="text-[14px] text-[#c5ddee]">از {s.t} · مانده {fa(left(mm(s.m)))} جلسه</div></div>
          <span className="h-10 px-3 rounded-lg bg-[#d1b252] text-[#041d2c] text-[14px] font-bold grid place-items-center">ادامه ثبت</span>
        </button>
      ))}
      <div className="text-[14px] font-bold text-[#5d7181] pt-1">بعدی</div>
      {byS("wait").map((s) => (
        <Card key={s.id} className="p-3.5 flex items-center gap-3">
          <Avatar name={s.m} size={42} />
          <div className="flex-1 min-w-0"><div className="font-semibold text-[#041d2c]">{s.m}</div><div className="text-[14px] text-[#5d7181]">ساعت {s.t} · مانده {fa(left(mm(s.m)))} جلسه</div></div>
          <Btn v="ghost" className="h-10">ثبت ورود</Btn>
        </Card>
      ))}
      <div className="text-[14px] font-bold text-[#5d7181] pt-1">تمام‌شده</div>
      {[...byS("done"), ...mine.filter((s) => s.s === "cancel")].map((s) => (
        <div key={s.id} className="flex items-center gap-3 px-1 py-2 opacity-70"><Check size={18} className="text-[#06314e]" /><span className={`flex-1 ${s.s === "cancel" ? "line-through" : ""}`}>{s.m}</span><span className="text-[14px] text-[#5d7181] tnum">{s.t}</span></div>
      ))}
      <Btn v="soft" className="w-full h-12"><Plus size={18} />افزودن ورزشکار به امروز</Btn>
    </div>
  );
}

function Session({ close }) {
  const [w, setW] = useState(WORKOUT);
  const [open, setOpen] = useState(0);
  const [done, setDone] = useState(false);
  const total = w.reduce((a, e) => a + e.sets.length, 0);
  const ds = w.reduce((a, e) => a + e.sets.filter((s) => s.d).length, 0);
  const upd = (ei, si, f) => setW((p) => p.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.map((s, j) => (j !== si ? s : f(s))) })));
  return (
    <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 340, damping: 36 }} className="absolute inset-0 z-30 bg-[#f7f9fb] flex flex-col">
      <header className="pt-11 px-4 pb-3 bg-[#06314e] text-white">
        <div className="flex items-center gap-2">
          <button onClick={close} className="h-10 w-10 -ms-2 grid place-items-center" aria-label="بازگشت"><ChevronRight size={24} /></button>
          <div className="flex-1"><div className="text-[14px] text-[#c5ddee]">جلسه جاری · از ۲۰:۰۰</div><div className="text-[19px] font-extrabold">حمید زارعی</div></div>
          <div className="text-left"><div className="text-[14px] text-[#f2c4b8]">آخرین جلسه</div><div className="font-display text-[24px] leading-none text-[#ffb19f]">۱ <span className="text-[14px] font-sans text-[#c5ddee]">از ۱۲</span></div></div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-[#0b3d5f] overflow-hidden"><motion.div className="h-full bg-[#d1b252]" animate={{ width: `${(ds / total) * 100}%` }} /></div>
        <div className="mt-1.5 flex justify-between text-[14px] text-[#c5ddee]"><span>{fa(ds)} از {fa(total)} ست</span><span className="flex items-center gap-1"><WifiOff size={14} />ذخیره آفلاین</span></div>
      </header>
      <div className="flex-1 overflow-auto no-scrollbar px-3 py-3 space-y-3 pb-28">
        {w.map((e, ei) => {
          const isOpen = open === ei;
          const n = e.sets.filter((s) => s.d).length;
          return (
            <Card key={e.name} className="overflow-hidden">
              <button onClick={() => setOpen(isOpen ? -1 : ei)} className="w-full p-4 flex items-center gap-3 text-right">
                <span className={`h-11 w-11 rounded-xl grid place-items-center font-bold tnum ${n === e.sets.length ? "bg-[#06314e] text-white" : "bg-[#eef2f5] text-[#06314e]"}`}>{n === e.sets.length ? <Check size={20} /> : `${fa(n)}/${fa(e.sets.length)}`}</span>
                <div className="flex-1 min-w-0"><div className="font-bold text-[16px] text-[#041d2c]">{e.name}</div><div className="text-[14px] text-[#5d7181]">{e.last}</div></div>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 space-y-2">
                  {e.sets.map((s, si) => (
                    <div key={si} className={`rounded-xl p-2.5 flex items-center gap-2 transition ${s.d ? "bg-[#06314e] text-white" : "bg-[#f4f7f9]"}`}>
                      <span className="w-7 text-center text-[14px] font-bold opacity-70 tnum">{fa(si + 1)}</span>
                      <Stepper v={s.w} u="kg" dark={s.d} step={2.5} on={(v) => upd(ei, si, (x) => ({ ...x, w: v }))} />
                      <Stepper v={s.r} u="تکرار" dark={s.d} step={1} on={(v) => upd(ei, si, (x) => ({ ...x, r: v }))} />
                      <button onClick={() => upd(ei, si, (x) => ({ ...x, d: !x.d }))} aria-label="انجام شد" className={`ms-auto h-12 w-12 shrink-0 rounded-xl grid place-items-center ${s.d ? "bg-[#d1b252] text-[#041d2c]" : "bg-white border-2 border-[#c9d3db] text-[#c9d3db]"}`}><Check size={24} strokeWidth={3} /></button>
                    </div>
                  ))}
                  <button className="w-full h-10 text-[14px] font-semibold text-[#18527e]">+ ست اضافه</button>
                </div>
              )}
            </Card>
          );
        })}
        <button className="w-full h-12 rounded-2xl border-2 border-dashed border-[#b8c4cd] text-[#18527e] font-semibold flex items-center justify-center gap-2"><Search size={17} />افزودن حرکت</button>
      </div>
      <div className="absolute bottom-0 inset-x-0 p-3 pb-6 bg-white border-t border-[#dfe6ec]">
        <Btn onClick={() => setDone(true)} className="w-full h-14 text-[16px] rounded-xl">اتمام جلسه و کسر ۱ جلسه</Btn>
      </div>
      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-[#041d2c]/70 flex items-end" onClick={() => { setDone(false); close(); }}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full bg-white rounded-t-[24px] p-6 pb-10 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 14 }} className="mx-auto h-16 w-16 rounded-full bg-[#06314e] text-[#d1b252] grid place-items-center"><Check size={34} strokeWidth={3} /></motion.div>
              <div className="font-display text-[28px] text-[#041d2c] mt-3">جلسه ثبت شد</div>
              <div className="text-[15px] text-[#5d7181] mt-1">مانده حمید: ۰ · کارکرد شما: +۱۵۰ هزار تومان</div>
              <div className="mt-4 rounded-lg bg-[#fbf3ef] text-[#a8381f] text-[14px] py-2.5">بسته حمید تمام شد، به مدیر اطلاع داده شد</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Stepper({ v, u, on, dark, step }) {
  const b = `h-10 w-9 rounded-lg grid place-items-center ${dark ? "bg-[#0b3d5f]" : "bg-white border border-[#d8e1e8] text-[#06314e]"}`;
  return (
    <div className="flex items-center gap-1">
      <button className={b} onClick={() => on(Math.max(0, v - step))} aria-label="کم"><Minus size={15} /></button>
      <div className="w-[46px] text-center leading-tight"><div className="font-bold text-[16px] tnum">{fa(v)}</div><div className="text-[14px] opacity-60">{u}</div></div>
      <button className={b} onClick={() => on(v + step)} aria-label="زیاد"><Plus size={15} /></button>
    </div>
  );
}

function MyMembers() {
  const list = MEMBERS.filter((m) => m.tr === ME);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 h-11 px-3 rounded-xl bg-white border border-[#dfe6ec] text-[#6b7d8a]"><Search size={18} /><span className="text-[14px]">جستجوی ورزشکار…</span></div>
      {list.map((m) => (
        <Card key={m.id} className="p-4">
          <div className="flex items-center gap-3"><Avatar name={m.m} /><div className="flex-1"><div className="font-semibold text-[#041d2c]">{m.m}</div><div className="text-[14px] text-[#5d7181]">آخرین جلسه: ۱۲ مهر</div></div><span className={`font-display text-[24px] tnum ${left(m) <= 2 ? "text-[#c4472c]" : "text-[#06314e]"}`}>{fa(left(m))}</span></div>
          <div className="mt-3"><Meter total={m.total} used={m.used} /></div>
        </Card>
      ))}
    </div>
  );
}

function Hist() {
  const days = [["امروز", [["پارسا موسوی", "پرس سینه، پرس سرشانه", "۴۵ دقیقه"], ["بهراد شریفی", "ددلیفت، زیربغل", "۵۰ دقیقه"]]], ["دیروز", [["رضا احمدی", "اسکات، لانج، پلانک", "۵۵ دقیقه"], ["ترانه یزدانی", "پرس سینه، جلوبازو", "۴۰ دقیقه"], ["آیدا مرادی", "دوچرخه، حرکات شکم", "۳۵ دقیقه"]]]];
  return (
    <div className="space-y-5">
      <Card className="p-4 grid grid-cols-3 text-center">
        {[["این ماه", "۴۲"], ["این هفته", "۱۱"], ["کارکرد", "۶٫۳ م"]].map(([l, v]) => <div key={l}><div className="font-display text-[26px] text-[#06314e]">{v}</div><div className="text-[14px] text-[#5d7181]">{l}</div></div>)}
      </Card>
      {days.map(([d, rows]) => (
        <div key={d}>
          <div className="text-[14px] font-bold text-[#5d7181] mb-2">{d}</div>
          <Card className="px-4">{rows.map(([m, ex, t]) => <div key={m} className="py-3 border-b border-[#f0f3f6] last:border-0"><div className="flex justify-between"><span className="font-semibold text-[#041d2c]">{m}</span><span className="text-[14px] text-[#5d7181]">{t}</span></div><div className="text-[14px] text-[#5d7181] mt-0.5">{ex}</div></div>)}</Card>
        </div>
      ))}
    </div>
  );
}

function Catalog() {
  const [c, setC] = useState("همه");
  const list = CATALOG.filter((x) => c === "همه" || x.c === c);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 h-11 px-3 rounded-xl bg-white border border-[#dfe6ec] text-[#6b7d8a]"><Search size={18} /><span className="text-[14px]">نام حرکت یا عضله…</span></div>
      <Chips value={c} onChange={setC} items={CATS.map((x) => [x, x])} />
      <div className="grid grid-cols-2 gap-3">
        {list.map((x) => (
          <Card key={x.n} className="overflow-hidden">
            <div className="h-24 bg-[#eef2f5] grid place-items-center text-[#8fb0c8]">
              <svg width="56" height="36" viewBox="0 0 30 20"><rect x="0" y="4" width="4" height="12" rx="1" fill="currentColor" /><rect x="5" y="1" width="4" height="18" rx="1" fill="currentColor" /><rect x="9" y="9" width="12" height="2" fill="currentColor" /><rect x="21" y="1" width="4" height="18" rx="1" fill="currentColor" /><rect x="26" y="4" width="4" height="12" rx="1" fill="currentColor" /></svg>
            </div>
            <div className="p-3"><div className="font-semibold text-[15px] text-[#041d2c] leading-snug">{x.n}</div><div className="text-[14px] text-[#5d7181]">{x.c} · {x.eq}</div></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
