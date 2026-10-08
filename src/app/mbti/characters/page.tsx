"use client";
import Image from "next/image";
import Link from "next/link";
import { MBTI_TYPES } from "@/lib/mbti-data";
import { useLang } from "@/lib/language-context";
import { MBTI_CHARACTER_GROUPS, mbtiCharacterImage, mbtiCharacterAccent } from "@/lib/mbti-characters";
export default function CharactersPage() {
  const { lang } = useLang();
  const labels: Record<string, string> = lang === "zh" ? { purple: "紫系", green: "绿系", blue: "蓝系", yellow: "黄系" } : lang === "es" ? { purple: "Morado", green: "Verde", blue: "Azul", yellow: "Amarillo" } : { purple: "PURPLE", green: "GREEN", blue: "BLUE", yellow: "YELLOW" };
  return <main className="max-w-6xl mx-auto px-4 py-12 space-y-8">
    <header className="space-y-3"><p className="text-orange-400">MINDBENCH / ORIGINAL CHARACTERS</p><h1 className="text-4xl font-bold">{lang === "zh" ? "16 种性格，16 位原创角色" : lang === "es" ? "16 personalidades, 16 personajes originales" : "16 personalities. 16 original characters."}</h1><p className="text-gray-400">{lang === "zh" ? "角色是创意表达，不代表某种性格的固定外貌、性别或职业。" : lang === "es" ? "Los personajes son metáforas creativas, no estereotipos de apariencia, género o profesión." : "Creative metaphors, not fixed stereotypes of appearance, gender or profession."}</p><Link href="/mbti" className="underline">{lang === "zh" ? "开始性格测试" : lang === "es" ? "Hacer el test" : "Take the personality test"} ↗</Link></header>
    {Object.entries(MBTI_CHARACTER_GROUPS).map(([color, types]) => <section key={color} className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: mbtiCharacterAccent(types[0]) }}>{labels[color]} / 04</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{types.map((type) => {
        const character = MBTI_TYPES.find((item) => item.type === type)!;
        return <article key={type} className="border border-white/15 overflow-hidden" style={{ borderTop: `3px solid ${mbtiCharacterAccent(type)}` }}><div className="relative aspect-[4/5]"><Image src={mbtiCharacterImage(type)} alt={`${type} — ${character.nickname[lang]}`} fill className="object-contain p-3" sizes="(max-width: 1024px) 50vw, 25vw" /></div><div className="p-4"><h3 className="font-bold text-xl" style={{ color: mbtiCharacterAccent(type) }}>{type}</h3><p>{character.nickname[lang]}</p><p className="text-sm text-gray-400 mt-2">{character.tagline[lang]}</p></div></article>;
      })}</div>
    </section>)}
  </main>;
}
