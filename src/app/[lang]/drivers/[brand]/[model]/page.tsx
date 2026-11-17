import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DRIVER_DEVICES, driverPath, getDriverDevice } from "@/lib/driver-library";
import { DriverModel } from "@/components/drivers/DriverLibrary";
import { AdSenseBanner } from "@/components/AdSenseBanner";
import { isLang } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { lang: string; brand: string; model: string };
export function generateStaticParams() { return DRIVER_DEVICES.map(device => ({ brand: device.brand, model: device.slug })); }
export function generateMetadata({ params }: { params: Params }): Metadata {
  const device = getDriverDevice(params.brand, params.model);
  return device && isLang(params.lang) ? pageMetadata(params.lang, driverPath(device)) : {};
}
export default function DriverPage({ params }: { params: Params }) {
  const device = getDriverDevice(params.brand, params.model);
  if (!device) notFound();
  return <><DriverModel device={device}/><div style={{ maxWidth: 1180, margin: "0 auto 48px", padding: "0 24px" }}><AdSenseBanner placement="content"/></div></>;
}
