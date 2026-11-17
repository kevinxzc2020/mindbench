import { ConverterHub } from "@/components/converters/Converters";
import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata("/convert");
export default function ConvertPage() { return <ConverterHub/>; }
