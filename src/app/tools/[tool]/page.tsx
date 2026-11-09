import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeviceDiagnostics } from "@/components/device/DeviceDiagnostics";
import { DEVICE_TOOLS } from "@/components/device/diagnostic-copy";
import type { DiagnosticTool } from "@/lib/device-diagnostics";

export function generateStaticParams(){return Object.keys(DEVICE_TOOLS).map(tool=>({tool}));}
function validTool(tool:string):tool is DiagnosticTool{return Object.hasOwn(DEVICE_TOOLS,tool);}
export function generateMetadata({params}:{params:{tool:string}}):Metadata {
  if(!validTool(params.tool))return {title:"Tool not found | MindBench"};
  return {title:`${DEVICE_TOOLS[params.tool].title[0]} | MindBench`,description:DEVICE_TOOLS[params.tool].intro[0]};
}
export default function DeviceToolPage({params}:{params:{tool:string}}){
  if(!validTool(params.tool))notFound();
  return <DeviceDiagnostics key={params.tool} tool={params.tool}/>;
}
