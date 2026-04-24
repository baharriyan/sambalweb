import { getDb, orders, eq, and, updateOrderStatus } from "./db";
import { getTransactionStatus } from "./midtrans";

/**
 * Syncs order status with Midtrans and auto-cancels expired orders (20 min)
 */
export async function syncPendingOrdersWithMidtrans() {
  const db = await getDb();
  if (!db) return;

  const EXPIRY_MINUTES = 20;
  const now = new Date();

  try {
    // 1. Get all pending orders (both Midtrans and Manual)
    const pendingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.status, "PENDING_PAYMENT"));

    if (pendingOrders.length === 0) return;

    console.log(`[PaymentSync] Checking status and expiry for ${pendingOrders.length} pending orders...`);

    for (const order of pendingOrders) {
      try {
        const orderAgeMinutes = (now.getTime() - order.createdAt.getTime()) / (1000 * 60);
        const isExpired = orderAgeMinutes > EXPIRY_MINUTES;

        // Handle Midtrans orders
        if (order.paymentMethod === "MIDTRANS") {
          const midtransStatus = await getTransactionStatus(order.orderNumber);
          const status = midtransStatus.transaction_status;

          if (status === "settlement" || status === "capture") {
            console.log(`[PaymentSync] Order #${order.orderNumber} PAID (status: ${status})`);
            await updateOrderStatus(order.id, "PROCESSING");
          } else if (
            status === "deny" ||
            status === "cancel" ||
            status === "expire" ||
            (isExpired && (status === "pending" || !status))
          ) {
            console.log(`[PaymentSync] Order #${order.orderNumber} CANCELLED/EXPIRED (status: ${status || 'n/a'}, age: ${Math.floor(orderAgeMinutes)}m)`);
            await updateOrderStatus(order.id, "CANCELLED");
          }
        } 
        // Handle Manual Bank Transfer orders
        else if (isExpired) {
          console.log(`[PaymentSync] Manual Order #${order.orderNumber} EXPIRED (age: ${Math.floor(orderAgeMinutes)}m)`);
          await updateOrderStatus(order.id, "CANCELLED");
        }
      } catch (error) {
        console.error(`[PaymentSync] Failed to process order #${order.orderNumber}:`, error);
      }
    }
  } catch (error) {
    console.error("[PaymentSync] Global sync error:", error);
  }
}

/**
 * Initializes a background job to sync payments periodically
 * @param intervalMs Frequency of sync (default 5 minutes)
 */
export function startPaymentSyncJob(intervalMs: number = 5 * 60 * 1000) {
  console.log(`[PaymentSync] Starting background sync job every ${intervalMs / 60000} minutes`);
  
  // Run immediately on start
  syncPendingOrdersWithMidtrans();

  // Then set interval
  setInterval(syncPendingOrdersWithMidtrans, intervalMs);
}
