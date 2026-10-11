import { useState } from "react";
import { motion } from "motion/react";
import { Home, CalendarDays, Dumbbell, History, Bell, Trophy, Check } from "lucide-react";
import { Card, H, Btn, Seg } from "./ui.jsx";
import { fa } from "./data.js";

const TABS = [["home", Home, "خانه"], ["ses", CalendarDays, "جلسات"], ["ex", Dumbbell, "تمرینات"], ["hist", History, "سوابق"]];

export default function MemberApp() {
  const [tab, setTab] = useState("home");
  return (
    <div className="relative h-full bg-[#f7f9fb] flex flex-col">
      <div className="flex-1 overflow-auto no-scrollbar pb-28">
        {tab === "home" && <MHome go={setTab} />}
        {tab !== "home" && (
          <header className="pt-11 px-4 pb-3 bg-white border-b border-[#dfe6ec]"><div className="text-[14px] text-[#5d7181]">نیلوفر صادقی</div><div className="text-[20px] font-extrabold text-[#041d2c]">{{ ses: "جلسات من", ex: "تمرین امروز", hist: "سوابق و رکوردها" }[tab]}</div></header>
        )}
        <div className="px-4 py-4">
          {tab === "ses" && <MSessions />}
          {tab === "ex" && <MEx />}
          {tab === "hist" && <MHist />}
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
    </div>
  );
}

