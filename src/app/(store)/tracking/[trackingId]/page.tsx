import { TrackingView } from "@/components/store/TrackingView";

export default async function TrackingIdPage({ params }: { params: Promise<{ trackingId: string }> }) {
  const { trackingId } = await params;
  return <TrackingView initialId={decodeURIComponent(trackingId)} />;
}
