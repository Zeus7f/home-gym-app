import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LayoutDashboard, CalendarClock, Users, Dumbbell, Wallet, FileBarChart, Settings, Search, Plus, LogOut, ArrowLeftRight, MoreHorizontal, Bell, X, Phone, ChevronLeft, MessageSquare, Check, Minus } from "lucide-react";
import { Card, H, Pill, Btn, Avatar, Chips, Seg, Meter, Capacity } from "./ui.jsx";
import { GYM, TRAINERS, SESSIONS, MEMBERS, PAYMENTS, WEEK, STATUS, tName, left, debt, fa, toman, short } from "./data.js";

const NAV = [
  ["dash", LayoutDashboard, "داشبورد", "داشبورد عملیات"],
  ["sched", CalendarClock, "برنامه", "برنامه و حضور"],
  ["mem", Users, "اعضا", "اعضا و بسته‌ها"],
  ["tr", Dumbbell, "مربیان", "مربیان و تسویه"],
  ["fin", Wallet, "مالی", "مالی و پرداخت‌ها"],
  ["rep", FileBarChart, "گزارش", "گزارش‌ها"],
  ["set", Settings, "تنظیمات", "تنظیمات باشگاه"],
];
const MOBILE_TABS = ["dash", "sched", "mem", "fin"];
const TITLES = Object.fromEntries(NAV.map((n) => [n[0], n[3]]));

export default function OwnerApp({ d }) {
  const [scr, setScr] = useState("dash");
  const [more, setMore] = useState(false);
  const [member, setMember] = useState(null);
  const go = (k) => { setScr(k); setMore(false); };
  const props = { d, go, openMember: setMember };
  const Screen = { dash: Dash, sched: Sched, mem: Members, tr: Trainers, fin: Finance, rep: Reports, set: SettingsScr }[scr];

  if (d === "mobile") {
    return (
      <div className="relative h-full flex flex-col bg-[#f7f9fb]">
        <header className="pt-11 px-4 pb-3 bg-white border-b border-[#dfe6ec] flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[14px] text-[#5d7181]">{scr === "dash" ? GYM.date : GYM.name}</div>
            <div className="text-[20px] font-extrabold text-[#041d2c] truncate">{scr === "dash" ? "عملیات امروز" : TITLES[scr]}</div>
          </div>
          <IconBtn><Search size={19} /></IconBtn>
          <IconBtn dot><Bell size={19} /></IconBtn>
        </header>
        <div className="flex-1 overflow-auto no-scrollbar px-4 py-4 pb-24"><Screen {...props} /></div>
        {(scr === "dash" || scr === "sched" || scr === "mem") && (
          <button className="absolute left-4 bottom-[92px] h-14 w-14 rounded-2xl bg-[#d1b252] text-black shadow-lg grid place-items-center" aria-label="نوبت جدید"><Plus size={26} /></button>
        )}
        <nav className="absolute bottom-0 inset-x-0 bg-white border-t border-[#dfe6ec] grid grid-cols-5 pt-2 pb-5">
          {MOBILE_TABS.map((k) => { const n = NAV.find((x) => x[0] === k); return <Tab key={k} I={n[1]} l={n[2]} a={scr === k} onClick={() => go(k)} />; })}
          <Tab I={MoreHorizontal} l="بیشتر" a={["tr", "rep", "set"].includes(scr)} onClick={() => setMore(true)} />
        </nav>
        <Sheet open={more} onClose={() => setMore(false)} d={d}>
          <div className="text-[17px] font-bold text-[#041d2c] mb-3">بخش‌های دیگر</div>
          {NAV.filter((n) => !MOBILE_TABS.includes(n[0])).map(([k, I, , l]) => (
            <button key={k} onClick={() => go(k)} className="w-full flex items-center gap-3 h-14 border-b border-[#eef2f5] last:border-0 text-[16px] text-[#041d2c]">
              <span className="h-10 w-10 rounded-xl bg-[#eef2f5] grid place-items-center text-[#06314e]"><I size={19} /></span>{l}<ChevronLeft size={18} className="ms-auto text-[#8a99a5]" />
            </button>
          ))}
        </Sheet>
        <MemberSheet m={member} onClose={() => setMember(null)} d={d} />
      </div>
    );
  }

  const rail = d === "tablet";
  return (
    <div className="relative h-full flex bg-[#f7f9fb]">
      <aside className={`${rail ? "w-[84px]" : "w-60"} shrink-0 bg-[#06314e] text-[#dbe5ec] flex flex-col`}>
        <div className={rail ? "h-20 grid place-items-center" : "px-6 pt-7 pb-7"}>
          {rail ? <span className="font-display text-[30px] text-[#d1b252]">ه</span> : (<><div className="font-display text-[32px] leading-none text-white">هوم‌جیم</div><div className="mt-2 text-[14px] text-[#b4c8d6]">{GYM.name}</div></>)}
        </div>
        <nav className={`flex-1 ${rail ? "px-2 space-y-1" : "px-3 space-y-1"}`}>
          {NAV.map(([k, I, sl, l]) => {
            const a = scr === k;
            return rail ? (
              <button key={k} onClick={() => go(k)} className={`w-full flex flex-col items-center gap-1 py-2.5 rounded-xl transition ${a ? "bg-[#041d2c] text-white" : "hover:bg-[#0b3d5f]"}`}>
                <I size={21} strokeWidth={1.8} className={a ? "text-[#d1b252]" : ""} /><span className="text-[14px]">{sl}</span>
              </button>
            ) : (
              <button key={k} onClick={() => go(k)} className={`w-full flex items-center gap-3 px-3 h-11 rounded-lg text-[15px] transition ${a ? "bg-[#041d2c] text-white font-semibold shadow-[inset_-3px_0_0_#d1b252]" : "hover:bg-[#0b3d5f]"}`}>
                <I size={18} strokeWidth={1.8} className={a ? "text-[#d1b252]" : ""} />{l}
              </button>
            );
          })}
        </nav>
        <div className={`m-3 rounded-xl bg-[#041d2c] p-3 flex items-center gap-3 ${rail ? "justify-center p-2" : ""}`}>
          <Avatar name="حسن" size={36} tone="brass" />
          {!rail && <><div className="flex-1 min-w-0"><div className="text-white text-[14px] font-semibold">حسن فرجی</div><div className="text-[14px] text-[#b4c8d6]">مدیر باشگاه</div></div><LogOut size={17} className="text-[#b4c8d6]" /></>}
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className={`${rail ? "px-6" : "px-8"} h-[76px] shrink-0 flex items-center gap-3 border-b border-[#dfe6ec] bg-white`}>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] text-[#5d7181]">{GYM.date}</div>
            <h1 className="text-[22px] font-extrabold text-[#041d2c] truncate">{scr === "dash" ? "عملیات امروز" : TITLES[scr]}</h1>
          </div>
          {rail ? <IconBtn><Search size={19} /></IconBtn> : (
            <div className="flex items-center gap-2 h-10 px-3 w-72 rounded-lg bg-[#f4f7f9] border border-[#dfe6ec] text-[#6b7d8a]">
              <Search size={17} /><span className="flex-1 text-[14px]">جستجوی عضو، مربی، شماره…</span><kbd className="text-[14px] px-1.5 rounded bg-white text-[#5d7181] font-sans" dir="ltr">⌘K</kbd>
            </div>
          )}
          <IconBtn dot><Bell size={19} /></IconBtn>
          <Btn><Plus size={18} />{rail ? "نوبت" : "نوبت‌دهی امروز"}</Btn>
        </header>
        <div className={`flex-1 overflow-auto thin-scroll ${rail ? "p-6" : "p-8"}`}><Screen {...props} /></div>
      </div>
      <MemberSheet m={member} onClose={() => setMember(null)} d={d} />
    </div>
  );
}

