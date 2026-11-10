import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DRIVER_DEVICES, getDriverDevice } from "@/lib/driver-library";
import { DriverModel } from "@/components/drivers/DriverLibrary";

type Params = { brand: string; model: string };
export function generateStaticParams() { return DRIVER_DEVICES.map(device => ({ brand: device.brand, model: device.slug })); }
export function generateMetadata({ params }: { params: Params }): Metadata {
  const device = getDriverDevice(params.brand, params.model);
  return device ? { title: `${device.brandName.en} ${device.name} — official downloads | MindBench`, description: device.description.en } : {};
}
export default function DriverPage({ params }: { params: Params }) {
  const device = getDriverDevice(params.brand, params.model);
  if (!device) notFound();
  return <DriverModel device={device}/>;
}
