import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export default function FAQ() {
  const { data: faqContent, isLoading } = trpc.settings.get.useQuery({
    key: "faq_content",
  });
  const { data: contactInfo } = trpc.settings.get.useQuery({
    key: "contact_info",
  });

  const [openId, setOpenId] = useState<number | null>(null);

  const defaultFAQS: FAQItem[] = [
    {
      id: 1,
      question: "Berapa lama sambal dapat bertahan?",
      answer:
        "Sambal premium kami dapat bertahan hingga 3 bulan jika disimpan di tempat yang sejuk dan kering. Setelah dibuka, lebih baik disimpan di kulkas dan habiskan dalam 1 bulan untuk hasil terbaik.",
    },
    {
      id: 2,
      question: "Apakah sambal ini mengandung pengawet?",
      answer:
        "Tidak! Semua produk kami 100% bahan alami tanpa pengawet buatan. Kami hanya menggunakan bahan-bahan segar pilihan dan proses tradisional yang aman.",
    },
    {
      id: 3,
      question: "Bagaimana cara pengiriman?",
      answer:
        "Kami bekerja sama dengan 3 kurir terpercaya: JNE, SiCepat, dan J&T. Anda bisa memilih kurir favorit saat checkout. Pengiriman biasanya 1-3 hari kerja tergantung lokasi.",
    },
    {
      id: 4,
      question: "Apakah produk halal?",
      answer:
        "Ya, semua produk kami telah tersertifikasi halal. Kami sangat memperhatikan setiap aspek produksi untuk memastikan kehalalan produk.",
    },
    {
      id: 5,
      question: "Apa metode pembayaran yang tersedia?",
      answer:
        "Kami menerima transfer bank (BCA, Mandiri, BNI) dan pembayaran via QRIS. Semua metode pembayaran aman dan terpercaya.",
    },
    {
      id: 6,
      question: "Bagaimana jika produk rusak saat pengiriman?",
      answer:
        "Jika produk rusak atau tidak sesuai, hubungi kami melalui WhatsApp dengan foto bukti. Kami akan mengganti produk Anda tanpa biaya tambahan.",
    },
  ];

  const faqs = (faqContent as FAQItem[]) || defaultFAQS;
  const whatsappNumber = (contactInfo as any)?.whatsapp || "6281234567890";

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <section
      id="faq"
      className="py-20 px-4 bg-gradient-to-b from-white to-gray-50"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Pertanyaan Umum
          </h2>
          <p className="text-lg text-gray-600">
            Temukan jawaban untuk pertanyaan yang sering diajukan
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map(faq => (
            <div
              key={faq.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-red-300 transition-colors"
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900 text-left">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-red-600 flex-shrink-0 transition-transform duration-300 ${
                    openId === faq.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openId === faq.id && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Masih ada pertanyaan?</h3>
          <p className="mb-4">
            Hubungi kami melalui WhatsApp untuk bantuan lebih lanjut
          </p>
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-red-600 font-semibold px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Chat di WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}


