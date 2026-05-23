'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { getOrderById, type Order } from '@/lib/api/orders';
import { getShopInfo, type ShopInfo } from '@/lib/api/shop';
import { getMemberById, type Member } from '@/lib/api/members';
import ReceiptLayout from '@/components/receipt/ReceiptLayout';
import ShareReceiptButton from '@/components/receipt/ShareReceiptButton';
import '@/components/receipt/receipt-print.css';

export default function MobileReceiptPrintPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [orderId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderData, shopData] = await Promise.all([
        getOrderById(orderId),
        getShopInfo(),
      ]);
      setOrder(orderData);
      setShop(shopData);

      if (orderData.member?.id) {
        try {
          const memberData = await getMemberById(orderData.member.id);
          setMember(memberData);
        } catch {}
      }
    } catch (error) {
      console.error('Failed to load receipt data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!order || !shop) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b p-3 flex items-center gap-2 no-print">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 hover:bg-accent rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-medium">小票</span>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-destructive">订单或门店信息不存在</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b p-3 flex items-center justify-between z-10 no-print">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 hover:bg-accent rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-medium">小票</span>
        </div>
      </div>

      {/* Receipt Content */}
      <div className="flex justify-center mt-3">
        <ReceiptLayout
          shop={shop}
          order={order}
          thermalWidth="80mm"
          memberBalance={member ? {
            principal: member.principalBalance,
            gift: member.giftBalance,
          } : undefined}
          memberPassCards={member?.passCards?.filter(pc => pc.isActive && pc.remainingTimes > 0).map(pc => ({
            name: pc.name,
            remainingTimes: pc.remainingTimes,
          }))}
        />
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-3 flex gap-2 z-30 no-print">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-md text-sm font-medium"
        >
          <Printer className="w-4 h-4" />
          打印
        </button>
        <ShareReceiptButton
          orderNo={order.orderNo}
          shopName={shop.name}
          variant="primary"
          className="flex-1 py-2.5 rounded-md"
        />
      </div>
    </div>
  );
}
