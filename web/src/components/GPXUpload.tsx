'use client';

import { useCallback, useState } from 'react';

interface RouteStats {
  distance_km: number;
  elevation_gain: number;
  max_gradient: number;
  max_descent: number;
  pass_count: number;
}

interface GPXUploadProps {
  onUpload: (file: File, stats: RouteStats) => void;
  onError: (error: string) => void;
  parseGPX: (file: File) => Promise<RouteStats>;
  currentFile?: File | null;
}

export function GPXUpload({ onUpload, onError, parseGPX, currentFile }: GPXUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      onError('GPX файл сонгоно уу');
      return;
    }

    setIsLoading(true);
    try {
      const stats = await parseGPX(file);
      onUpload(file, stats);
    } catch (err: any) {
      onError(err.message || 'GPX файл уншихад алдаа гарлаа');
    } finally {
      setIsLoading(false);
    }
  }, [onUpload, onError, parseGPX]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  if (currentFile) {
    return (
      <div className="border-2 border-green-200 bg-green-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-green-800">{currentFile.name}</p>
              <p className="text-sm text-green-600">Амжилттай уншлаа</p>
            </div>
          </div>
          <label className="cursor-pointer text-primary-600 hover:text-primary-700 font-medium text-sm">
            Өөр файл
            <input
              type="file"
              accept=".gpx"
              onChange={handleInputChange}
              className="hidden"
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-xl p-8 text-center transition-all
        ${isDragging
          ? 'border-primary-500 bg-primary-50'
          : 'border-secondary-300 hover:border-primary-400 hover:bg-secondary-50'
        }
        ${isLoading ? 'pointer-events-none opacity-50' : ''}
      `}
    >
      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-secondary-600">GPX файл уншиж байна...</p>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 mx-auto mb-4 bg-secondary-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <p className="text-secondary-700 font-medium mb-2">
            GPX файлаа энд чирж тавина уу
          </p>
          <p className="text-secondary-500 text-sm mb-4">эсвэл</p>
          <label className="inline-flex cursor-pointer">
            <span className="bg-primary-500 text-white px-6 py-2 rounded-full font-medium hover:bg-primary-600 transition-colors">
              Файл сонгох
            </span>
            <input
              type="file"
              accept=".gpx"
              onChange={handleInputChange}
              className="hidden"
            />
          </label>
          <p className="text-secondary-400 text-xs mt-4">
            * GPX файл заавал шаардлагатай
          </p>
        </>
      )}
    </div>
  );
}
