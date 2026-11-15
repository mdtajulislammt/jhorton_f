import Link from 'next/link';
import { Sparkles, ShoppingBag, ShieldCheck, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-12 lg:p-24 bg-background">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-body text-sm flex">
        <div className="flex items-center gap-2">
          <span className="font-heading text-2xl tracking-tight text-owtlet-ink">Owtlet™</span>
          <Badge variant="outline" className="border-owtlet-ink text-owtlet-ink text-xs font-semibold">
            21+ NY Adult-Use
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/api/health">
            <Button variant="ghost" size="sm">
              System Health
            </Button>
          </Link>
          <Link href="/shop">
            <Button variant="default" size="sm" className="bg-owtlet-mint text-owtlet-ink hover:bg-owtlet-volt font-semibold">
              Enter Storefront
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center my-16 text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-owtlet-mint/20 border border-owtlet-mint text-owtlet-ink text-sm font-semibold mb-6">
          <Sparkles className="h-4 w-4 text-owtlet-ink" />
          <span>Live Shopping for Legal Cannabis</span>
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight text-owtlet-ink mb-6">
          Curated Drops.<br />
          <span className="text-owtlet-mint bg-owtlet-ink px-3 py-1 rounded-lg inline-block mt-2">
            Live from NY.
          </span>
        </h1>

        <p className="font-body text-lg sm:text-xl text-owtlet-ink/80 max-w-2xl mb-8">
          Join interactive live shows featuring licensed New York brands. Real-time cart reservations, verified inventory, and seamless delivery or pickup handoff to local dispensaries.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/shop">
            <Button size="lg" className="w-full sm:w-auto bg-owtlet-ink text-owtlet-mint hover:bg-owtlet-ink/90 font-semibold px-8 py-6 text-base shadow-lg">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Explore Marketplace
            </Button>
          </Link>
          <Link href="/api/health">
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-owtlet-ink text-owtlet-ink hover:bg-owtlet-sage/30 font-semibold px-8 py-6 text-base">
              Inspect API & Health
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-12">
        <div className="p-6 rounded-2xl border border-owtlet-sage bg-white shadow-sm flex flex-col">
          <div className="h-10 w-10 rounded-xl bg-owtlet-mint/30 flex items-center justify-center text-owtlet-ink mb-4">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-lg text-owtlet-ink mb-2">Live Drops & Replays</h2>
          <p className="text-sm text-owtlet-ink/70">
            Powered by Terrific Live SDK v2. Experience interactive live shows with synchronized in-stream purchasing.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-owtlet-sage bg-white shadow-sm flex flex-col">
          <div className="h-10 w-10 rounded-xl bg-owtlet-mint/30 flex items-center justify-center text-owtlet-ink mb-4">
            <MapPin className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-lg text-owtlet-ink mb-2">Licensed NY Fulfillment</h2>
          <p className="text-sm text-owtlet-ink/70">
            Smart multi-dispensary routing across Manhattan, Brooklyn, Queens, Westchester, and Long Island.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-owtlet-sage bg-white shadow-sm flex flex-col">
          <div className="h-10 w-10 rounded-xl bg-owtlet-mint/30 flex items-center justify-center text-owtlet-ink mb-4">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-lg text-owtlet-ink mb-2">21+ Zero-ID Compliance</h2>
          <p className="text-sm text-owtlet-ink/70">
            Strict age verification without storing personal identification or payment details on Owtlet servers.
          </p>
        </div>
      </div>
    </main>
  );
}

