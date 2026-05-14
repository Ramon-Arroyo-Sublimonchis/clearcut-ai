'use client';

import { useState, useRef } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Download, Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

export default function BackgroundRemover() {
  const [image, setImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = async (file) => {
    setImage(URL.createObjectURL(file));
    setIsProcessing(true);
    setProgress(0);

    try {
      const blob = await removeBackground(file, {
        model: 'isnet', // Use highest quality model for better edge detection
        progress: (key, current, total) => {
          const p = Math.round((current / total) * 100);
          setProgress(p);
        },
      });
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    } catch (error) {
      console.error("Removal failed:", error);
      alert("Error al procesar la imagen. Por favor, intenta con otra.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setProcessedImage(null);
    setProgress(0);
  };

  const download = () => {
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'clearcut-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="remover-container">
      <AnimatePresence mode="wait">
        {!image ? (
          <motion.div
            key="uploader"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="uploader-card"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden-input" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*"
            />
            <div className="icon-box">
              <Upload className="icon-lg" />
            </div>
            <h2 className="uploader-title display-font">Subir Imagen</h2>
            <p className="uploader-desc">Haz clic o suelta un archivo para procesar</p>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="preview-card"
          >
            <div className="preview-header">
              <div className="header-title">
                <ImageIcon className="icon-md" />
                <span>RESULTADO_PROCESO.VISTA</span>
              </div>
              <button onClick={reset} className="icon-button" aria-label="Cerrar vista">
                <X className="icon-md" />
              </button>
            </div>

            <div className="preview-grid">
              {/* Original */}
              <div className="preview-col">
                <p className="col-label">IMG_ORIGINAL</p>
                <div className="image-box">
                  <img src={image} alt="Original" className="image-contain" />
                </div>
              </div>

              {/* Result */}
              <div className="preview-col">
                <p className="col-label">IMG_PROCESADA</p>
                <div className="image-box transparent-bg">
                  {isProcessing ? (
                    <div className="processing-state">
                      <div className="progress-text">{progress}%</div>
                      <div className="progress-bar-bg">
                        <motion.div 
                          className="progress-bar-fill" 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <img src={processedImage} alt="Procesada" className="image-contain animate-in" />
                  )}
                </div>
                
                {processedImage && (
                  <button 
                    onClick={download}
                    className="download-btn animate-in"
                  >
                    <Download className="icon-md" style={{ color: '#000' }} />
                    GUARDAR_COMO_PNG
                  </button>
                )}
              </div>
            </div>

            {!isProcessing && processedImage && (
              <div className="success-banner animate-in">
                PROCESO_COMPLETADO_EXITOSAMENTE
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
