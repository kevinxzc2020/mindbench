import type { Localized } from "./collections";

const words = (en: string, zh: string, es: string): Localized => ({ en, zh, es });
export interface DriverResource {
  id: string;
  title: Localized;
  description: Localized;
  kind: "downloads" | "software" | "firmware" | "support";
  url: string;
  sourceTitle: string;
  sourceUpdated?: string;
  related?: { label: Localized; url: string }[];
}
export interface DriverDevice {
  brand: string;
  brandName: Localized;
  slug: string;
  name: string;
  modelCode: string;
  category: "mouse" | "keyboard" | "audio" | "controller" | "display";
  description: Localized;
  keywords: string[];
  reviewedAt: string;
  officialHosts: string[];
  resources: DriverResource[];
  tests: { href: string; label: Localized }[];
}

// Add model-specific, source-reviewed records here; generic software is not a model match.
export const DRIVER_DEVICES: readonly DriverDevice[] = [{
  brand: "razer", brandName: words("Razer", "Razer 雷蛇", "Razer"), slug: "viper-v2-pro", name: "Viper V2 Pro", modelCode: "RZ01-04390", category: "mouse",
  description: words("Official software, firmware and setup resources for your Viper V2 Pro.", "找到 Viper V2 Pro 对应的官方配置软件、固件与使用资料。", "Software, firmware y ayuda oficial para tu Viper V2 Pro."),
  keywords: ["Razer", "雷蛇", "Viper V2 Pro", "RZ01-04390", "Synapse", "雷云", "firmware", "固件", "driver", "驱动"],
  reviewedAt: "2026-11-10", officialHosts: ["www.razer.com", "mysupport.razer.com"],
  resources: [
    { id: "downloads", kind: "downloads", title: words("Official downloads", "官方驱动与工具目录", "Descargas oficiales"),
      description: words("The model-specific directory for firmware and USB HyperSpeed receiver utilities. Open the matching item to download from Razer.", "该型号的固件与 USB HyperSpeed 接收器工具目录。进入后选择对应项目，从 Razer 官方下载。", "Directorio de firmware y utilidades del receptor USB HyperSpeed para este modelo. Elige el recurso correspondiente en Razer."),
      url: "https://mysupport.razer.com/app/answers/detail/a_id/6385", sourceTitle: "Razer Viper V2 Pro | RZ01-04390 Drivers & Downloads", sourceUpdated: "2026-08-11",
      related: [{ label: words("USB HyperSpeed receiver utility", "USB HyperSpeed 接收器工具", "Utilidad del receptor USB HyperSpeed"), url: "https://mysupport.razer.com/app/answers/detail/a_id/6188#usb-hs-dongle-utility" }] },
    { id: "synapse", kind: "software", title: words("Razer Synapse", "Razer Synapse 配置软件", "Razer Synapse"),
      description: words("Open Razer's configuration software page. Check the current supported-device list and system requirements before choosing an installer.", "打开 Razer 官方配置软件页面，下载前查看当前设备兼容列表与系统要求。", "Abre el software de configuración de Razer. Comprueba dispositivos compatibles y requisitos antes de elegir el instalador."),
      url: "https://www.razer.com/synapse-4", sourceTitle: "Razer Synapse · official software page",
      related: [
        { label: words("Supported devices", "设备兼容列表", "Dispositivos compatibles"), url: "https://mysupport.razer.com/app/answers/detail/a_id/6120" },
        { label: words("Installation & requirements", "安装与系统要求", "Instalación y requisitos"), url: "https://mysupport.razer.com/app/answers/detail/a_id/1834" },
      ] },
    { id: "firmware", kind: "firmware", title: words("Viper V2 Pro firmware", "Viper V2 Pro 固件更新", "Firmware de Viper V2 Pro"),
      description: words("Razer's updater guide for RZ01-04390, with release notes and the download link. Follow the manufacturer's update instructions for your mouse and receiver.", "RZ01-04390 的官方固件更新指南，包含更新说明与下载链接。按厂商步骤更新鼠标和接收器。", "Guía oficial de actualización para RZ01-04390, con notas y enlace de descarga. Sigue los pasos del fabricante para el ratón y receptor."),
      url: "https://mysupport.razer.com/app/answers/detail/a_id/6110", sourceTitle: "Razer Viper V2 Pro Firmware Updater | RZ01-04390", sourceUpdated: "2026-08-13" },
    { id: "support", kind: "support", title: words("Setup, manuals & troubleshooting", "使用说明与故障排查", "Manuales y solución de problemas"),
      description: words("The official model page for setup, connection, manuals and common questions.", "该型号的官方支持页，查找连接设置、说明书与常见问题。", "Página oficial del modelo con configuración, conexión, manuales y preguntas frecuentes."),
      url: "https://mysupport.razer.com/app/answers/detail/a_id/6048", sourceTitle: "Razer Viper V2 Pro | RZ01-04390 Support & FAQs", sourceUpdated: "2026-09-09" },
  ],
  tests: [
    { href: "/tools/mouse", label: words("Check mouse buttons & drag", "检查鼠标按键与拖拽", "Probar botones y arrastre") },
    { href: "/tools/wheel", label: words("Check the scroll wheel", "检查鼠标滚轮", "Probar la rueda") },
  ],
}];

export const driverPath = (device: DriverDevice) => `/drivers/${device.brand}/${device.slug}`;
export const getDriverDevice = (brand: string, model: string) => DRIVER_DEVICES.find(d => d.brand === brand && d.slug === model);
const searchable = (value: string) => value.normalize("NFKC").toLowerCase().replace(/[\s\-_.]+/g, "");
export function matchesDriver(device: DriverDevice, query: string) {
  const haystack = searchable([device.name, device.modelCode, device.brand, ...Object.values(device.brandName), ...device.keywords].join(" "));
  return query.trim().split(/\s+/).every(part => haystack.includes(searchable(part)));
}
export function filterDrivers(query: string, brand = "all", category = "all") {
  return DRIVER_DEVICES.filter(d => (brand === "all" || d.brand === brand) && (category === "all" || d.category === category) && matchesDriver(d, query));
}
export function isOfficialDriverUrl(device: DriverDevice, value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && device.officialHosts.includes(url.hostname) && !url.port; } catch { return false; }
}
