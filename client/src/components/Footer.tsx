import { Link } from "wouter";
import { Mail, Phone, Instagram, Facebook } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-bold text-white text-lg">
                Sambal Premium
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Sambal berkualitas premium dibuat dengan bahan pilihan terbaik dan
              cinta untuk keluarga Indonesia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-4">Navigasi</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/">
                  <a className="hover:text-red-400 transition-colors">
                    Beranda
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/catalog">
                  <a className="hover:text-red-400 transition-colors">Produk</a>
                </Link>
              </li>
              <li>
                <a
                  href="#how-to-order"
                  className="hover:text-red-400 transition-colors"
                >
                  Cara Pesan
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-red-400 transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white mb-4">Hubungi Kami</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-400" />
                <a
                  href="mailto:info@sambalpremium.com"
                  className="hover:text-red-400 transition-colors"
                >
                  info@sambalpremium.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-400" />
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-red-400 transition-colors"
                >
                  +62 812-3456-7890
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="font-bold text-white mb-4">Ikuti Kami</h4>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/sambalpremium"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com/sambalpremium"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://tiktok.com/@sambalpremium"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <span className="text-sm font-bold">TT</span>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Payment Methods */}
            <div>
              <h4 className="font-bold text-white mb-3 text-sm">
                Metode Pembayaran
              </h4>
              <div className="flex gap-3 flex-wrap">
                <div className="bg-gray-800 px-3 py-1 rounded text-xs">BCA</div>
                <div className="bg-gray-800 px-3 py-1 rounded text-xs">
                  Mandiri
                </div>
                <div className="bg-gray-800 px-3 py-1 rounded text-xs">BNI</div>
                <div className="bg-gray-800 px-3 py-1 rounded text-xs">
                  QRIS
                </div>
              </div>
            </div>

            {/* Shipping Partners */}
            <div>
              <h4 className="font-bold text-white mb-3 text-sm">
                Mitra Pengiriman
              </h4>
              <div className="flex gap-3 flex-wrap">
                <div className="bg-gray-800 px-3 py-1 rounded text-xs">JNE</div>
                <div className="bg-gray-800 px-3 py-1 rounded text-xs">
                  SiCepat
                </div>
                <div className="bg-gray-800 px-3 py-1 rounded text-xs">J&T</div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>
              &copy; {currentYear} Sambal Premium. Semua hak cipta dilindungi.
            </p>
            <p className="mt-2">
              Dibuat dengan ❤️ untuk pecinta sambal Indonesia
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}


