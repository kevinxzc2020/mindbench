import type { Metadata } from "next";
import { CollectionHub } from "@/components/CollectionHub";

export const metadata: Metadata = { title: "Collections | MindBench", description: "Browse MindBench collections: cognitive tests, device tools, official resources, sound, personality and games." };

export default function CollectionsPage() { return <CollectionHub directoryOnly />; }
