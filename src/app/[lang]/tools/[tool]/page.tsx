import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeviceDiagnostics } from "@/components/device/DeviceDiagnostics";
import { DEVICE_TOOLS } from "@/components/device/diagnostic-copy";
import type { DiagnosticTool } from "@/lib/device-diagnostics";
import { isLang } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { lang: string; tool: string };
export function generateStaticParams(){return Object.keys(DEVICE_TOOLS).map(tool=>({tool}));}
function validTool(tool:string):tool is DiagnosticTool{return Object.hasOwn(DEVICE_TOOLS,tool);}
export function generateMetadata({params}:{params:Params}):Metadata {
  return isLang(params.lang)&&validTool(params.tool)?pageMetadata(params.lang,`/tools/${params.tool}`):{};
}
export default function DeviceToolPage({params}:{params:Params}){
  if(!validTool(params.tool))notFound();
  return <DeviceDiagnostics key={params.tool} tool={params.tool}/>;
}
