'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import { dzfColors } from '@/theme/colors';
import DZFButton from '@/components/ui/DZFButton';
import { CameraIcon, UploadIcon, CheckCircleIcon } from '@/components/ui/DZFIcons';

export interface PhotoCaptureResult {
  secure_url: string;
  public_id: string;
}

interface PatronPhotoCaptureProps {
  currentPhotoUrl?: string;
  onPhotoUploaded: (result: PhotoCaptureResult) => void;
  barcode?: string;
}

export default function PatronPhotoCapture({
  currentPhotoUrl,
  onPhotoUploaded,
  barcode,
}: PatronPhotoCaptureProps) {
  const [mode, setMode] = React.useState<'idle' | 'camera' | 'preview'>('idle');
  const [photoDataUrl, setPhotoDataUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(currentPhotoUrl || null);
  const [error, setError] = React.useState<string | null>(null);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Stop camera media tracks cleanly
  const stopCameraStream = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Start live webcam stream
  const startCamera = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera stream is not supported in this browser. Please use file upload.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 640 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      setMode('camera');

      // Attach stream to video element when rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unable to access camera';
      setError(`${errorMsg}. Please ensure camera permissions are allowed, or upload a photo.`);
      setMode('idle');
    }
  };

  // Capture frame from video feed
  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Square passport aspect ratio crop
    const size = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;

    canvas.width = 480;
    canvas.height = 480;
    ctx.drawImage(video, startX, startY, size, size, 0, 0, 480, 480);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setPhotoDataUrl(dataUrl);
    stopCameraStream();
    setMode('preview');
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Photo file size must not exceed 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(reader.result as string);
      setMode('preview');
    };
    reader.readAsDataURL(file);
  };

  // Upload to Cloudinary via backend route
  const uploadPhoto = async (dataUrlToUpload: string) => {
    setUploading(true);
    setError(null);

    try {
      const res = await fetch('/api/upload/patron-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: dataUrlToUpload,
          barcode,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload photo.');
      }

      setUploadedUrl(data.secure_url);
      setMode('idle');
      onPhotoUploaded({
        secure_url: data.secure_url,
        public_id: data.public_id,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Photo upload error';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const retake = () => {
    setPhotoDataUrl(null);
    startCamera();
  };

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        border: `1.5px dashed ${dzfColors.surfaces.border}`,
        backgroundColor: '#f8fafc',
        textAlign: 'center',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: dzfColors.navy[900], mb: 0.5 }}>
        Passport Photo & Identity Capture
      </Typography>
      <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted, display: 'block', mb: 2 }}>
        Capture live snapshot with webcam or upload a standard passport photo. Stored securely on Cloudinary.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, textAlign: 'left', borderRadius: 1.5, fontSize: '0.8125rem' }}>
          {error}
        </Alert>
      )}

      {/* Hidden Canvas for Frame Processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* State 1: IDLE / Uploaded Photo Preview */}
      {mode === 'idle' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={uploadedUrl || undefined}
              sx={{
                width: 120,
                height: 120,
                border: `3px solid ${uploadedUrl ? dzfColors.gold[400] : dzfColors.maroon[900]}`,
                backgroundColor: dzfColors.maroon[50],
                color: dzfColors.maroon[900],
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                fontSize: '2rem',
                fontWeight: 700,
              }}
            >
              {!uploadedUrl && <CameraIcon size={40} />}
            </Avatar>

            {uploadedUrl && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  backgroundColor: dzfColors.status.success.button,
                  color: '#ffffff',
                  borderRadius: '50%',
                  p: 0.3,
                  display: 'flex',
                }}
              >
                <CheckCircleIcon size={18} />
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
            <DZFButton
              variant="primary"
              size="small"
              startIcon={<CameraIcon size={16} />}
              onClick={startCamera}
            >
              {uploadedUrl ? 'Take New Photo' : 'Open Webcam'}
            </DZFButton>

            <DZFButton
              variant="secondary"
              size="small"
              startIcon={<UploadIcon size={16} />}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadedUrl ? 'Upload Different Image' : 'Upload Image File'}
            </DZFButton>
          </Box>
        </Box>
      )}

      {/* State 2: Active WebRTC Camera Feed */}
      {mode === 'camera' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 240,
              height: 240,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `3px solid ${dzfColors.maroon[700]}`,
              backgroundColor: '#000000',
              position: 'relative',
              boxShadow: '0 8px 24px rgba(111, 17, 17, 0.25)',
            }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)', // Mirror front camera naturally
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <DZFButton
              variant="primary"
              size="small"
              startIcon={<CameraIcon size={16} />}
              onClick={captureSnapshot}
            >
              Capture Frame
            </DZFButton>

            <DZFButton
              variant="secondary"
              size="small"
              onClick={() => {
                stopCameraStream();
                setMode('idle');
              }}
            >
              Cancel
            </DZFButton>
          </Box>
        </Box>
      )}

      {/* State 3: Captured Photo Preview with Confirmation */}
      {mode === 'preview' && photoDataUrl && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={photoDataUrl}
            sx={{
              width: 120,
              height: 120,
              border: `3px solid ${dzfColors.gold[500]}`,
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.12)',
            }}
          />

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <DZFButton
              variant="primary"
              size="small"
              loading={uploading}
              onClick={() => uploadPhoto(photoDataUrl)}
            >
              {uploading ? 'Uploading to Cloudinary...' : 'Save & Confirm Photo'}
            </DZFButton>

            <DZFButton
              variant="secondary"
              size="small"
              disabled={uploading}
              onClick={retake}
            >
              Retake
            </DZFButton>

            <DZFButton
              variant="soft"
              size="small"
              disabled={uploading}
              onClick={() => setMode('idle')}
            >
              Cancel
            </DZFButton>
          </Box>
        </Box>
      )}
    </Box>
  );
}
