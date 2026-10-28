import Link from "next/link";
import { Instagram, Twitter } from "lucide-react";
import { categoryHref } from "@/lib/catalog";

const linkCls = "text-white/65 hover:text-orange-500 transition-colors";

const COLUMNS = [
  {
    title: "Mobiles",
    links: ["Apple", "Samsung", "OnePlus", "Redmi", "Google Pixel", "Mobile Phones"].map((n) => ({
      label: n === "Mobile Phones" ? "All Mobiles" : n,
      href: categoryHref(n),
    })),
  },
  {
    title: "Accessories",
    links: ["Chargers & Adapters", "Power Banks", "Earbuds & Headphones", "Smartwatches", "Phone Cases & Covers", "Tempered Glass"].map((n) => ({
      label: n,
      href: categoryHref(n),
    })),
  },
  {
    title: "Help",
    links: [
      { label: "Track Order", href: "/tracking" },
      { label: "My Orders", href: "/account?tab=Orders" },
      { label: "Returns & Exchange", href: "#" },
      { label: "Warranty Policy", href: "#" },
      { label: "Bulk Orders", href: "#" },
      { label: "Email Us", href: "mailto:support@zuprano.com" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#0f0f0f] text-white w-full">
      <div className="h-px bg-gradient-to-r from-transparent via-orange-600 to-transparent" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10 md:gap-12 mb-12 md:mb-16">
          <div className="col-span-2 md:col-span-4 lg:col-span-2 space-y-5">
            <div className="text-2xl font-black tracking-tighter">ZUPRANO</div>
            <p className="text-[13px] text-white/65 leading-relaxed max-w-sm">
              Your mobile store. The latest smartphones from every major brand, plus the chargers, audio and protection to go with them. Genuine
              products, fast delivery across India.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Instagram, label: "Instagram" },
                { Icon: Twitter, label: "Twitter" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center hover:bg-orange-600 hover:border-orange-600 transition-colors"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[13px] font-bold mb-4 md:mb-6 text-orange-500">{col.title}</h4>
              <ul className="space-y-3 text-[13px]">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("/") ? (
                      <Link href={l.href} className={linkCls}>
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className={linkCls}>
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="h-px bg-white/10 mb-8" />
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <p className="text-[12px] text-white/50">© {year} Zuprano. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px]">
            {["Privacy Policy", "Terms of Sale", "Legal Notice"].map((l) => (
              <a key={l} href="#" className="text-white/50 hover:text-orange-500 transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
