import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CONVERTERS, getConverter } from "@/lib/converters";
import { ConverterWorkbench } from "@/components/converters/Converters";

export function generateStaticParams() { return CONVERTERS.map(tool => ({ tool: tool.id })); }
export function generateMetadata({ params }: { params: { tool: string } }): Metadata { const tool = getConverter(params.tool); return tool ? { title: `${tool.title.en} | MindBench`, description: tool.description.en } : { title: "Converter not found | MindBench" }; }
export default function ConverterPage({ params }: { params: { tool: string } }) { const tool = getConverter(params.tool); if (!tool) notFound(); return <ConverterWorkbench key={tool.id} id={tool.id}/>; }
