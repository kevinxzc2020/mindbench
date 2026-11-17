import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CONVERTERS, getConverter } from "@/lib/converters";
import { ConverterWorkbench } from "@/components/converters/Converters";
import { isLang } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { lang: string; tool: string };
export function generateStaticParams() { return CONVERTERS.map(tool => ({ tool: tool.id })); }
export function generateMetadata({ params }: { params: Params }): Metadata { return isLang(params.lang) && getConverter(params.tool) ? pageMetadata(params.lang, `/convert/${params.tool}`) : {}; }
export default function ConverterPage({ params }: { params: Params }) { const tool = getConverter(params.tool); if (!tool) notFound(); return <ConverterWorkbench key={tool.id} id={tool.id}/>; }
