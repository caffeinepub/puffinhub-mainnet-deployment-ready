import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface GiphyGif {
  id: string;
  images: {
    original: {
      url: string;
    };
  };
  title: string;
}

export default function GiphyFeed() {
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  const GIPHY_API_KEY = "GAKqxbnnKrJxtEToAC32vA3u9orcu5Ys";
  const LIMIT = 50;

  const fetchGifs = useCallback(async (currentOffset: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=@PuffinHub&limit=${LIMIT}&offset=${currentOffset}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch GIFs");
      }

      const data = await response.json();

      if (data.data && data.data.length > 0) {
        setGifs((prev) =>
          currentOffset === 0 ? data.data : [...prev, ...data.data],
        );
        setHasMore(data.data.length === LIMIT);
        setError(null);
      } else if (currentOffset === 0) {
        setError("No GIFs found from @PuffinHub channel");
        setGifs([]);
      }
    } catch (err) {
      setError("Failed to load GIFs from Giphy");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGifs(0);
  }, [fetchGifs]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const newOffset = offset + LIMIT;
          setOffset(newOffset);
          fetchGifs(newOffset);
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [offset, hasMore, loading, fetchGifs]);

  if (loading && gifs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && gifs.length === 0) {
    return (
      <Alert className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}.{" "}
          <a
            href="https://giphy.com/channel/PuffinHub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Visit the @PuffinHub Giphy channel
          </a>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {gifs.map((gif) => (
          <Card
            key={gif.id}
            className="group relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1"
          >
            <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <img
                src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png"
                alt=""
                className="absolute inset-0 h-full w-full animate-pulse object-cover opacity-20"
                style={{ animationDuration: "3s" }}
              />
            </div>
            <CardContent className="relative p-0">
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={gif.images.original.url}
                  alt={gif.title || "Puffin GIF"}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                  loading="lazy"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div
          ref={observerTarget}
          className="flex items-center justify-center py-8"
        >
          {loading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
        </div>
      )}
    </div>
  );
}
