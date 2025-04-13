import React, { useState, useRef } from 'react';
import { Upload, Download, ImagePlus } from 'lucide-react';

interface PhotoPreview {
  url: string;
  file: File;
}

function App() {
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 3) {
      alert('Maximum 3 photos allowed');
      return;
    }

    const newPhotos = files.map(file => ({
      url: URL.createObjectURL(file),
      file
    }));
    setPhotos([...photos, ...newPhotos]);
    setMergedImage(null);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setMergedImage(null);
  };

  const mergePhotos = async () => {
    if (photos.length < 2) {
      alert('Please upload at least 2 photos');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load all images first
    const images = await Promise.all(
      photos.map(photo => {
        return new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.src = photo.url;
          img.onload = () => resolve(img);
        });
      })
    );

    // Calculate dimensions
    const maxHeight = Math.max(...images.map(img => img.height));
    const totalWidth = images.reduce((sum, img) => {
      const aspectRatio = img.width / img.height;
      return sum + (maxHeight * aspectRatio);
    }, 0);

    // Set canvas size
    canvas.width = totalWidth;
    canvas.height = maxHeight;

    // Draw images
    let currentX = 0;
    images.forEach(img => {
      const aspectRatio = img.width / img.height;
      const width = maxHeight * aspectRatio;
      ctx.drawImage(img, currentX, 0, width, maxHeight);
      currentX += width;
    });

    setMergedImage(canvas.toDataURL('image/jpeg'));
  };

  const downloadMergedImage = () => {
    if (!mergedImage) return;

    const link = document.createElement('a');
    link.href = mergedImage;
    link.download = 'kondipress-merged.jpg';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">KondiPress Photo App</h1>
          <p className="text-gray-600">Upload, merge, and download your photos side by side</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-center mb-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              disabled={photos.length >= 3}
            >
              <Upload size={20} />
              Upload Photo {photos.length}/3
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              multiple
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative"
              >
                {photos[index] ? (
                  <>
                    <img
                      src={photos[index].url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <ImagePlus size={32} />
                    <span className="mt-2">Empty</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={mergePhotos}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              disabled={photos.length < 2}
            >
              Merge Photos
            </button>
            <button
              onClick={downloadMergedImage}
              className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
              disabled={!mergedImage}
            >
              <Download size={20} className="inline-block mr-2" />
              Download
            </button>
          </div>
        </div>

        {mergedImage && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Merged Result</h2>
            <img src={mergedImage} alt="Merged" className="w-full rounded-lg" />
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

export default App;