'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Ruler } from 'lucide-react';
import { getOrderById, type Order } from '@/lib/api/orders';
import { getShopInfo, type ShopInfo } from '@/lib/api/shop';
import { getMemberById, type Member } from '@/lib/api/members';
import ReceiptLayout from '@/components/receipt/ReceiptLayout';
import ShareReceiptButton from '@/components/receipt/ShareReceiptButton';
import '@/components/receipt/receipt-print.css';

type ThermalWidth = '58mm' | '80mm' | 'full';

export default function AdminReceiptPrintPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [thermalWidth, setThermalWidth] = useState<ThermalWidth>('80mm');

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
      <div className="p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    );
  }

  if (!order || !shop) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6 no-print">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-muted-foreground">打印小票</span>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-destructive">订单或门店信息不存在</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">打印小票</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Thermal Width Toggle */}
          <div className="flex items-center gap-1 border rounded-md p-0.5">
            <Ruler className="h-4 w-4 text-muted-foreground ml-1.5" />
            <button
              type="button"
              onClick={() => setThermalWidth('58mm')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                thermalWidth === '58mm'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              58mm
            </button>
            <button
              type="button"
              onClick={() => setThermalWidth('80mm')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                thermalWidth === '80mm'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              80mm
            </button>
            <button
              type="button"
              onClick={() => setThermalWidth('full')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                thermalWidth === 'full'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              全宽
            </button>
          </div>
          <ShareReceiptButton
            orderNo={order?.orderNo}
            shopName={shop?.name}
            className="px-4 py-2 rounded-md"
          />
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Printer className="h-4 w-4" />
            打印
          </button>
        </div>
      </div>

      {/* Receipt Preview */}
      <div className="flex justify-center">
        <div className="border shadow-sm bg-white">
          <ReceiptLayout
            shop={shop}
            order={order}
            thermalWidth={thermalWidth}
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
      </div>
    </div>
  );
}