const IconBtn = ({ children, dot }) => (
  <button className="relative h-10 w-10 shrink-0 rounded-lg border border-[#dfe6ec] bg-white grid place-items-center text-[#06314e]">{children}{dot && <span className="absolute top-2 left-2 h-2 w-2 rounded-full bg-[#c4472c]" />}</button>
);
const Tab = ({ I, l, a, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 ${a ? "text-[#06314e]" : "text-[#8a99a5]"}`}>
    <span className={`h-8 w-14 rounded-full grid place-items-center transition ${a ? "bg-[#e3ecf3]" : ""}`}><I size={21} strokeWidth={a ? 2.2 : 1.8} /></span>
    <span className={`text-[14px] ${a ? "font-bold" : ""}`}>{l}</span>
  </button>
);

export function Sheet({ open, onClose, d, children }) {
  const mob = d === "mobile";
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="absolute inset-0 bg-[#041d2c]/45 z-30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={mob ? { y: "100%" } : { x: "100%" }} animate={mob ? { y: 0 } : { x: 0 }} exit={mob ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className={`absolute z-40 bg-white overflow-auto no-scrollbar ${mob ? "inset-x-0 bottom-0 max-h-[85%] rounded-t-[24px] px-5 pt-3 pb-8" : "top-0 right-0 bottom-0 w-[400px] p-6 shadow-2xl"}`}>
            {mob && <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#d3dce3]" />}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MemberSheet({ m, onClose, d }) {
  return (
    <Sheet open={!!m} onClose={onClose} d={d}>
      {m && (
        <div>
          <div className="flex items-center gap-3">
            <Avatar name={m.m} size={52} tone="ink" />
            <div className="flex-1 min-w-0"><div className="text-[19px] font-extrabold text-[#041d2c]">{m.m}</div><div className="text-[14px] text-[#5d7181] tnum">{m.ph}</div></div>
            <button onClick={onClose} className="h-9 w-9 rounded-lg hover:bg-[#eef2f5] grid place-items-center" aria-label="بستن"><X size={20} /></button>
          </div>
          <div className="mt-5 rounded-2xl bg-[#f4f7f9] p-4">
            <div className="flex items-end justify-between">
              <div><div className="text-[14px] text-[#5d7181]">{m.pkg}</div><div className="text-[14px] text-[#5d7181]">انقضا: {m.exp}</div></div>
              <div className={`font-display text-[44px] leading-none tnum ${left(m) <= 2 ? "text-[#c4472c]" : "text-[#06314e]"}`}>{fa(left(m))}<span className="text-[18px] text-[#6b7d8a]"> / {fa(m.total)}</span></div>
            </div>
            <div className="mt-3"><Meter total={m.total} used={m.used} h={12} /></div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#dfe6ec] p-3"><div className="text-[14px] text-[#5d7181]">مربی پیش‌فرض</div><div className="font-bold text-[#041d2c]">{tName(m.tr)}</div></div>
            <div className={`rounded-xl border p-3 ${debt(m) ? "border-[#f0d6cc] bg-[#fbf3ef]" : "border-[#dfe6ec]"}`}><div className="text-[14px] text-[#5d7181]">بدهی</div><div className={`font-bold tnum ${debt(m) ? "text-[#a8381f]" : "text-[#22603a]"}`}>{debt(m) ? toman(debt(m)) : "تسویه"}</div></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Btn>ثبت پرداخت</Btn><Btn v="brass">تمدید بسته</Btn><Btn v="ghost">تغییر مربی دائم</Btn><Btn v="ghost">اصلاح مانده</Btn>
          </div>
          <div className="mt-6 text-[15px] font-bold text-[#041d2c]">آخرین جلسات</div>
          {[["۱۲ مهر", "پرس سینه، اسکات، زیربغل"], ["۱۰ مهر", "ددلیفت، پرس سرشانه"], ["۷ مهر", "اسکات، لانج، پلانک"]].map(([dt, ex]) => (
            <div key={dt} className="flex gap-3 py-3 border-b border-[#eef2f5] last:border-0"><span className="w-14 text-[14px] text-[#5d7181]">{dt}</span><span className="text-[15px] text-[#24323d]">{ex}</span></div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

/* ---------------- Dashboard ---------------- */
function Dash({ d, go, openMember }) {
  const live = SESSIONS.filter((s) => s.s === "live");
  const next = SESSIONS.filter((s) => s.s === "wait");
  const low = MEMBERS.filter((m) => m.st === "active" && left(m) <= 2);
  const mob = d === "mobile";

  const Floor = (
    <Card className="p-5">
      <H sub={`${fa(live.length)} نفر الان داخل سالن · ${fa(next.length)} نفر بعدی`} action={<button onClick={() => go("sched")} className="text-[14px] font-semibold text-[#18527e]">کل برنامه</button>}>الان و بعدی</H>
      <div className="mt-3">
        {[...live, ...next.slice(0, mob ? 2 : 3)].map((s) => (
          <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-[#f0f3f6] last:border-0">
            <span className={`h-9 w-1.5 rounded-full ${STATUS[s.s].dot} ${s.s === "live" ? "live-pulse" : ""}`} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[#041d2c] truncate">{s.m}</div>
              <div className="text-[14px] text-[#5d7181] truncate">{s.t} · {tName(s.tr)}{s.ov && <span className="text-[#a97f2f]"> · جابجایی امروز</span>}</div>
            </div>
            {s.s === "live" ? <Btn className="h-9 px-3">اتمام جلسه</Btn> : <Btn v="ghost" className="h-9 px-3">ثبت ورود</Btn>}
          </div>
        ))}
      </div>
    </Card>
  );
  const Load = (
    <Card className="p-5">
      <H action={<button onClick={() => go("tr")} className="text-[14px] font-semibold text-[#18527e]">مربیان</button>}>بار مربیان امروز</H>
      <div className="mt-4 space-y-4">
        {TRAINERS.map((t) => {
          const mine = SESSIONS.filter((s) => s.tr === t.id && !["cancel", "noshow"].includes(s.s));
          const pct = Math.min(1, mine.length / t.cap);
          const full = mine.length >= t.cap;
          return (
            <div key={t.id} className="flex items-center gap-3">
              <Avatar name={t.name} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[14px]"><span className="font-semibold text-[#041d2c] truncate">{t.name}</span><span className={`tnum ${full ? "text-[#c4472c] font-bold" : "text-[#5d7181]"}`}>{full ? "تکمیل" : `${fa(t.cap - mine.length)} جای خالی`}</span></div>
                <div className="mt-1.5 h-2 rounded-full bg-[#eef2f5] overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }} transition={{ duration: 0.6, delay: 0.3 }} className={`h-full rounded-full ${full ? "bg-[#c4472c]" : "bg-[#06314e]"}`} /></div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
  const Low = (
    <Card className="p-5 !bg-[#fbf3ef] !border-[#f0d6cc]">
      <H sub="۲ جلسه یا کمتر مانده">بسته‌های رو به اتمام</H>
      <div className="mt-2">
        {low.map((m) => (
          <button key={m.id} onClick={() => openMember(m)} className="w-full flex items-center justify-between py-2.5 border-b border-[#f0d6cc] last:border-0 text-right">
            <div><div className="font-semibold text-[#041d2c]">{m.m}</div>{debt(m) > 0 && <div className="text-[14px] text-[#a8381f]">بدهی {toman(debt(m))}</div>}</div>
            <span className="font-display text-[26px] leading-none text-[#c4472c] tnum">{fa(left(m))}<span className="font-sans text-[14px] ms-1">جلسه</span></span>
          </button>
        ))}
      </div>
      <Btn v="danger" className="mt-3 w-full"><MessageSquare size={16} />پیامک یادآوری تمدید</Btn>
    </Card>
  );
  const Money = (
    <Card className="p-5">
      <div className="grid grid-cols-2 gap-4">
        <div><div className="text-[14px] text-[#5d7181]">دریافتی امروز</div><div className="font-display text-[28px] text-[#06314e] tnum leading-tight">{short(1500000)}</div></div>
        <div><div className="text-[14px] text-[#5d7181]">مطالبات از اعضا</div><div className="font-display text-[28px] text-[#a8381f] tnum leading-tight">{short(MEMBERS.reduce((a, m) => a + debt(m), 0))}</div></div>
      </div>
      <button onClick={() => go("fin")} className="mt-3 text-[14px] font-semibold text-[#18527e]">مالی و پرداخت‌ها</button>
    </Card>
  );

  if (d === "desktop")
    return (
      <div className="grid grid-cols-[1fr_340px] gap-6 items-start">
        <div className="space-y-6"><Capacity />{Floor}</div>
        <div className="space-y-6">{Load}{Low}{Money}</div>
      </div>
    );
  if (d === "tablet")
    return (
      <div className="space-y-5"><Capacity /><div className="grid grid-cols-2 gap-5 items-start">{Load}{Low}</div>{Floor}{Money}</div>
    );
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {["+ عضو جدید", "ثبت پرداخت", "ثبت ورود سریع", "واریز مربی"].map((x) => <Btn key={x} v="soft" className="shrink-0">{x}</Btn>)}
      </div>
      <Capacity compact />{Floor}{Low}{Load}{Money}
    </div>
  );
}

/* ---------------- Schedule ---------------- */
const DAYS = [["ش", "۱۱"], ["ی", "۱۲"], ["د", "۱۳"], ["س", "۱۴"], ["چ", "۱۵"], ["پ", "۱۶"], ["ج", "۱۷"]];
function Sched({ d }) {
  const [f, setF] = useState("all");
  const mob = d === "mobile";
  const rows = SESSIONS.filter((s) => f === "all" || s.s === f);
  const hours = [...new Set(rows.map((s) => s.h))].sort((a, b) => a - b);
  return (
    <div className="space-y-4">
      <div className={`flex ${mob ? "flex-col gap-3" : "items-center justify-between gap-4"}`}>
        <div className="flex gap-1.5">
          {DAYS.map(([w, n], i) => (
            <button key={n} className={`${mob ? "flex-1" : "w-14"} h-16 rounded-xl flex flex-col items-center justify-center border transition ${i === 3 ? "bg-[#06314e] border-[#06314e] text-white" : "bg-white border-[#dfe6ec] text-[#3d4f5c]"}`}>
              <span className="text-[14px] opacity-75">{w}</span><span className="text-[17px] font-bold tnum">{n}</span>
            </button>
          ))}
        </div>
        <Chips value={f} onChange={setF} items={[["all", "همه"], ["live", "داخل سالن"], ["wait", "در انتظار"], ["done", "تکمیل"]]} />
      </div>
      {hours.map((h) => {
        const list = rows.filter((s) => s.h === h);
        const occ = SESSIONS.filter((s) => s.h === h && s.s !== "cancel").length;
        return (
          <div key={h}>
            <div className="flex items-center gap-3 mb-2">
              <span className={`font-display text-[24px] tnum ${h === GYM.now ? "text-[#a97f2f]" : "text-[#06314e]"}`}>{fa(h)}:۰۰</span>
              {h === GYM.now && <span className="h-7 px-2.5 rounded-md bg-[#d1b252] text-[#041d2c] text-[14px] font-semibold grid place-items-center">الان</span>}
              <span className="flex-1 h-px bg-[#dfe6ec]" />
              <span className="text-[14px] text-[#5d7181] tnum">{fa(occ)} از {fa(GYM.hourCap)} جا</span>
            </div>
            <div className={mob ? "space-y-2" : "grid grid-cols-2 gap-3"}>
              {list.map((s) => (
                <Card key={s.id} className="p-3.5 flex items-center gap-3">
                  <Avatar name={s.m} size={40} tone={s.s === "live" ? "brass" : s.s === "done" ? "ink" : "mist"} />
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold truncate ${s.s === "cancel" ? "line-through text-[#8a99a5]" : "text-[#041d2c]"}`}>{s.m}</div>
                    <div className="text-[14px] text-[#5d7181] truncate flex items-center gap-1">{tName(s.tr)}{s.ov && <span className="inline-flex items-center gap-1 text-[#a97f2f]"><ArrowLeftRight size={13} />فقط امروز</span>}</div>
                  </div>
                  {s.s === "wait" ? <Btn v="ghost" className="h-9 px-3">ثبت ورود</Btn> : s.s === "live" ? <Btn className="h-9 px-3">اتمام</Btn> : <Pill s={s.s} />}
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Members ---------------- */
function Members({ d, openMember }) {
  const [f, setF] = useState("all");
  const mob = d === "mobile";
  const rows = MEMBERS.filter((m) => f === "all" || (f === "low" && m.st === "active" && left(m) <= 2) || (f === "debt" && debt(m) > 0) || (f === "exp" && m.st === "expired"));
  return (
    <div className="space-y-4">
      <div className={`flex ${mob ? "flex-col" : "items-center justify-between"} gap-3`}>
        <div className={`flex items-center gap-2 h-11 px-3 rounded-xl bg-white border border-[#dfe6ec] text-[#6b7d8a] ${mob ? "" : "w-80"}`}><Search size={18} /><span className="text-[14px]">نام یا شماره تماس…</span></div>
        <Chips value={f} onChange={setF} items={[["all", `همه · ${fa(MEMBERS.length)}`], ["low", "رو به اتمام"], ["debt", "بدهکار"], ["exp", "منقضی"]]} />
      </div>
      {mob ? (
        <div className="space-y-2">
          {rows.map((m) => (
            <Card key={m.id} className="p-4" onClick={() => openMember(m)}>
              <div className="flex items-center gap-3">
                <Avatar name={m.m} />
                <div className="flex-1 min-w-0"><div className="font-semibold text-[#041d2c]">{m.m}</div><div className="text-[14px] text-[#5d7181]">{tName(m.tr)} · {m.pkg}</div></div>
                <div className={`font-display text-[26px] leading-none tnum ${left(m) <= 2 ? "text-[#c4472c]" : "text-[#06314e]"}`}>{fa(left(m))}</div>
              </div>
              <div className="mt-3"><Meter total={m.total} used={m.used} /></div>
              {debt(m) > 0 && <div className="mt-2 text-[14px] text-[#a8381f]">بدهی {toman(debt(m))}</div>}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-[15px]">
            <thead><tr className="text-[14px] text-[#5d7181] bg-[#fafbfc] border-b border-[#eef2f5]">
              <th className="text-right font-medium px-5 py-3">ورزشکار</th>
              {d === "desktop" && <th className="text-right font-medium py-3">مربی</th>}
              <th className="text-right font-medium py-3 w-[34%]">مانده بسته</th>
              <th className="text-right font-medium py-3">بدهی</th>
              <th className="py-3 px-5" />
            </tr></thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} onClick={() => openMember(m)} className="border-b border-[#f0f3f6] last:border-0 hover:bg-[#f7f9fb] cursor-pointer">
                  <td className="px-5 py-3"><div className="flex items-center gap-3"><Avatar name={m.m} size={36} /><div><div className="font-semibold text-[#041d2c]">{m.m}</div><div className="text-[14px] text-[#5d7181] tnum">{m.ph}</div></div></div></td>
                  {d === "desktop" && <td className="py-3 text-[#3d4f5c]">{tName(m.tr)}</td>}
                  <td className="py-3 pe-6"><div className="flex items-center gap-3"><div className="flex-1"><Meter total={m.total} used={m.used} /></div><span className={`w-12 tnum text-[14px] font-bold ${left(m) <= 2 ? "text-[#c4472c]" : "text-[#041d2c]"}`}>{fa(left(m))}/{fa(m.total)}</span></div></td>
                  <td className={`py-3 tnum text-[14px] ${debt(m) ? "text-[#a8381f] font-semibold" : "text-[#8a99a5]"}`}>{debt(m) ? short(debt(m)) : "تسویه"}</td>
                  <td className="py-3 px-5 text-left"><ChevronLeft size={18} className="text-[#8a99a5] inline" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ---------------- Trainers ---------------- */
function Trainers({ d }) {
  const cols = d === "desktop" ? "grid-cols-3" : d === "tablet" ? "grid-cols-2" : "grid-cols-1";
  return (
    <div className={`grid ${cols} gap-4`}>
      {TRAINERS.map((t) => {
        const mine = SESSIONS.filter((s) => s.tr === t.id && !["cancel", "noshow"].includes(s.s));
        const owed = t.done * t.rate - t.paid;
        return (
          <Card key={t.id} className="p-5">
            <div className="flex items-center gap-3"><Avatar name={t.name} size={48} tone="ink" /><div><div className="text-[17px] font-bold text-[#041d2c]">{t.name}</div><div className="text-[14px] text-[#5d7181]">{t.spec}</div></div></div>
            <div className="mt-4 text-[14px] text-[#5d7181]">امروز {fa(mine.length)} از {fa(t.cap)} نفر</div>
            <div className="mt-2 flex gap-1">{Array.from({ length: t.cap }, (_, i) => { const s = mine[i]; return <span key={i} className={`h-7 flex-1 rounded-md ${s ? STATUS[s.s].dot : "bg-[#eef2f5]"}`} />; })}</div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-[14px]">
              <div><div className="text-[#5d7181]">ساعت کاری</div><div className="font-semibold text-[#041d2c]">{t.hours}</div></div>
              <div><div className="text-[#5d7181]">تعرفه هر جلسه</div><div className="font-semibold text-[#041d2c] tnum">{short(t.rate)}</div></div>
              <div><div className="text-[#5d7181]">جلسات این ماه</div><div className="font-semibold text-[#041d2c] tnum">{fa(t.done)}</div></div>
              <div><div className="text-[#5d7181]">روزهای کاری</div><div className="font-semibold text-[#041d2c]">{t.days}</div></div>
            </div>
            <div className="mt-4 rounded-xl bg-[#f4f7f9] p-3 flex items-center justify-between">
              <div><div className="text-[14px] text-[#5d7181]">مانده طلب</div><div className="font-display text-[24px] text-[#06314e] tnum leading-tight">{toman(owed)}</div></div>
              <Btn v="brass" className="h-9 px-3">ثبت واریز</Btn>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------------- Finance ---------------- */
function Finance({ d }) {
  const [tab, setTab] = useState("debt");
  const mob = d === "mobile";
  const debtors = MEMBERS.filter((m) => debt(m) > 0);
  const trOwed = TRAINERS.reduce((a, t) => a + t.done * t.rate - t.paid, 0);
  const stats = [["دریافتی مهر", 29100000, "#06314e"], ["مطالبات از اعضا", debtors.reduce((a, m) => a + debt(m), 0), "#a8381f"], ["بدهی به مربیان", trOwed, "#a97f2f"]];
  const Ledger = (
    <Card className="p-5">
      <H>آخرین تراکنش‌ها</H>
      <div className="mt-2">
        {PAYMENTS.map((p, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-[#f0f3f6] last:border-0">
            <span className={`h-9 w-9 rounded-full grid place-items-center text-[16px] font-bold ${p.in ? "bg-[#eaf3ec] text-[#22603a]" : "bg-[#fbf6e6] text-[#a97f2f]"}`}>{p.in ? "+" : "−"}</span>
            <div className="flex-1 min-w-0"><div className="font-semibold text-[#041d2c] truncate">{p.who}</div><div className="text-[14px] text-[#5d7181]">{p.d} · {p.how}</div></div>
            <span className={`tnum font-bold text-[15px] ${p.in ? "text-[#22603a]" : "text-[#a97f2f]"}`}>{short(p.amt)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
  const Debtors = (
    <Card className="p-5">
      <H sub="بیشترین بدهی بالاتر">بدهکاران</H>
      <div className="mt-2">
        {debtors.sort((a, b) => debt(b) - debt(a)).map((m) => (
          <div key={m.id} className="flex items-center gap-3 py-3 border-b border-[#f0f3f6] last:border-0">
            <Avatar name={m.m} size={36} />
            <div className="flex-1 min-w-0"><div className="font-semibold text-[#041d2c]">{m.m}</div><div className="h-1.5 mt-1.5 rounded-full bg-[#eef2f5] overflow-hidden"><div className="h-full bg-[#06314e]" style={{ width: `${(m.paid / m.price) * 100}%` }} /></div></div>
            <span className="tnum font-bold text-[#a8381f] text-[15px] w-20 text-left">{short(debt(m))}</span>
            {!mob && <Btn v="ghost" className="h-9 px-3">ثبت پرداخت</Btn>}
          </div>
        ))}
      </div>
    </Card>
  );
  return (
    <div className="space-y-4">
      <div className={`grid ${mob ? "grid-cols-1" : "grid-cols-3"} gap-4`}>
        {stats.map(([l, v, c]) => (
          <Card key={l} className={`p-5 ${mob ? "flex items-center justify-between py-4" : ""}`}><div className="text-[14px] text-[#5d7181]">{l}</div><div className={`font-display tnum leading-tight ${mob ? "text-[26px]" : "text-[34px] mt-1"}`} style={{ color: c }}>{short(v)} <span className="text-[16px] text-[#6b7d8a]">تومان</span></div></Card>
        ))}
      </div>
      {d === "desktop" ? <div className="grid grid-cols-2 gap-4 items-start">{Debtors}{Ledger}</div> : (
        <><Seg full value={tab} onChange={setTab} items={[["debt", "بدهکاران"], ["led", "تراکنش‌ها"]]} />{tab === "debt" ? Debtors : Ledger}</>
      )}
    </div>
  );
}

/* ---------------- Reports ---------------- */
const LOG = [
  ["مهسا فتحی", "sara", "اسکات گابلت ۳×۱۲، لانج ۳×۱۰، پلانک"],
  ["بهراد شریفی", "ali", "ددلیفت ۴×۵ با ۹۰، زیربغل ۳×۱۰"],
  ["شیما رستمی", "mahdi", "دوچرخه ۲۰ دقیقه، حرکات اصلاحی کمر"],
  ["پارسا موسوی", "ali", "پرس سینه ۳×۸ با ۶۰، پرس سرشانه ۳×۱۰"],
];
function Reports({ d }) {
  const [tab, setTab] = useState("week");
  const mob = d === "mobile";
  const max = Math.max(...WEEK.map((w) => w.n), GYM.capacity);
  return (
    <div className="space-y-4">
      <div className={mob ? "overflow-x-auto no-scrollbar -mx-4 px-4" : ""}><Seg value={tab} onChange={setTab} items={[["week", "خلاصه هفتگی"], ["ex", "تمرینات امروز"], ["pay", "دستمزد مربیان"]]} /></div>
      {tab === "week" && (
        <Card className="p-5">
          <H sub="تعداد مراجعه در هر روز نسبت به ظرفیت ۳۰ نفر">مراجعه این هفته</H>
          <div className={`mt-6 flex items-end ${mob ? "gap-2 h-44" : "gap-4 h-64"}`}>
            {WEEK.map((w) => (
              <div key={w.d} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
                <span className="text-[14px] font-bold text-[#041d2c] tnum">{w.n ? fa(w.n) : ""}</span>
                <motion.div initial={{ height: 0 }} animate={{ height: `${(w.n / max) * 100}%` }} transition={{ duration: 0.6 }} className={`w-full rounded-t-lg ${w.today ? "bg-[#d1b252]" : "bg-[#06314e]"}`} />
                {!w.n && <div className="w-full h-1 rounded bg-[#eef2f5]" />}
                <span className={`text-[14px] ${w.today ? "font-bold text-[#a97f2f]" : "text-[#5d7181]"}`}>{mob ? w.d[0] : w.d}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 pt-4 border-t border-[#eef2f5]">
            {[["کل مراجعه", fa(87)], ["میانگین روزانه", fa(22)], ["غیبت", fa(3)]].map(([l, v]) => <div key={l}><div className="text-[14px] text-[#5d7181]">{l}</div><div className="font-display text-[26px] text-[#06314e]">{v}</div></div>)}
          </div>
        </Card>
      )}
      {tab === "ex" && (
        <Card className="p-5">
          <H sub="کدام ورزشکار، چه تمرینی، با کدام مربی">گزارش تمرینات امروز</H>
          <div className="mt-2">
            {LOG.map(([m, t, ex]) => (
              <div key={m} className={`py-3 border-b border-[#f0f3f6] last:border-0 ${mob ? "" : "grid grid-cols-[180px_140px_1fr] gap-4 items-center"}`}>
                <div className="font-semibold text-[#041d2c]">{m}</div>
                <div className="text-[14px] text-[#5d7181]">{tName(t)}</div>
                <div className="text-[15px] text-[#24323d] mt-1">{ex}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {tab === "pay" && (
        <Card className="p-5">
          <H sub="مهر ۱۴۰۵">کارکرد و طلب مربیان</H>
          <div className="mt-2">
            {TRAINERS.map((t) => (
              <div key={t.id} className="py-3 border-b border-[#f0f3f6] last:border-0">
                <div className="flex justify-between"><span className="font-semibold text-[#041d2c]">{t.name}</span><span className="tnum font-bold text-[#a97f2f]">{short(t.done * t.rate - t.paid)}</span></div>
                <div className="text-[14px] text-[#5d7181] tnum mt-0.5">{fa(t.done)} جلسه × {short(t.rate)} = {short(t.done * t.rate)} · پرداخت‌شده {short(t.paid)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ---------------- Settings ---------------- */
const Row = ({ l, s, children, mob }) => (
  <div className={`py-4 border-b border-[#f0f3f6] last:border-0 flex ${mob ? "flex-col gap-3" : "items-center justify-between gap-6"}`}>
    <div><div className="font-semibold text-[#041d2c]">{l}</div>{s && <div className="text-[14px] text-[#5d7181] mt-0.5">{s}</div>}</div>{children}
  </div>
);
const Step = ({ v, set }) => (
  <div className="flex items-center gap-2"><Btn v="soft" className="w-10 px-0" onClick={() => set(v - 1)}><Minus size={16} /></Btn><span className="w-12 text-center font-bold text-[18px] tnum">{fa(v)}</span><Btn v="soft" className="w-10 px-0" onClick={() => set(v + 1)}><Plus size={16} /></Btn></div>
);
const Toggle = ({ v, set }) => (
  <button onClick={() => set(!v)} className={`relative h-7 w-12 rounded-full transition ${v ? "bg-[#06314e]" : "bg-[#c9d3db]"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${v ? "right-6" : "right-1"}`} /></button>
);

function SettingsScr({ d }) {
  const [cap, setCap] = useState(30);
  const [hc, setHc] = useState(6);
  const [ns, setNs] = useState(true);
  const [lang, setLang] = useState("fa");
  const [th, setTh] = useState("light");
  const mob = d === "mobile";
  return (
    <div className={`space-y-4 ${d === "desktop" ? "max-w-3xl" : ""}`}>
      <Card className="px-5 py-1"><div className="pt-4 text-[14px] font-bold text-[#a97f2f]">باشگاه</div>
        <Row mob={mob} l="نام باشگاه"><div className="h-11 px-3 rounded-lg border border-[#d8e1e8] grid items-center min-w-[240px] text-[15px]">{GYM.name}</div></Row>
        <Row mob={mob} l="ظرفیت روزانه" s="حداکثر ورزشکار در یک روز"><Step v={cap} set={setCap} /></Row>
        <Row mob={mob} l="ظرفیت هر ساعت" s="چند نفر هم‌زمان در سالن"><Step v={hc} set={setHc} /></Row>
      </Card>
      <Card className="px-5 py-1"><div className="pt-4 text-[14px] font-bold text-[#a97f2f]">قوانین جلسه</div>
        <Row mob={mob} l="غیبت، جلسه کسر شود" s="اگر ورزشکار بدون اطلاع نیاید"><Toggle v={ns} set={setNs} /></Row>
        <Row mob={mob} l="هشدار پایان بسته" s="وقتی مانده به این عدد برسد"><span className="h-10 px-4 rounded-lg bg-[#fbf3ef] text-[#a8381f] font-bold grid place-items-center">۲ جلسه</span></Row>
      </Card>
      <Card className="px-5 py-1"><div className="pt-4 text-[14px] font-bold text-[#a97f2f]">ظاهر</div>
        <Row mob={mob} l="زبان"><Seg value={lang} onChange={setLang} items={[["fa", "فارسی"], ["en", "English"]]} /></Row>
        <Row mob={mob} l="پوسته"><Seg value={th} onChange={setTh} items={[["light", "روشن"], ["dark", "تیره"], ["auto", "خودکار"]]} /></Row>
      </Card>
      <Card className="px-5 py-1"><div className="pt-4 text-[14px] font-bold text-[#a97f2f]">حساب‌های کاربری</div>
        {[["علی محمدی", "مربی"], ["سارا کریمی", "مربی"], ["مهدی رحیمی", "مربی"]].map(([n, r]) => (
          <div key={n} className="py-3 border-b border-[#f0f3f6] last:border-0 flex items-center gap-3"><Avatar name={n} size={36} /><span className="flex-1 font-semibold text-[#041d2c]">{n}</span><span className="text-[14px] text-[#5d7181]">{r}</span></div>
        ))}
        <div className="py-3"><Btn v="ghost"><Plus size={16} />دعوت کاربر</Btn></div>
      </Card>
    </div>
  );
}
