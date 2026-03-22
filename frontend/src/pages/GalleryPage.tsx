import { useState } from 'react';
import { useGetAllGifs, useUploadGif, useDeleteGif } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, Trash2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage, formatFileSize } from '../lib/imageCompression';
import { Alert, AlertDescription } from '@/components/ui/alert';
import GiphyFeed from '../components/GiphyFeed';

export default function GalleryPage() {
  const { data: gifs, isLoading } = useGetAllGifs();
  const uploadMutation = useUploadGif();
  const deleteMutation = useDeleteGif();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    file: null as File | null,
    originalSize: 0,
    compressedSize: 0,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      setFormData({ 
        ...formData, 
        file,
        originalSize: file.size,
        compressedSize: 0,
      });
      setCompressionProgress('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if we've reached the 100 GIF limit
    if (gifs && gifs.length >= 100) {
      toast.error('Gallery is full! Maximum 100 GIFs allowed.');
      return;
    }

    const id = `gif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Step 1: Compress the image
      setCompressionProgress('Compressing image...');
      const compressedFile = await compressImage(formData.file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        quality: 0.8,
      });

      setFormData(prev => ({
        ...prev,
        compressedSize: compressedFile.size,
      }));

      setCompressionProgress(
        `Compressed from ${formatFileSize(formData.originalSize)} to ${formatFileSize(compressedFile.size)}`
      );

      // Step 2: Upload the compressed image
      await uploadMutation.mutateAsync({
        id,
        name: formData.name,
        description: formData.description,
        file: compressedFile,
        onProgress: setUploadProgress,
      });

      toast.success('GIF uploaded successfully!');
      setFormData({ name: '', description: '', file: null, originalSize: 0, compressedSize: 0 });
      setUploadProgress(0);
      setCompressionProgress('');
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to upload GIF');
      console.error(error);
      setCompressionProgress('');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('GIF deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete GIF');
      console.error(error);
    }
  };

  const remainingSlots = gifs ? 100 - gifs.length : 100;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated wave motion background */}
      <div className="fixed inset-0 overflow-hidden opacity-15 pointer-events-none">
        <img 
          src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
          alt="" 
          className="absolute left-0 top-0 h-full w-full animate-pulse object-cover"
          style={{ animationDuration: '7s' }}
        />
        <img 
          src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
          alt="" 
          className="absolute right-0 bottom-0 h-full w-full animate-pulse object-cover opacity-50"
          style={{ animationDuration: '9s', animationDelay: '2s' }}
        />
      </div>

      {/* Floating puffin mascots */}
      <div className="fixed inset-0 overflow-hidden opacity-8 pointer-events-none">
        <img 
          src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
          alt="" 
          className="absolute left-[8%] top-[15%] h-20 w-20 animate-bounce"
          style={{ animationDuration: '6s' }}
        />
        <img 
          src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
          alt="" 
          className="absolute right-[12%] top-[25%] h-24 w-24 animate-bounce"
          style={{ animationDuration: '7s', animationDelay: '1s' }}
        />
        <img 
          src="/assets/generated/animated-puffin-mascot-transparent.dim_128x128.png" 
          alt="" 
          className="absolute left-[15%] bottom-[20%] h-22 w-22 animate-bounce"
          style={{ animationDuration: '8s', animationDelay: '2s' }}
        />
      </div>

      {/* Soft gradient orbs */}
      <div className="fixed inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute left-[10%] top-[20%] h-64 w-64 animate-pulse rounded-full bg-[oklch(0.75_0.15_200)] blur-3xl"></div>
        <div className="absolute right-[15%] bottom-[25%] h-72 w-72 animate-pulse rounded-full bg-accent/20 blur-3xl" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container relative z-10 py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-[oklch(0.62_0.18_245)] via-[oklch(0.70_0.15_210)] to-accent bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              Puffin GIF Gallery
            </h1>
            <p className="mt-2 text-muted-foreground">
              Explore GIFs from @PuffinHub and share your own Puffin-themed creations!
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="group/btn relative gap-2 overflow-hidden bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/50" disabled={gifs && gifs.length >= 100}>
                <span className="relative z-10 flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload GIF
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full"></div>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload a Puffin GIF</DialogTitle>
                <DialogDescription>
                  Share your favorite Puffin-themed GIF with the community
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Give your GIF a name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your GIF (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Image File *</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                  {formData.file && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {formData.file.name} ({formatFileSize(formData.originalSize)})
                    </p>
                  )}
                </div>

                {compressionProgress && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{compressionProgress}</AlertDescription>
                  </Alert>
                )}

                {uploadMutation.isPending && (
                  <div className="space-y-2">
                    <Label>Upload Progress</Label>
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-muted-foreground text-center">
                      {uploadProgress}%
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {compressionProgress.includes('Compressing') ? 'Compressing...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="giphy" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="giphy">@PuffinHub Feed</TabsTrigger>
            <TabsTrigger value="community">
              Community Uploads
              {gifs && gifs.length > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                  {gifs.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="giphy" className="mt-6">
            <GiphyFeed />
          </TabsContent>

          <TabsContent value="community" className="mt-6">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {gifs?.length || 0} / 100 GIFs uploaded • {remainingSlots} slots remaining
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : gifs && gifs.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {gifs.map((gif) => (
                  <Card key={gif.id} className="group relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1">
                    <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <img 
                        src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                        alt="" 
                        className="absolute inset-0 h-full w-full animate-pulse object-cover opacity-20"
                        style={{ animationDuration: '3s' }}
                      />
                    </div>
                    <CardHeader className="relative p-0">
                      <div className="aspect-square overflow-hidden bg-muted">
                        <img
                          src={gif.blob.getDirectURL()}
                          alt={gif.name}
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="relative p-4">
                      <CardTitle className="mb-2 text-lg">{gif.name}</CardTitle>
                      {gif.description && (
                        <CardDescription className="line-clamp-2">
                          {gif.description}
                        </CardDescription>
                      )}
                    </CardContent>
                    <CardFooter className="relative p-4 pt-0">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => handleDelete(gif.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background py-12">
                <div className="absolute inset-0 overflow-hidden opacity-10">
                  <img 
                    src="/assets/generated/wave-motion-overlay-transparent.dim_400x150.png" 
                    alt="" 
                    className="absolute inset-0 h-full w-full animate-pulse object-cover"
                    style={{ animationDuration: '5s' }}
                  />
                </div>
                <CardContent className="relative flex flex-col items-center justify-center text-center">
                  <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No GIFs yet</h3>
                  <p className="mb-4 text-muted-foreground">
                    Be the first to upload a Puffin-themed GIF!
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)} className="group/btn relative gap-2 overflow-hidden bg-gradient-to-r from-primary to-[oklch(0.70_0.18_245)] shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/50">
                    <span className="relative z-10 flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload First GIF
                    </span>
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full"></div>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
