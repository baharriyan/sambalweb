import axios from "axios";

// Catatan: Gunakan Sandbox Key untuk tahap pengembangan.
// Ganti dengan Production Key saat aplikasi sudah siap meluncur.
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-YOUR_SANDBOX_KEY";
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";
const MIDTRANS_API_URL = MIDTRANS_IS_PRODUCTION 
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";
const MIDTRANS_CORE_API_URL = MIDTRANS_IS_PRODUCTION
  ? "https://api.midtrans.com/v2"
  : "https://api.sandbox.midtrans.com/v2";

/**
 * Mengecek status transaksi di Midtrans
 */
export async function getTransactionStatus(orderNumber: string) {
  const authHeader = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");

  try {
    const response = await axios.get(`${MIDTRANS_CORE_API_URL}/${orderNumber}/status`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("[Midtrans Status Error]", error.response?.data || error.message);
    throw new Error("Gagal mengambil status pembayaran dari Midtrans");
  }
}

/**
 * Membuat transaksi di Midtrans untuk mendapatkan Snap Token
 */
export async function createMidtransTransaction(orderData: {
  orderNumber: string;
  total: number;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
}) {
  const authHeader = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");

  const payload = {
    transaction_details: {
      order_id: orderData.orderNumber,
      gross_amount: orderData.total,
    },
    customer_details: {
      first_name: orderData.customerName,
      email: orderData.customerEmail,
      phone: orderData.customerPhone,
    },
    credit_card: {
      secure: true,
    },
    usage_limit: 1,
  };

  // Dynamic Simulation Mode Check
  const { getSetting } = await import("./db");
  const systemSettings = await getSetting("system_settings");
  const isSimulationForced = systemSettings?.midtransSimulation ?? true;

  // Demo Mode: Jika Key masih placeholder atau dipaksa dari settings
  if (isSimulationForced || MIDTRANS_SERVER_KEY.includes("YOUR_") || !MIDTRANS_SERVER_KEY || MIDTRANS_SERVER_KEY === "" || MIDTRANS_SERVER_KEY.includes("YOUR_SANDBOX_KEY")) {
    console.warn("[Midtrans] Running in SIMULATION mode.");
    return {
      token: "demo-snap-token-" + Math.random().toString(36).substring(2, 11),
      redirect_url: "#"
    };
  }

  try {
    const response = await axios.post(MIDTRANS_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${authHeader}`,
      },
    });

    return response.data; // Berisi { token, redirect_url }
  } catch (error: any) {
    const errorData = error.response?.data;
    console.error("[Midtrans API Error]", {
      status: error.response?.status,
      data: errorData,
      message: error.message
    });
    
    const errorMessage = errorData?.error_messages?.[0] || 
                        errorData?.message || 
                        "Gagal membuat transaksi ke Midtrans (Cek Server Key)";
    throw new Error(errorMessage);
  }
}
