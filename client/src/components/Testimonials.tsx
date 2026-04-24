import { Star, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  comment: string;
  rating: number;
  avatar: string;
}

export default function Testimonials() {
  const { data: testimonialsContent, isLoading } = trpc.settings.get.useQuery({
    key: "testimonials_content",
  });

  const defaultTestimonials: Testimonial[] = [
    {
      id: 1,
      name: "Budi Santoso",
      role: "Pecinta Masakan Pedas",
      comment:
        "Sambal ini benar-benar luar biasa! Rasa yang sempurna, tidak terlalu pedas tapi cukup menggigit. Saya sudah order berkali-kali.",
      rating: 5,
      avatar: "👨",
    },
    {
      id: 2,
      name: "Siti Nurhaliza",
      role: "Chef Rumahan",
      comment:
        "Kualitas bahan-bahannya terlihat jelas. Saya gunakan untuk memasak dan hasilnya sangat memuaskan. Rekomendasi untuk semua!",
      rating: 5,
      avatar: "👩",
    },
    {
      id: 3,
      name: "Ahmad Wijaya",
      role: "Pengusaha Kuliner",
      comment:
        "Sebagai pemilik restoran, saya mencari supplier sambal berkualitas. Ini dia! Konsisten dan enak. Pelanggan saya juga suka.",
      rating: 5,
      avatar: "👨",
    },
  ];

  const testimonials = (testimonialsContent as Testimonial[]) || defaultTestimonials;

  if (isLoading) {
    return (
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="h-12 w-80 mx-auto bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-lg animate-shimmer mb-4" />
            <div className="h-6 w-96 mx-auto bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded animate-shimmer" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 border border-red-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="w-5 h-5 bg-slate-200 rounded" />
                  ))}
                </div>
                <div className="space-y-2 mb-6">
                  <div className="h-4 w-full bg-slate-200 rounded animate-shimmer bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
                  <div className="h-4 w-5/6 bg-slate-200 rounded animate-shimmer bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
                  <div className="h-4 w-3/4 bg-slate-200 rounded animate-shimmer bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full" />
                  <div>
                    <div className="h-4 w-24 bg-slate-200 rounded mb-1" />
                    <div className="h-3 w-16 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Apa Kata Pelanggan Kami
          </h2>
          <p className="text-lg text-gray-600">
            Ribuan pelanggan puas telah merasakan kualitas sambal premium kami
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map(testimonial => (
            <div
              key={testimonial.id}
              className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 border border-red-100 hover:shadow-lg transition-shadow"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Comment */}
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "{testimonial.comment}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="text-4xl">{testimonial.avatar}</div>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-4 md:gap-8 text-center">
          <div>
            <p className="text-4xl md:text-5xl font-bold text-red-600">1000+</p>
            <p className="text-gray-600 mt-2">Pelanggan Puas</p>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-bold text-red-600">4.9★</p>
            <p className="text-gray-600 mt-2">Rating Rata-rata</p>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-bold text-red-600">5000+</p>
            <p className="text-gray-600 mt-2">Pesanan Terpenuhi</p>
          </div>
        </div>
      </div>
    </section>
  );
}


