'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { 
  Camera, 
  Upload, 
  X, 
  Eye, 
  Download, 
  Trash2, 
  RotateCw, 
  ZoomIn,
  FileImage,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
  uploadProgress: number;
  metadata?: {
    width?: number;
    height?: number;
    description?: string;
    category?: string;
    timestamp?: string;
    location?: string;
  };
}

interface ImageInputProps {
  onImagesSelected: (images: ImageFile[]) => void;
  onImageUpload?: (image: ImageFile, progress: number) => void;
  onImageAnalyze?: (image: ImageFile) => Promise<Record<string, unknown>>;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  enableCamera?: boolean;
  enableMetadata?: boolean;
  className?: string;
}

const MEDICAL_IMAGE_CATEGORIES = [
  '皮肤症状',
  '伤口状况',
  '皮疹/红斑',
  '肿胀部位',
  '药物包装',
  '医疗报告',
  '化验单',
  '其他症状'
];

export function ImageInput({
  onImagesSelected,
  onImageUpload,
  onImageAnalyze,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  enableCamera = true,
  enableMetadata = true,
  className = ''
}: ImageInputProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const generateImageId = () => {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  };

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `不支持的文件格式: ${file.type}`;
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `文件大小超出限制 (${maxSizeMB}MB): ${(file.size / 1024 / 1024).toFixed(2)}MB`;
    }
    
    return null;
  };

  const extractImageMetadata = async (file: File): Promise<Record<string, unknown>> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          timestamp: new Date().toISOString(),
        });
      };
      img.onerror = () => resolve({});
      img.src = URL.createObjectURL(file);
    });
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (images.length + fileArray.length > maxFiles) {
      setError(`最多只能选择 ${maxFiles} 张图片`);
      return;
    }

    const newImages: ImageFile[] = [];
    
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      const preview = URL.createObjectURL(file);
      const metadata = enableMetadata ? await extractImageMetadata(file) : undefined;
      
      const imageFile: ImageFile = {
        id: generateImageId(),
        file,
        preview,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadProgress: 0,
        metadata
      };
      
      newImages.push(imageFile);
    }

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesSelected(updatedImages);
      setError(null);
    }
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [images, maxFiles, onImagesSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files) {
      processFiles(files);
    }
  }, [images, maxFiles, onImagesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => {
      if (img.id === id) {
        URL.revokeObjectURL(img.preview);
        return false;
      }
      return true;
    });
    setImages(updatedImages);
    onImagesSelected(updatedImages);
    
    if (selectedImage?.id === id) {
      setSelectedImage(null);
    }
  };

  const clearAllImages = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    onImagesSelected([]);
    setSelectedImage(null);
  };

  const uploadImage = async (image: ImageFile) => {
    if (!onImageUpload) return;

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      setTimeout(() => {
        const updatedImages = images.map(img => 
          img.id === image.id ? { ...img, uploadProgress: progress } : img
        );
        setImages(updatedImages);
        onImageUpload(image, progress);
      }, progress * 50);
    }
  };

  const analyzeImage = async (image: ImageFile) => {
    if (!onImageAnalyze) return;
    
    setIsAnalyzing(true);
    setAnalysisResults(null);
    
    try {
      const results = await onImageAnalyze(image);
      setAnalysisResults(results);
    } catch (error) {
      setError('图像分析失败，请重试');
      console.error('Image analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateImageCategory = (imageId: string, category: string) => {
    const updatedImages = images.map(img => 
      img.id === imageId 
        ? { 
            ...img, 
            metadata: { ...img.metadata, category } 
          }
        : img
    );
    setImages(updatedImages);
    onImagesSelected(updatedImages);
  };

  const downloadImage = (image: ImageFile) => {
    const link = document.createElement('a');
    link.href = image.preview;
    link.download = image.name;
    link.click();
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            图像输入
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {images.length}/{maxFiles} 张图片
            </Badge>
            {images.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearAllImages}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="space-y-4">
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                选择图片
              </Button>
              
              {enableCamera && (
                <Button
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  拍照
                </Button>
              )}
            </div>
            
            <p className="text-sm text-gray-600">
              或拖拽图片文件至此区域
            </p>
            
            <p className="text-xs text-gray-500">
              支持 JPEG、PNG、WebP 格式，最大 {maxSizeMB}MB
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {enableCamera && (
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          )}
        </div>

        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setSelectedImage(image)}
                  />
                </div>
                
                {/* Progress Bar */}
                {image.uploadProgress > 0 && image.uploadProgress < 100 && (
                  <div className="absolute bottom-2 left-2 right-2">
                    <Progress value={image.uploadProgress} className="h-1" />
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedImage(image)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(image.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Category Badge */}
                {image.metadata?.category && (
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {image.metadata.category}
                    </Badge>
                  </div>
                )}
                
                {/* File Info */}
                <div className="mt-2 text-xs text-gray-600">
                  <p className="truncate">{image.name}</p>
                  <p>{(image.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Image Detail Dialog */}
        {selectedImage && (
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  {selectedImage.name}
                </DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="preview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="preview">预览</TabsTrigger>
                  <TabsTrigger value="metadata">信息</TabsTrigger>
                  <TabsTrigger value="analysis">分析</TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={selectedImage.preview}
                      alt={selectedImage.name}
                      className="max-h-[60vh] rounded-lg"
                    />
                  </div>
                  
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => downloadImage(selectedImage)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      下载
                    </Button>
                    
                    {onImageUpload && (
                      <Button onClick={() => uploadImage(selectedImage)}>
                        <Upload className="h-4 w-4 mr-2" />
                        上传
                      </Button>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="metadata" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">文件名</Label>
                      <p className="text-sm text-gray-600">{selectedImage.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">文件大小</Label>
                      <p className="text-sm text-gray-600">
                        {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">文件类型</Label>
                      <p className="text-sm text-gray-600">{selectedImage.type}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">尺寸</Label>
                      <p className="text-sm text-gray-600">
                        {selectedImage.metadata?.width} × {selectedImage.metadata?.height}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">时间</Label>
                      <p className="text-sm text-gray-600">
                        {selectedImage.metadata?.timestamp && 
                          new Date(selectedImage.metadata.timestamp).toLocaleString('zh-CN')
                        }
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">类别</Label>
                      <select
                        value={selectedImage.metadata?.category || ''}
                        onChange={(e) => updateImageCategory(selectedImage.id, e.target.value)}
                        className="text-sm p-1 border rounded"
                      >
                        <option value="">选择类别</option>
                        {MEDICAL_IMAGE_CATEGORIES.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="analysis" className="space-y-4">
                  <div className="text-center">
                    <Button
                      onClick={() => analyzeImage(selectedImage)}
                      disabled={isAnalyzing || !onImageAnalyze}
                      className="mb-4"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ZoomIn className="h-4 w-4 mr-2" />
                      )}
                      {isAnalyzing ? '分析中...' : '开始分析'}
                    </Button>
                  </div>
                  
                  {analysisResults && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">分析结果:</h4>
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(analysisResults, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {!onImageAnalyze && (
                    <Alert>
                      <AlertDescription>
                        图像分析功能需要配置相关服务
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}