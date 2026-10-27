import Link from "next/link";
import { Instagram, Twitter } from "lucide-react";

const linkCls = "text-white/70 hover:text-white hover:text-orange-600 transition-colors";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#0f0f0f] text-white font-sans w-full">
      <div className="h-px bg-gradient-to-r from-transparent via-orange-600 to-transparent" />
      <div className="max-w-[1400px] mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-24">
          <div className="space-y-8">
            <div className="text-2xl font-black tracking-tighter uppercase">ZUPRANO</div>
            <p className="text-[12px] font-medium text-white/70 leading-relaxed max-w-xs">
              Premium iPhone accessories. Designed with precision. Built to protect. Made in India for the world.
            </p>
            <div className="flex gap-4">
              {[Instagram, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-orange-600 hover:border-orange-600 transition-all hover:scale-110"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[13px] font-bold mb-8 text-orange-600">Shop</h4>
            <ul className="space-y-4 text-[12px] font-medium text-white/70">
              <li><Link href="/shop" className={linkCls}>All Products</Link></li>
              <li><Link href="/shop?category=Transparent%20Covers" className={linkCls}>Transparent Cases</Link></li>
              <li><Link href="/shop?category=Back%20Covers" className={linkCls}>Back Covers</Link></li>
              <li><Link href="/shop?category=Powerbanks" className={linkCls}>Powerbanks</Link></li>
              <li><Link href="/shop?category=Screen%20Protectors" className={linkCls}>Screen Protection</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[13px] font-bold mb-8 text-orange-600">Service</h4>
            <ul className="space-y-4 text-[12px] font-medium text-white/70">
              <li><Link href="/tracking" className={linkCls}>Track Order</Link></li>
              <li><a href="#" className={linkCls}>Returns &amp; Exchange</a></li>
              <li><a href="#" className={linkCls}>Warranty Policy</a></li>
              <li><a href="#" className={linkCls}>Bulk Orders</a></li>
              <li><a href="mailto:support@zuprano.com" className={linkCls}>Email Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[13px] font-bold mb-8 text-orange-600">About</h4>
            <ul className="space-y-4 text-[12px] font-medium text-white/70">
              {["Our Story", "Design Philosophy", "Materials & Quality", "Testimonials", "Careers"].map((l) => (
                <li key={l}><a href="#" className={linkCls}>{l}</a></li>
              ))}
            </ul>
          </div>
          <div className="space-y-6">
            <div>
              <h4 className="text-[13px] font-bold mb-6 text-orange-600">Why Choose Us</h4>
              <ul className="space-y-3 text-[12px] text-white/70 font-medium">
                {["Expert Tested", "Lifetime Support", "Premium Quality"].map((l) => (
                  <li key={l} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="h-px bg-white/10 mb-16" />
        <div className="flex flex-col items-start gap-8 md:gap-0 md:flex-row md:justify-between md:items-center">
          <p className="text-[11px] font-medium text-white/60">© {year} Zuprano. All Rights Reserved. Crafted with Precision and Purpose.</p>
          <div className="flex flex-wrap gap-6 md:gap-12 text-[11px] font-medium text-white/60">
            {["Privacy Policy", "Terms of Sale", "Legal Notice", "Compliance"].map((l) => (
              <a key={l} href="#" className="text-white/60 hover:text-orange-600 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