function MHome({ go }) {
  const total = 12, used = 8, lft = total - used;
  return (
    <>
      <div className="bg-[#06314e] text-white px-5 pt-12 pb-6 rounded-b-[28px]">
        <div className="flex items-center justify-between">
          <div><div className="text-[14px] text-[#c5ddee]">سلام نیلوفر</div><div className="font-display text-[24px] leading-tight">باشگاه آیرون هیون</div></div>
          <div className="h-10 w-10 rounded-full bg-[#0b3d5f] grid place-items-center relative"><Bell size={18} /><span className="absolute top-2 left-2.5 h-2 w-2 rounded-full bg-[#d1b252]" /></div>
        </div>
        <div className="mt-6 flex items-end justify-between">
          <div>
            <div className="text-[14px] text-[#c5ddee]">جلسات باقیمانده</div>
            <div className="font-display text-[68px] leading-[0.85] text-[#d1b252] tnum mt-1">{fa(lft)}</div>
            <div className="text-[14px] text-[#c5ddee] mt-1.5">از {fa(total)} جلسه · تا ۳۰ آبان</div>
          </div>
          <div className="flex gap-[3px]">
            {Array.from({ length: total }, (_, i) => (
              <motion.span key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.1 + i * 0.04 }} style={{ originY: 1 }} className={`w-[8px] h-[78px] rounded-[2px] ${i < lft ? "bg-[#d1b252]" : "bg-[#0b3d5f]"}`} />
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-[#0b3d5f] px-3 py-2.5 text-[14px] text-[#e6eef4] flex justify-between"><span>بدهی بسته</span><b className="tnum">۱٫۵ میلیون تومان</b></div>
      </div>
      <div className="px-4 py-4 space-y-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="text-center w-14"><div className="text-[14px] text-[#5d7181]">پنجشنبه</div><div className="font-display text-[32px] text-[#06314e] leading-none">۱۶</div></div>
          <div className="flex-1 border-r border-[#eef2f5] pr-4"><div className="text-[14px] text-[#a97f2f] font-semibold">نوبت بعدی</div><div className="font-bold text-[#041d2c]">۰۸:۰۰ با سارا کریمی</div></div>
        </Card>
        <Card className="p-4">
          <H action={<button onClick={() => go("ex")} className="text-[14px] font-semibold text-[#18527e]">جزئیات</button>}>آخرین تمرین</H>
          {[["اسکات گابلت", "۳ × ۱۲ · ۱۶ kg"], ["لانج با دمبل", "۳ × ۱۰ · ۱۰ kg"], ["پلانک", "۳ × ۴۵ ثانیه"]].map(([n, d]) => (
            <div key={n} className="flex items-center justify-between py-2.5 border-b border-[#f0f3f6] last:border-0"><span>{n}</span><span className="text-[14px] text-[#5d7181] tnum">{d}</span></div>
          ))}
        </Card>
        <Card className="p-4">
          <div className="flex justify-between"><span className="font-bold text-[#041d2c]">این هفته</span><span className="text-[14px] text-[#5d7181]">۲ مراجعه</span></div>
          <div className="mt-3 flex justify-between">
            {[["ش", 1], ["ی", 0], ["د", 1], ["س", 0], ["چ", 0], ["پ", 2], ["ج", 0]].map(([d, on], i) => (
              <div key={i} className="flex flex-col items-center gap-1.5"><span className={`h-10 w-3 rounded-sm ${on === 1 ? "bg-[#06314e]" : on === 2 ? "bg-[#d1b252]" : "bg-[#eef2f5]"}`} /><span className={`text-[14px] ${i === 3 ? "font-bold text-[#041d2c]" : "text-[#8a99a5]"}`}>{d}</span></div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function MSessions() {
  const [t, setT] = useState("up");
  return (
    <div className="space-y-3">
      <Seg full value={t} onChange={setT} items={[["up", "پیش رو"], ["past", "گذشته"]]} />
      {t === "up" ? (
        <>
          {[["پنجشنبه ۱۶ مهر", "۰۸:۰۰", "سارا کریمی"], ["شنبه ۱۸ مهر", "۰۸:۰۰", "سارا کریمی"]].map(([d, h, tr]) => (
            <Card key={d} className="p-4"><div className="flex justify-between"><span className="font-bold text-[#041d2c]">{d}</span><span className="tnum text-[#06314e] font-bold">{h}</span></div><div className="text-[14px] text-[#5d7181] mt-1">با {tr}</div><div className="mt-3 flex gap-2"><Btn v="soft" className="flex-1">تغییر ساعت</Btn><Btn v="ghost" className="flex-1">لغو نوبت</Btn></div></Card>
          ))}
          <div className="text-[14px] text-[#5d7181] text-center px-6">لغو نوبت تا ۴ ساعت قبل، جلسه‌ای از بسته کم نمی‌کند.</div>
        </>
      ) : (
        <Card className="px-4">{[["دوشنبه ۱۳ مهر", "تکمیل"], ["شنبه ۱۱ مهر", "تکمیل"], ["پنجشنبه ۹ مهر", "غیبت"], ["سه‌شنبه ۷ مهر", "تکمیل"]].map(([d, s]) => <div key={d} className="py-3 border-b border-[#f0f3f6] last:border-0 flex justify-between"><span>{d}</span><span className={`text-[14px] font-semibold ${s === "غیبت" ? "text-[#a8381f]" : "text-[#06314e]"}`}>{s}</span></div>)}</Card>
      )}
    </div>
  );
}

function MEx() {
  const ex = [["اسکات گابلت", "پا", [[12, 14], [12, 16], [12, 16]]], ["لانج با دمبل", "پا", [[10, 10], [10, 10], [10, 10]]], ["پلانک", "شکم", [["۴۵ ث", "-"], ["۴۵ ث", "-"], ["۴۵ ث", "-"]]]];
  return (
    <div className="space-y-3">
      <div className="text-[14px] text-[#5d7181]">ثبت‌شده توسط سارا کریمی · دوشنبه ۱۳ مهر</div>
      {ex.map(([n, p, sets]) => (
        <Card key={n} className="p-4">
          <div className="flex justify-between"><span className="font-bold text-[16px] text-[#041d2c]">{n}</span><span className="text-[14px] text-[#5d7181]">{p}</span></div>
          <div className="mt-3 grid grid-cols-3 gap-2">{sets.map(([r, w], i) => <div key={i} className="rounded-lg bg-[#f4f7f9] py-2 text-center"><div className="text-[14px] text-[#5d7181]">ست {fa(i + 1)}</div><div className="font-bold tnum text-[#041d2c]">{typeof r === "number" ? fa(r) : r}{w !== "-" && <span className="text-[14px] text-[#5d7181] font-normal"> × {fa(w)}kg</span>}</div></div>)}</div>
        </Card>
      ))}
    </div>
  );
}

function MHist() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4"><div className="text-[14px] text-[#5d7181]">کل مراجعه</div><div className="font-display text-[34px] text-[#06314e]">۳۸</div></Card>
        <Card className="p-4"><div className="text-[14px] text-[#5d7181]">میانگین هفتگی</div><div className="font-display text-[34px] text-[#06314e]">۲٫۸</div></Card>
      </div>
      <Card className="p-4">
        <H>رکوردهای شخصی</H>
        {[["اسکات گابلت", "۲۰ kg", "+۴"], ["ددلیفت رومانیایی", "۳۵ kg", "+۵"], ["پلانک", "۹۰ ثانیه", "+۱۵"]].map(([n, v, d]) => (
          <div key={n} className="flex items-center gap-3 py-3 border-b border-[#f0f3f6] last:border-0"><Trophy size={18} className="text-[#a97f2f]" /><span className="flex-1">{n}</span><span className="font-bold tnum text-[#041d2c]">{v}</span><span className="text-[14px] text-[#22603a] tnum w-10 text-left">{d}</span></div>
        ))}
      </Card>
      <Card className="p-4">
        <H sub="وزنه اسکات گابلت در ۸ جلسه اخیر">روند پیشرفت</H>
        <div className="mt-4 flex items-end gap-2 h-28">{[10, 12, 12, 14, 14, 16, 16, 20].map((v, i) => <div key={i} className="flex-1 rounded-t-md bg-[#06314e]" style={{ height: `${(v / 20) * 100}%`, opacity: 0.45 + i * 0.07 }} />)}</div>
      </Card>
    </div>
  );
}
