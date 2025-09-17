import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Link, X, Image, Video, FileImage, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MediaUploadProps {
  mediaType?: string;
  mediaUrl?: string;
  mediaAlt?: string;
  onMediaChange: (media: { type: string; url: string; alt: string } | null) => void;
}

export const MediaUpload = ({ mediaType, mediaUrl, mediaAlt, onMediaChange }: MediaUploadProps) => {
  const [urlInput, setUrlInput] = useState('');
  const [altText, setAltText] = useState(mediaAlt || '');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPEG, PNG, GIF, WebP) or video (MP4, WebM)",
        variant: "destructive"
      });
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars') // Using existing bucket
        .upload(`lesson-media/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`lesson-media/${fileName}`);

      const type = file.type.startsWith('video/') ? 'video' : file.type === 'image/gif' ? 'gif' : 'image';
      
      onMediaChange({ type, url: urlData.publicUrl, alt: altText });
      
      toast({
        title: "Media uploaded",
        description: "Media file has been uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload media file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;

    // Simple URL validation
    try {
      new URL(urlInput);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
      return;
    }

    // Determine media type from URL
    const url = urlInput.toLowerCase();
    let type = 'image';
    if (url.includes('.mp4') || url.includes('.webm') || 
        url.includes('youtube.com') || url.includes('youtu.be') || 
        url.includes('vimeo.com') || url.includes('dailymotion.com')) {
      type = 'video';
    } else if (url.includes('.gif')) {
      type = 'gif';
    }

    onMediaChange({ type, url: urlInput, alt: altText });
    setUrlInput('');
    
    toast({
      title: "Media added",
      description: "Media URL has been added successfully"
    });
  };

  const handleRemoveMedia = () => {
    onMediaChange(null);
    setUrlInput('');
    setAltText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getMediaIcon = () => {
    switch (mediaType) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'gif':
        return <FileImage className="w-4 h-4" />;
      default:
        return <Image className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-4 h-4" />
          Media Support
        </CardTitle>
        <CardDescription>
          Add images, videos, or GIFs to enhance your content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mediaUrl ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getMediaIcon()}
                  <span className="text-sm font-medium">Media attached</span>
                </div>
                <Button size="sm" variant="outline" onClick={handleRemoveMedia}>
                  <X className="w-3 h-3 mr-1" />
                  Remove
                </Button>
              </div>
              
              {/* Show the current media URL */}
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded border-l-2 border-learning-accent break-all">
                <strong>URL:</strong> {mediaUrl}
              </div>
            
            <div className="border rounded-lg overflow-hidden">
              {mediaType === 'video' ? (
                mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be') ? (
                  // YouTube preview
                  <div className="w-full h-32 bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <Video className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">YouTube Video</p>
                    </div>
                  </div>
                ) : (
                  // Direct video file
                  <video 
                    className="w-full h-32 object-cover"
                    src={mediaUrl}
                    controls
                    muted
                    playsInline
                  />
                )
              ) : (
                <img 
                  className="w-full h-32 object-cover"
                  src={mediaUrl}
                  alt={mediaAlt || 'Uploaded media'}
                  onError={(e) => {
                    console.error('Image failed to load:', mediaUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alt-text">Alt Text (for accessibility)</Label>
              <Input
                id="alt-text"
                value={altText ?? ''}
                onChange={(e) => {
                  setAltText(e.target.value);
                  onMediaChange({ type: mediaType!, url: mediaUrl, alt: e.target.value });
                }}
                placeholder="Describe the media content..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Method</Label>
              <Select value={uploadMethod} onValueChange={(value: 'url' | 'file') => setUploadMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">
                    <div className="flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      URL Link
                    </div>
                  </SelectItem>
                  <SelectItem value="file">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      File Upload
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {uploadMethod === 'url' ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="media-url">Media URL</Label>
                  <Input
                    id="media-url"
                    value={urlInput ?? ''}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alt-text-url">Alt Text</Label>
                  <Input
                    id="alt-text-url"
                    value={altText ?? ''}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Describe the media content..."
                  />
                </div>
                <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
                  <Link className="w-4 h-4 mr-2" />
                  Add Media URL
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="media-file">Choose File</Label>
                  <Input
                    id="media-file"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,video/mp4,video/webm"
                    disabled={uploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alt-text-file">Alt Text</Label>
                  <Input
                    id="alt-text-file"
                    value={altText ?? ''}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Describe the media content..."
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPEG, PNG, GIF, WebP, MP4, WebM (max 10MB)
                </p>
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading media...
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};