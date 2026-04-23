import { ShoppingCart, CreditCard, Truck } from "lucide-react";

export default function HowToOrder() {
  const steps = [
    {
      number: 1,
      title: "Pilih Varian & Jumlah",
      description:
        "Pilih varian sambal favorit Anda dan tentukan jumlah yang diinginkan dari berbagai pilihan yang tersedia.",
      icon: ShoppingCart,
    },
    {
      number: 2,
      title: "Checkout & Isi Data",
      description:
        "Lanjutkan ke checkout, isi data diri lengkap, pilih kurir pengiriman, dan metode pembayaran yang Anda inginkan.",
      icon: CreditCard,
    },
    {
      number: 3,
      title: "Pembayaran & Pengiriman",
      description:
        "Transfer pembayaran ke rekening toko atau scan QRIS. Pesanan Anda akan masuk ke WhatsApp kami untuk diproses.",
      icon: Truck,
    },
  ];

  return (
    <section
      id="how-to-order"
      className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Cara Pemesanan
          </h2>
          <p className="text-lg text-gray-600">
            Tiga langkah mudah untuk menikmati sambal premium kami
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-1/2 w-full h-1 bg-gradient-to-r from-red-400 to-transparent transform translate-x-1/2 -z-10"></div>
                )}

                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                  {/* Step Number Circle */}
                  <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Step Number Badge */}
                  <div className="absolute top-4 right-4 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="font-bold text-red-600 text-lg">
                      {step.number}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 bg-blue-50 border border-blue-200 rounded-2xl p-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 mb-2">3 Kurir</p>
              <p className="text-gray-600">Pilih dari JNE, SiCepat, atau J&T</p>
            </div>
            <div className="text-center border-l border-r border-blue-200">
              <p className="text-3xl font-bold text-blue-600 mb-2">2 Metode</p>
              <p className="text-gray-600">Transfer Bank atau QRIS</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 mb-2">24 Jam</p>
              <p className="text-gray-600">Respon cepat dari tim kami</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


