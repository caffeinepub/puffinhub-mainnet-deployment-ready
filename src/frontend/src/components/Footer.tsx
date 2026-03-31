import { Heart } from "lucide-react";
import { SiX } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border/50">
      {/* Subtle wave overlay */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        <img
          src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png"
          alt=""
          className="absolute inset-0 h-full w-full animate-pulse object-cover"
          style={{ animationDuration: "8s" }}
        />
      </div>

      {/* Floating puffin mascot */}
      <div className="absolute left-[5%] top-1/2 -translate-y-1/2 opacity-5 pointer-events-none hidden md:block">
        <img
          src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png"
          alt=""
          className="h-16 w-16 animate-bounce"
          style={{ animationDuration: "6s" }}
        />
      </div>
      <div className="absolute right-[5%] top-1/2 -translate-y-1/2 opacity-5 pointer-events-none hidden md:block">
        <img
          src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png"
          alt=""
          className="h-16 w-16 animate-bounce"
          style={{ animationDuration: "7s", animationDelay: "1s" }}
        />
      </div>

      <div className="container relative z-10 py-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="relative group">
            <img
              src="/assets/generated/puffin-head-logo-transparent.dim_200x200.png"
              alt="Puffin Head Logo"
              className="h-12 w-12 transition-transform duration-300 group-hover:scale-110"
            />
            {/* Subtle floating feather on hover */}
            <div className="absolute -right-3 -top-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <img
                src="/assets/generated/floating-feathers-collection-transparent.dim_200x100.png"
                alt=""
                className="h-8 w-auto animate-bounce"
                style={{ animationDuration: "3s" }}
              />
            </div>
          </div>

          {/* Social Media Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/PuffinHubx"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center overflow-hidden rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background p-3 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/20"
              aria-label="Follow us on X (Twitter)"
            >
              <SiX className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </a>
            <a
              href="https://oc.app/community/sueba-tqaaa-aaaac-babfa-cai/channel/1373436639"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center overflow-hidden rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background p-3 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/20"
              aria-label="Join our OpenChat community"
            >
              <img
                src="https://dgegb-daaaa-aaaar-arlhq-cai.raw.icp0.io/channel/929600264/avatar/185548481436590558332865743606895345664"
                alt="OpenChat"
                className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </a>
          </div>

          <p className="text-sm text-muted-foreground">
            © 2025. Built with{" "}
            <Heart className="inline h-4 w-4 text-accent" fill="currentColor" />{" "}
            using{" "}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary transition-colors hover:text-primary/80 hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
