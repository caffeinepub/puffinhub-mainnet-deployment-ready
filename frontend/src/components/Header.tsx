import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Menu, X, User, Wallet, Trophy, MessageCircle } from 'lucide-react';
import { useUnifiedIdentity } from '../hooks/useUnifiedIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import LoginDialog from './LoginDialog';

const PRESET_AVATARS = [
  { id: 0, src: '/assets/generated/nft-puffin-captain-white-bg.dim_200x200.png', label: 'Captain Puffin' },
  { id: 1, src: '/assets/generated/nft-puffin-cool-white-bg.dim_200x200.png', label: 'Cool Puffin' },
  { id: 2, src: '/assets/generated/nft-puffin-royal-white-bg.dim_200x200.png', label: 'Royal Puffin' },
  { id: 3, src: '/assets/generated/nft-puffin-pirate-white-bg.dim_200x200.png', label: 'Pirate Puffin' },
  { id: 4, src: '/assets/generated/nft-puffin-rainbow-white-bg.dim_200x200.png', label: 'Rainbow Puffin' },
  { id: 5, src: '/assets/generated/nft-puffin-wizard-white-bg.dim_200x200.png', label: 'Wizard Puffin' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { clear, loginStatus, identity } = useUnifiedIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';
  const buttonText = loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      setLoginDialogOpen(true);
    }
  };

  const getAvatarUrl = () => {
    if (!userProfile) return null;
    
    if (userProfile.avatarType.__kind__ === 'preset') {
      const presetId = Number(userProfile.avatarType.preset);
      const presetAvatar = PRESET_AVATARS.find(a => a.id === presetId);
      return presetAvatar?.src || PRESET_AVATARS[0].src;
    } else if (userProfile.avatarType.__kind__ === 'custom') {
      return userProfile.avatarType.custom.blob.getDirectURL();
    }
    
    return null;
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/game', label: 'Arcade' },
    { to: '/chat', label: 'Puffin Chat' },
  ];

  return (
    <>
      <header className="relative border-b border-primary/20 bg-gradient-to-r from-background via-primary/5 to-background shadow-lg">
        {/* Wave overlay */}
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
          <img 
            src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
            alt="" 
            className="absolute left-0 top-0 h-full w-full animate-pulse object-cover"
            style={{ animationDuration: '8s' }}
          />
        </div>

        {/* Floating feathers */}
        <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
          <img 
            src="/assets/generated/floating-feathers-transparent.dim_32x32.png" 
            alt="" 
            className="absolute left-[15%] top-[20%] h-6 w-6 animate-bounce"
            style={{ animationDuration: '4s' }}
          />
          <img 
            src="/assets/generated/floating-feathers-transparent.dim_32x32.png" 
            alt="" 
            className="absolute right-[20%] top-[40%] h-5 w-5 animate-bounce"
            style={{ animationDuration: '5s', animationDelay: '1s' }}
          />
        </div>

        <div className="container relative z-10">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-105">
              <img
                src="/assets/generated/puffin-head-logo-transparent.dim_200x200.png"
                alt="PuffinHub"
                className="h-12 w-12"
              />
              <span className="bg-gradient-to-r from-[oklch(0.62_0.18_245)] to-accent bg-clip-text text-2xl font-bold text-transparent">
                PuffinHub
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-8 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-base font-medium text-foreground/80 transition-all hover:text-primary hover:scale-105"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Auth & Profile */}
            <div className="hidden items-center gap-4 md:flex">
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => navigate({ to: '/wallet' })}
                    className="flex items-center gap-2 rounded-full border-2 border-primary/30 bg-primary/10 px-4 py-2 transition-all hover:border-primary/50 hover:bg-primary/20"
                  >
                    <Wallet className="h-5 w-5" />
                    <span className="text-sm font-medium">My Wallet</span>
                  </button>
                  <button
                    onClick={() => navigate({ to: '/rewards' })}
                    className="flex items-center gap-2 rounded-full border-2 border-accent/30 bg-accent/10 px-4 py-2 transition-all hover:border-accent/50 hover:bg-accent/20"
                  >
                    <Trophy className="h-5 w-5" />
                    <span className="text-sm font-medium">Rewards</span>
                  </button>
                  {userProfile && (
                    <button
                      onClick={() => navigate({ to: '/profile' })}
                      className="flex items-center gap-2 rounded-full border-2 border-primary/30 bg-primary/10 px-4 py-2 transition-all hover:border-primary/50 hover:bg-primary/20"
                    >
                      <Avatar className="h-8 w-8 border-2 border-primary/40 shadow-md">
                        <AvatarImage src={getAvatarUrl() || undefined} alt={userProfile.displayName} />
                        <AvatarFallback className="bg-primary/20 text-sm font-bold text-primary">
                          {userProfile.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{userProfile.displayName}</span>
                    </button>
                  )}
                  {!userProfile && (
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 rounded-full border-2 border-primary/30 bg-primary/10 px-4 py-2 transition-all hover:border-primary/50 hover:bg-primary/20"
                    >
                      <User className="h-5 w-5" />
                      <span className="text-sm font-medium">Profile</span>
                    </Link>
                  )}
                </>
              )}
              <Button
                onClick={handleAuth}
                disabled={disabled}
                className="rounded-full bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] px-6 py-2 font-medium shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
              >
                {buttonText}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 transition-colors hover:bg-primary/10 md:hidden"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="border-t border-primary/20 py-4 md:hidden">
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-foreground/80 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
                {isAuthenticated && (
                  <>
                    <Link
                      to="/wallet"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-base font-medium text-foreground/80 transition-colors hover:text-primary"
                    >
                      <Wallet className="h-5 w-5" />
                      <span>My Wallet</span>
                    </Link>
                    <Link
                      to="/rewards"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-base font-medium text-foreground/80 transition-colors hover:text-primary"
                    >
                      <Trophy className="h-5 w-5" />
                      <span>Rewards</span>
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-base font-medium text-foreground/80 transition-colors hover:text-primary"
                    >
                      {userProfile ? (
                        <>
                          <Avatar className="h-6 w-6 border-2 border-primary/40 shadow-sm">
                            <AvatarImage src={getAvatarUrl() || undefined} alt={userProfile.displayName} />
                            <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
                              {userProfile.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{userProfile.displayName}</span>
                        </>
                      ) : (
                        <>
                          <User className="h-5 w-5" />
                          <span>Profile</span>
                        </>
                      )}
                    </Link>
                  </>
                )}
                <Button
                  onClick={() => {
                    handleAuth();
                    setMobileMenuOpen(false);
                  }}
                  disabled={disabled}
                  className="w-full rounded-full bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] font-medium shadow-lg"
                >
                  {buttonText}
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
    </>
  );
}
