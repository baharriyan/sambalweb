// Accurate Shipping System (Researched Rates 2024/2025)
// Origin: Bandung, Jawa Barat
// Rates are per 1kg (Regular Service)

const shippingRates: Record<
  string,
  { city: string; jne: number; jnt: number; sicepat: number; etd: string }
> = {
  "1": { city: "Bandung", jne: 10000, jnt: 9000, sicepat: 9000, etd: "1-2" }, // Jawa Barat
  "2": { city: "Jakarta", jne: 13000, jnt: 11000, sicepat: 11000, etd: "1-2" }, // DKI Jakarta
  "3": { city: "Serang", jne: 15000, jnt: 13000, sicepat: 13000, etd: "1-2" }, // Banten
  "4": { city: "Semarang", jne: 18000, jnt: 16000, sicepat: 16000, etd: "2-3" }, // Jawa Tengah
  "5": {
    city: "Yogyakarta",
    jne: 18000,
    jnt: 16000,
    sicepat: 16000,
    etd: "2-3",
  }, // DI Yogyakarta
  "6": { city: "Surabaya", jne: 21000, jnt: 18000, sicepat: 18000, etd: "2-3" }, // Jawa Timur
  "7": { city: "Denpasar", jne: 26000, jnt: 21000, sicepat: 29000, etd: "3-4" }, // Bali
  "8": {
    city: "Bandar Lampung",
    jne: 22000,
    jnt: 19000,
    sicepat: 19000,
    etd: "2-3",
  }, // Lampung
  "9": {
    city: "Palembang",
    jne: 25000,
    jnt: 22000,
    sicepat: 25000,
    etd: "3-4",
  }, // Sumatera Selatan
  "10": {
    city: "Bengkulu",
    jne: 30000,
    jnt: 26000,
    sicepat: 28000,
    etd: "3-4",
  }, // Bengkulu
  "11": { city: "Jambi", jne: 32000, jnt: 28000, sicepat: 30000, etd: "3-4" }, // Jambi
  "12": {
    city: "Pekanbaru",
    jne: 35000,
    jnt: 31000,
    sicepat: 33000,
    etd: "3-4",
  }, // Riau
  "13": { city: "Padang", jne: 35000, jnt: 31000, sicepat: 33000, etd: "3-5" }, // Sumatera Barat
  "14": { city: "Medan", jne: 47000, jnt: 33000, sicepat: 33000, etd: "4-5" }, // Sumatera Utara
  "15": {
    city: "Banda Aceh",
    jne: 55000,
    jnt: 45000,
    sicepat: 48000,
    etd: "5-7",
  }, // Aceh
  "16": {
    city: "Pontianak",
    jne: 53000,
    jnt: 38000,
    sicepat: 38000,
    etd: "4-5",
  }, // Kalimantan Barat
  "17": {
    city: "Banjarmasin",
    jne: 50000,
    jnt: 42000,
    sicepat: 45000,
    etd: "4-5",
  }, // Kalimantan Selatan
  "18": {
    city: "Palangkaraya",
    jne: 55000,
    jnt: 48000,
    sicepat: 50000,
    etd: "4-5",
  }, // Kalimantan Tengah
  "19": {
    city: "Samarinda",
    jne: 60000,
    jnt: 52000,
    sicepat: 55000,
    etd: "4-5",
  }, // Kalimantan Timur
  "20": {
    city: "Tanjung Selor",
    jne: 75000,
    jnt: 65000,
    sicepat: 68000,
    etd: "5-7",
  }, // Kalimantan Utara
  "21": {
    city: "Makassar",
    jne: 56000,
    jnt: 49000,
    sicepat: 53000,
    etd: "4-6",
  }, // Sulawesi Selatan
  "22": { city: "Palu", jne: 70000, jnt: 60000, sicepat: 65000, etd: "5-7" }, // Sulawesi Tengah
  "23": { city: "Kendari", jne: 65000, jnt: 55000, sicepat: 60000, etd: "5-7" }, // Sulawesi Tenggara
  "24": { city: "Manado", jne: 80000, jnt: 55000, sicepat: 71800, etd: "5-7" }, // Sulawesi Utara
  "25": { city: "Mamuju", jne: 65000, jnt: 58000, sicepat: 62000, etd: "5-7" }, // Sulawesi Barat
  "26": {
    city: "Gorontalo",
    jne: 75000,
    jnt: 65000,
    sicepat: 70000,
    etd: "5-7",
  }, // Gorontalo
  "27": { city: "Mataram", jne: 35000, jnt: 31000, sicepat: 33000, etd: "3-5" }, // Nusa Tenggara Barat
  "28": { city: "Kupang", jne: 65000, jnt: 55000, sicepat: 60000, etd: "5-7" }, // Nusa Tenggara Timur
  "29": { city: "Ambon", jne: 110000, jnt: 72000, sicepat: 92500, etd: "6-8" }, // Maluku
  "30": {
    city: "Sofifi",
    jne: 115000,
    jnt: 85000,
    sicepat: 100000,
    etd: "7-10",
  }, // Maluku Utara
  "31": {
    city: "Jayapura",
    jne: 144000,
    jnt: 95000,
    sicepat: 121300,
    etd: "7-10",
  }, // Papua
  "32": {
    city: "Manokwari",
    jne: 140000,
    jnt: 90000,
    sicepat: 115000,
    etd: "7-10",
  }, // Papua Barat
  "33": {
    city: "Nabire",
    jne: 150000,
    jnt: 100000,
    sicepat: 130000,
    etd: "7-10",
  }, // Papua Tengah
  "34": {
    city: "Wamena",
    jne: 180000,
    jnt: 130000,
    sicepat: 160000,
    etd: "8-12",
  }, // Papua Pegunungan
  "35": {
    city: "Merauke",
    jne: 160000,
    jnt: 110000,
    sicepat: 140000,
    etd: "8-12",
  }, // Papua Selatan
  "36": {
    city: "Sorong",
    jne: 140000,
    jnt: 95000,
    sicepat: 120000,
    etd: "7-10",
  }, // Papua Barat Daya
  "37": {
    city: "Tanjung Pinang",
    jne: 45000,
    jnt: 38000,
    sicepat: 40000,
    etd: "4-5",
  }, // Kepulauan Riau
  "38": {
    city: "Pangkal Pinang",
    jne: 35000,
    jnt: 31000,
    sicepat: 33000,
    etd: "3-4",
  }, // Kepulauan Bangka Belitung
};

