import { Receipt } from "@/components/payment/Receipt";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <Receipt id={(await params).id} />;
}
