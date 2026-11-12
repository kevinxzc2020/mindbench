import type { Metadata } from "next";
import { ConverterHub } from "@/components/converters/Converters";

export const metadata: Metadata = { title: "File converters — Images, PDF, audio & data | MindBench", description: "Convert images, PDF pages, audio and CSV / JSON files locally in your browser. Choose files, set the output and download." };
export default function ConvertPage() { return <ConverterHub/>; }