export async function getProvinces() {
  return [
    { id: "1", name: "Jawa Barat" },
    { id: "2", name: "DKI Jakarta" },
    { id: "3", name: "Banten" },
    { id: "4", name: "Jawa Tengah" },
    { id: "5", name: "DI Yogyakarta" },
    { id: "6", name: "Jawa Timur" },
    { id: "7", name: "Bali" },
    { id: "8", name: "Lampung" },
    { id: "9", name: "Sumatera Selatan" },
    { id: "10", name: "Bengkulu" },
    { id: "11", name: "Jambi" },
    { id: "12", name: "Riau" },
    { id: "13", name: "Sumatera Barat" },
    { id: "14", name: "Sumatera Utara" },
    { id: "15", name: "Aceh" },
    { id: "16", name: "Kalimantan Barat" },
    { id: "17", name: "Kalimantan Selatan" },
    { id: "18", name: "Kalimantan Tengah" },
    { id: "19", name: "Kalimantan Timur" },
    { id: "20", name: "Kalimantan Utara" },
    { id: "21", name: "Sulawesi Selatan" },
    { id: "22", name: "Sulawesi Tengah" },
    { id: "23", name: "Sulawesi Tenggara" },
    { id: "24", name: "Sulawesi Utara" },
    { id: "25", name: "Sulawesi Barat" },
    { id: "26", name: "Gorontalo" },
    { id: "27", name: "Nusa Tenggara Barat" },
    { id: "28", name: "Nusa Tenggara Timur" },
    { id: "29", name: "Maluku" },
    { id: "30", name: "Maluku Utara" },
    { id: "31", name: "Papua" },
    { id: "32", name: "Papua Barat" },
    { id: "33", name: "Papua Tengah" },
    { id: "34", name: "Papua Pegunungan" },
    { id: "35", name: "Papua Selatan" },
    { id: "36", name: "Papua Barat Daya" },
    { id: "37", name: "Kepulauan Riau" },
    { id: "38", name: "Kepulauan Bangka Belitung" },
  ];
}

export async function getShippingCost(provinceId: string, courier: string) {
  const rateData = shippingRates[provinceId];
  const { getSetting } = await import("./db");
  const systemSettings = await getSetting("system_settings");

  const packingFee = systemSettings?.packingFee ?? 3000;

  if (!rateData) {
    return {
      service: "Regular Service",
      cost: 25000,
      totalCost: 25000 + packingFee,
      etd: "3-5",
    };
  }

  const courierKey = courier.toLowerCase().replace(/[^a-z]/g, "");
  let cost = rateData.jne;

  if (courierKey === "jnt" || courierKey === "jet") {
    cost = rateData.jnt;
  } else if (courierKey === "sicepat") {
    cost = rateData.sicepat;
  }

  return {
    service: `${courier.toUpperCase()} Regular`,
    cost: cost,
    totalCost: cost + packingFee,
    etd: rateData.etd,
  };
}

