import { InvoiceDetail } from "@/components/invoice/InvoiceDetail";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <InvoiceDetail id={(await params).id} />;
}
