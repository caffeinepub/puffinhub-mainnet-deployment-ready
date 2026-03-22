import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gamepad2, Image as ImageIcon, Heart, Users, Sparkles, ExternalLink, Coins, Swords, Castle, MessageCircle } from 'lucide-react';
import { SiX } from 'react-icons/si';

export default function HomePage() {
  return (
    <div className="w-full">
      {/* Meet Puffin Section - Enhanced with Seamless Ocean Integration */}
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Animated wave motion background */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <img 
            src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
            alt="" 
            className="absolute left-0 top-0 h-full w-full animate-pulse object-cover"
            style={{ animationDuration: '6s' }}
          />
          <img 
            src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
            alt="" 
            className="absolute right-0 bottom-0 h-full w-full animate-pulse object-cover opacity-50"
            style={{ animationDuration: '8s', animationDelay: '2s' }}
          />
        </div>

        {/* Floating puffin mascots */}
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
          <img 
            src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
            alt="" 
            className="absolute left-[10%] top-[20%] h-24 w-24 animate-bounce"
            style={{ animationDuration: '5s' }}
          />
          <img 
            src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
            alt="" 
            className="absolute right-[15%] top-[30%] h-32 w-32 animate-bounce"
            style={{ animationDuration: '6s', animationDelay: '1s' }}
          />
          <img 
            src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
            alt="" 
            className="absolute left-[20%] bottom-[25%] h-28 w-28 animate-bounce"
            style={{ animationDuration: '7s', animationDelay: '2s' }}
          />
        </div>

        {/* Soft gradient orbs */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute left-[5%] top-[15%] h-64 w-64 animate-pulse rounded-full bg-[oklch(0.75_0.15_200)] blur-3xl"></div>
          <div className="absolute right-[10%] top-[40%] h-80 w-80 animate-pulse rounded-full bg-[oklch(0.70_0.12_180)] blur-3xl" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute left-[15%] bottom-[20%] h-72 w-72 animate-pulse rounded-full bg-primary/20 blur-3xl" style={{ animationDelay: '3s' }}></div>
        </div>

        <div className="container relative z-10">
          <div className="mx-auto max-w-5xl">
            {/* Logo and Text Layout */}
            <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-center">
              {/* Puffin Mascot - Clean, No Blue Circles */}
              <div className="relative flex-shrink-0">
                <div className="absolute -left-8 -top-8 opacity-30">
                  <img 
                    src="/assets/generated/floating-feathers-collection-transparent.dim_200x100.png" 
                    alt="" 
                    className="h-16 w-auto animate-bounce"
                    style={{ animationDuration: '4s' }}
                  />
                </div>
                <div className="absolute -right-8 -bottom-8 opacity-30">
                  <img 
                    src="/assets/generated/floating-feathers-collection-transparent.dim_200x100.png" 
                    alt="" 
                    className="h-16 w-auto animate-bounce"
                    style={{ animationDuration: '5s', animationDelay: '1s' }}
                  />
                </div>
                {/* Puffin with no blue circles - clean and seamlessly integrated */}
                <div className="relative">
                  {/* Subtle ambient glow matching the ocean theme */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[oklch(0.75_0.15_200)]/20 via-[oklch(0.70_0.12_180)]/15 to-primary/5 blur-2xl"></div>
                  <img 
                    src="/assets/generated/meet-puffin-no-blue-circles.dim_200x200.png" 
                    alt="Puffin Mascot" 
                    className="relative h-48 w-48 sm:h-56 sm:w-56 md:h-64 md:w-64 object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
              
              {/* Text Content */}
              <div className="text-center md:text-left">
                <h1 className="mb-6 bg-gradient-to-r from-[oklch(0.62_0.18_245)] via-[oklch(0.70_0.15_210)] to-accent bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl">
                  Meet <span className="text-primary">Puffin</span>
                </h1>
                <p className="mb-8 text-xl text-muted-foreground md:text-2xl">
                  Your friendly ocean companion! Dive into a world of fun with Puffin, the most adorable mascot around. 
                  Join our community, share amazing moments, and play exciting games with fellow Puffin fans! 🐧
                </p>
                <div className="flex flex-wrap justify-center gap-4 md:justify-start">
                  <Link to="/gallery">
                    <Button size="lg" className="group/btn relative gap-2 overflow-hidden bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/50">
                      <span className="relative z-10 flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        View GIF Gallery
                      </span>
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full"></div>
                    </Button>
                  </Link>
                  <Link to="/game">
                    <Button size="lg" variant="outline" className="gap-2 border-2 border-primary/40 transition-all duration-300 hover:border-primary/60 hover:shadow-lg">
                      <Gamepad2 className="h-5 w-5" />
                      Puffin Arcade
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ICP Bonding Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Animated wave motion background */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <img 
            src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
            alt="" 
            className="absolute left-0 top-0 h-full w-full animate-pulse object-cover"
            style={{ animationDuration: '6s' }}
          />
          <img 
            src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
            alt="" 
            className="absolute right-0 bottom-0 h-full w-full animate-pulse object-cover opacity-50"
            style={{ animationDuration: '8s', animationDelay: '2s' }}
          />
        </div>

        {/* Floating puffin mascots */}
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
          <img 
            src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
            alt="" 
            className="absolute left-[10%] top-[20%] h-24 w-24 animate-bounce"
            style={{ animationDuration: '5s' }}
          />
          <img 
            src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
            alt="" 
            className="absolute right-[15%] top-[30%] h-32 w-32 animate-bounce"
            style={{ animationDuration: '6s', animationDelay: '1s' }}
          />
          <img 
            src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
            alt="" 
            className="absolute left-[20%] bottom-[25%] h-28 w-28 animate-bounce"
            style={{ animationDuration: '7s', animationDelay: '2s' }}
          />
        </div>

        {/* Soft gradient orbs */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute left-[5%] top-[15%] h-64 w-64 animate-pulse rounded-full bg-[oklch(0.75_0.15_200)] blur-3xl"></div>
          <div className="absolute right-[10%] top-[40%] h-80 w-80 animate-pulse rounded-full bg-[oklch(0.70_0.12_180)] blur-3xl" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute left-[15%] bottom-[20%] h-72 w-72 animate-pulse rounded-full bg-primary/20 blur-3xl" style={{ animationDelay: '3s' }}></div>
        </div>

        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl">
            {/* Section Header with Puffin Theme */}
            <div className="mb-16 text-center">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  {/* Animated puffin mascot */}
                  <div className="absolute -left-16 -top-4 hidden md:block">
                    <img 
                      src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
                      alt="" 
                      className="h-20 w-20 animate-bounce"
                      style={{ animationDuration: '4s' }}
                    />
                  </div>
                  <div className="absolute -right-16 -top-4 hidden md:block">
                    <img 
                      src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
                      alt="" 
                      className="h-20 w-20 animate-bounce"
                      style={{ animationDuration: '4.5s', animationDelay: '0.5s' }}
                    />
                  </div>
                  
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/30"></div>
                  <div className="relative rounded-full bg-gradient-to-br from-[oklch(0.75_0.15_200)] to-accent/20 p-5 backdrop-blur-sm shadow-xl">
                    <Coins className="h-12 w-12 text-primary" />
                  </div>
                </div>
              </div>
              <h2 className="mb-4 bg-gradient-to-r from-[oklch(0.62_0.18_245)] via-[oklch(0.70_0.15_210)] to-accent bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
                Puffin Coin ICP Bonding
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
                Join the bonding process and be part of the Puffin coin launch on the Internet Computer! 🌊
              </p>
            </div>

            {/* ICP Bonding Card - Centered */}
            <div className="mx-auto max-w-xl">
              <div className="group relative">
                {/* Puffin-themed card background */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-30">
                  <img 
                    src="/assets/generated/puffin-themed-card-background.dim_400x250.png" 
                    alt="" 
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Animated wave overlay on hover */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <img 
                    src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                    alt="" 
                    className="absolute inset-0 h-full w-full animate-pulse object-cover"
                    style={{ animationDuration: '3s' }}
                  />
                </div>
                
                <Card className="relative overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-[oklch(0.75_0.15_200)]/20 via-background to-primary/5 shadow-xl transition-all duration-300 hover:border-primary/60 hover:shadow-2xl hover:-translate-y-1">
                  {/* Floating feathers decoration */}
                  <div className="absolute right-4 top-4 opacity-30">
                    <img 
                      src="/assets/generated/floating-feathers-collection-transparent.dim_200x100.png" 
                      alt="" 
                      className="h-16 w-auto animate-bounce"
                      style={{ animationDuration: '4s' }}
                    />
                  </div>

                  {/* Animated puffin mascot */}
                  <div className="absolute left-4 bottom-4 opacity-20">
                    <img 
                      src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
                      alt="" 
                      className="h-20 w-20 animate-bounce"
                      style={{ animationDuration: '5s', animationDelay: '1s' }}
                    />
                  </div>

                  <CardHeader className="relative space-y-3 pb-4 text-center pt-8">
                    <div>
                      <CardTitle className="mb-2 text-3xl font-bold text-primary">ICP Bonding</CardTitle>
                      <CardDescription className="text-base font-medium">
                        Bonding now on the Internet Computer
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Stats/Info Box with ocean theme */}
                    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-[oklch(0.75_0.15_200)]/10 to-background p-6 backdrop-blur-sm shadow-inner">
                      <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-primary/15 blur-2xl"></div>
                      
                      {/* Subtle wave decoration */}
                      <div className="absolute bottom-0 left-0 right-0 h-8 opacity-20">
                        <img 
                          src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                          alt="" 
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="relative space-y-2">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-primary">Blockchain</h4>
                        <p className="text-lg font-bold">Internet Computer</p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          Join the ICP bonding phase and secure your Puffin coins on the Internet Computer blockchain. 
                          Be part of the decentralized future! 🐧
                        </p>
                      </div>
                    </div>

                    {/* CTA Button with enhanced effects */}
                    <a 
                      href="https://launch.bob.fun/coin/?id=2959" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button 
                        size="lg" 
                        className="group/btn relative w-full gap-2 overflow-hidden bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] text-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/50"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Join ICP Bonding
                          <ExternalLink className="h-5 w-5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                        </span>
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full"></div>
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Additional Info with puffin charm */}
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-3 backdrop-blur-sm">
                <img 
                  src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
                  alt="" 
                  className="h-8 w-8"
                />
                <p className="text-sm font-medium">
                  🌊 Dive into the bonding phase and become an early supporter of Puffin Coin! 🐧
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Section - Enhanced */}
      <section className="relative overflow-hidden border-y border-border py-8">
        {/* Subtle wave background */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <img 
            src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
            alt="" 
            className="absolute inset-0 h-full w-full animate-pulse object-cover"
            style={{ animationDuration: '8s' }}
          />
        </div>
        
        <div className="container relative z-10">
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 text-center">
            <h3 className="text-lg font-semibold">Follow PuffinHub</h3>
            <a 
              href="https://x.com/PuffinHubx" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center overflow-hidden rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/20"
              aria-label="Follow us on X (Twitter)"
            >
              <SiX className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-500 group-hover:translate-x-full"></div>
            </a>
            <p className="text-sm text-muted-foreground">
              Stay updated with the latest Puffin news and community highlights!
            </p>
          </div>
        </div>
      </section>

      {/* About Section - Enhanced */}
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Animated wave motion background */}
        <div className="absolute inset-0 overflow-hidden opacity-15">
          <img 
            src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
            alt="" 
            className="absolute left-0 top-0 h-full w-full animate-pulse object-cover"
            style={{ animationDuration: '7s' }}
          />
        </div>

        {/* Floating puffin mascots */}
        <div className="absolute inset-0 overflow-hidden opacity-8 pointer-events-none">
          <img 
            src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
            alt="" 
            className="absolute right-[10%] top-[15%] h-20 w-20 animate-bounce"
            style={{ animationDuration: '6s' }}
          />
          <img 
            src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
            alt="" 
            className="absolute left-[15%] bottom-[20%] h-24 w-24 animate-bounce"
            style={{ animationDuration: '7s', animationDelay: '1.5s' }}
          />
        </div>

        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 bg-gradient-to-r from-[oklch(0.62_0.18_245)] via-[oklch(0.70_0.15_210)] to-accent bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              Why Puffin?
            </h2>
            <p className="mb-12 text-lg text-muted-foreground">
              Puffins are charming, loyal, and love to dive deep into the ocean. Just like our mascot, 
              we bring joy, friendship, and fun to everyone who joins our community!
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="group relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1">
                <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <img 
                    src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                    alt="" 
                    className="absolute inset-0 h-full w-full animate-pulse object-cover opacity-20"
                    style={{ animationDuration: '4s' }}
                  />
                </div>
                <CardContent className="relative pt-6">
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-full bg-primary/10 p-4 transition-transform duration-300 group-hover:scale-110">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="mb-2 font-semibold">Community First</h3>
                  <p className="text-sm text-muted-foreground">
                    Built by friends, for friends. Every member of our flock matters!
                  </p>
                </CardContent>
              </Card>
              <Card className="group relative overflow-hidden border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-background transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-1">
                <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <img 
                    src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                    alt="" 
                    className="absolute inset-0 h-full w-full animate-pulse object-cover opacity-20"
                    style={{ animationDuration: '4s', animationDelay: '0.5s' }}
                  />
                </div>
                <CardContent className="relative pt-6">
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-full bg-accent/10 p-4 transition-transform duration-300 group-hover:scale-110">
                      <Heart className="h-8 w-8 text-accent" />
                    </div>
                  </div>
                  <h3 className="mb-2 font-semibold">Fun & Engaging</h3>
                  <p className="text-sm text-muted-foreground">
                    Share memes, play games, and have a blast with fellow Puffin lovers!
                  </p>
                </CardContent>
              </Card>
              <Card className="group relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1">
                <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <img 
                    src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                    alt="" 
                    className="absolute inset-0 h-full w-full animate-pulse object-cover opacity-20"
                    style={{ animationDuration: '4s', animationDelay: '1s' }}
                  />
                </div>
                <CardContent className="relative pt-6">
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-full bg-primary/10 p-4 transition-transform duration-300 group-hover:scale-110">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="mb-2 font-semibold">Interactive</h3>
                  <p className="text-sm text-muted-foreground">
                    Play our puffin arcade and compete with other community members!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced with Game Cards */}
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Animated wave motion background */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <img 
            src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
            alt="" 
            className="absolute left-0 top-0 h-full w-full animate-pulse object-cover"
            style={{ animationDuration: '6s' }}
          />
        </div>

        {/* Soft gradient orbs */}
        <div className="absolute inset-0 overflow-hidden opacity-25">
          <div className="absolute left-[10%] top-[20%] h-64 w-64 animate-pulse rounded-full bg-[oklch(0.75_0.15_200)] blur-3xl"></div>
          <div className="absolute right-[15%] bottom-[25%] h-72 w-72 animate-pulse rounded-full bg-accent/20 blur-3xl" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container relative z-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 bg-gradient-to-r from-[oklch(0.62_0.18_245)] via-[oklch(0.70_0.15_210)] to-accent bg-clip-text text-center text-3xl font-bold text-transparent md:text-4xl">
              Dive Into the Fun!
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
              {/* GIF Gallery Card */}
              <div className="group relative overflow-hidden rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-background p-6 shadow-md transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1">
                <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <img 
                    src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                    alt="" 
                    className="absolute inset-0 h-full w-full animate-pulse object-cover opacity-30"
                    style={{ animationDuration: '3s' }}
                  />
                </div>
                <div className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-3 transition-transform duration-300 group-hover:scale-110">
                      <ImageIcon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">GIF Gallery</h3>
                  </div>
                  <p className="mb-4 text-muted-foreground">
                    Share your favorite Puffin moments! Upload and browse through an amazing collection 
                    of Puffin-themed GIFs created by our community.
                  </p>
                  <Link to="/gallery">
                    <Button variant="outline" className="w-full border-2 border-primary/40 transition-all duration-300 hover:border-primary/60">
                      Explore Gallery
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Puffin Arcade Card */}
              <div className="group relative overflow-hidden rounded-lg border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-background p-6 shadow-md transition-all duration-300 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/20 hover:-translate-y-1">
                <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <img 
                    src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                    alt="" 
                    className="absolute inset-0 h-full w-full animate-pulse object-cover opacity-30"
                    style={{ animationDuration: '3s', animationDelay: '0.5s' }}
                  />
                </div>
                <div className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-full bg-accent/10 p-3 transition-transform duration-300 group-hover:scale-110">
                      <Gamepad2 className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold">Puffin Arcade</h3>
                  </div>
                  <p className="mb-4 text-muted-foreground">
                    Take control of our adorable Puffin! Fly through the ocean, collect fish, 
                    and see how high you can score in these fun arcade games.
                  </p>
                  <Link to="/game">
                    <Button variant="outline" className="w-full border-2 border-accent/40 transition-all duration-300 hover:border-accent/60">
                      Start Playing
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Puffin Colony Wars Card */}
              <div className="group relative overflow-hidden rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-background p-6 shadow-md transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1">
                <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <img 
                    src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                    alt="" 
                    className="absolute inset-0 h-full w-full animate-pulse object-cover opacity-30"
                    style={{ animationDuration: '3s', animationDelay: '1s' }}
                  />
                </div>
                <div className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-3 transition-transform duration-300 group-hover:scale-110">
                      <Swords className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Puffin Colony Wars</h3>
                  </div>
                  <p className="mb-4 text-muted-foreground">
                    Command your puffin colony in epic battles! Build units, upgrade your base, 
                    and defend your nest in this strategic lane-push game.
                  </p>
                  <Link to="/game" search={{ game: 'wars' }}>
                    <Button variant="outline" className="w-full border-2 border-primary/40 transition-all duration-300 hover:border-primary/60">
                      Play Colony Wars
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Puffin Tower Defense Card */}
              <div className="group relative overflow-hidden rounded-lg border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-background p-6 shadow-md transition-all duration-300 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/20 hover:-translate-y-1">
                <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <img 
                    src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                    alt="" 
                    className="absolute inset-0 h-full w-full animate-pulse object-cover opacity-30"
                    style={{ animationDuration: '3s', animationDelay: '1.5s' }}
                  />
                </div>
                <div className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-full bg-accent/10 p-3 transition-transform duration-300 group-hover:scale-110">
                      <Castle className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold">Puffin Tower Defense</h3>
                  </div>
                  <p className="mb-4 text-muted-foreground">
                    Defend your territory from waves of enemies! Place strategic towers, 
                    upgrade defenses, and protect your puffin colony.
                  </p>
                  <Link to="/game" search={{ game: 'tower' }}>
                    <Button variant="outline" className="w-full border-2 border-accent/40 transition-all duration-300 hover:border-accent/60">
                      Play Tower Defense
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Puffin Chat Feature Section */}
      <section className="relative overflow-hidden py-16 md:py-24 border-y border-border">
        {/* Animated wave motion background */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <img 
            src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
            alt="" 
            className="absolute left-0 top-0 h-full w-full animate-pulse object-cover"
            style={{ animationDuration: '6s' }}
          />
        </div>

        {/* Floating puffin mascots */}
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
          <img 
            src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
            alt="" 
            className="absolute left-[12%] top-[25%] h-28 w-28 animate-bounce"
            style={{ animationDuration: '5.5s' }}
          />
          <img 
            src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
            alt="" 
            className="absolute right-[18%] bottom-[30%] h-32 w-32 animate-bounce"
            style={{ animationDuration: '6.5s', animationDelay: '1.5s' }}
          />
        </div>

        {/* Soft gradient orbs */}
        <div className="absolute inset-0 overflow-hidden opacity-25">
          <div className="absolute left-[8%] top-[18%] h-72 w-72 animate-pulse rounded-full bg-[oklch(0.75_0.15_200)] blur-3xl"></div>
          <div className="absolute right-[12%] bottom-[22%] h-80 w-80 animate-pulse rounded-full bg-accent/20 blur-3xl" style={{ animationDelay: '2.5s' }}></div>
        </div>

        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/30"></div>
                  <div className="relative rounded-full bg-gradient-to-br from-[oklch(0.75_0.15_200)] to-accent/20 p-5 backdrop-blur-sm shadow-xl">
                    <MessageCircle className="h-12 w-12 text-primary" />
                  </div>
                </div>
              </div>
              <h2 className="mb-4 bg-gradient-to-r from-[oklch(0.62_0.18_245)] via-[oklch(0.70_0.15_210)] to-accent bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                Chat with Puffin!
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Have a conversation with our friendly Puffin mascot! Ask questions, get advice, 
                or just chat about your day. 🐧💬
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-background p-8 shadow-xl transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:-translate-y-1">
              <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <img 
                  src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                  alt="" 
                  className="absolute inset-0 h-full w-full animate-pulse object-cover opacity-30"
                  style={{ animationDuration: '3s' }}
                />
              </div>

              {/* Large hovering puffin mascot */}
              <div className="relative mb-8 flex justify-center">
                <img 
                  src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
                  alt="Puffin Chat Mascot" 
                  className="h-32 w-32 animate-bounce drop-shadow-2xl"
                  style={{ animationDuration: '3s' }}
                />
              </div>

              <div className="relative text-center space-y-6">
                <p className="text-lg text-muted-foreground">
                  Start a conversation with Puffin and discover helpful tips, fun facts, 
                  and friendly advice from your favorite ocean companion!
                </p>
                
                <Link to="/chat">
                  <Button 
                    size="lg" 
                    className="group/btn relative gap-2 overflow-hidden bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] text-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/50"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Start Chatting
                    </span>
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full"></div>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Animated wave motion background */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <img 
            src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
            alt="" 
            className="absolute left-0 top-0 h-full w-full animate-pulse object-cover"
            style={{ animationDuration: '6s' }}
          />
        </div>

        {/* Floating puffin mascots */}
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
          <img 
            src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
            alt="" 
            className="absolute left-[15%] top-[25%] h-24 w-24 animate-bounce"
            style={{ animationDuration: '5s' }}
          />
          <img 
            src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
            alt="" 
            className="absolute right-[20%] bottom-[30%] h-28 w-28 animate-bounce"
            style={{ animationDuration: '6s', animationDelay: '1s' }}
          />
        </div>

        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 bg-gradient-to-r from-[oklch(0.62_0.18_245)] via-[oklch(0.70_0.15_210)] to-accent bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              Join the Flock!
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Ready to waddle into the world of Puffin? Explore our GIF gallery, play our arcade games, 
              and become part of the friendliest community on the web!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/gallery">
                <Button size="lg" className="group/btn relative gap-2 overflow-hidden bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/50">
                  <span className="relative z-10 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Explore Gallery
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full"></div>
                </Button>
              </Link>
              <Link to="/game">
                <Button size="lg" variant="outline" className="gap-2 border-2 border-primary/40 transition-all duration-300 hover:border-primary/60 hover:shadow-lg">
                  <Gamepad2 className="h-5 w-5" />
                  Start Playing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
