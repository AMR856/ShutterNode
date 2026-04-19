import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface TransformParams {
  publicId?: string;
  width?: string;
  height?: string;
  zoom?: string;
  crop?: string;
  gravity?: string;
  rotate?: string;
  flip?: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  vibrance?: number;
  gamma?: number;
  sharpen?: number;
  unsharpMask?: number;
  grayscale?: boolean;
  sepia?: boolean;
  negate?: boolean;
  blur?: number;
  pixelate?: number;
  vignette?: number;
  oilPaint?: number;
  cartoonify?: boolean;
  cartoonifyAmount?: string;
  art?: string;
  borderWidth?: string;
  borderColor?: string;
  background?: string;
  radius?: string;
  watermarkText?: string;
  watermarkFontFamily?: string;
  watermarkFontSize?: number;
  watermarkFontColor?: string;
  watermarkGravity?: string;
  watermarkX?: number;
  watermarkY?: number;
  watermarkOpacity?: number;
  quality?: string;
  dpr?: string;
  format?: string;
  fetchFormat?: string;
}

export const imageService = {
  async uploadImage(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/api/images`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      toast.success('Image uploaded successfully!');
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      toast.error(message);
      throw error;
    }
  },

  async transformImage(params: TransformParams): Promise<any> {
    try {
      const loadingToast = toast.loading('Transforming image...');

      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          query.append(key, String(value));
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/images/transform?${query.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({}),
      });

      toast.dismiss(loadingToast);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transform failed');
      }

      const data = await response.json();
      toast.success('Image transformed successfully!');
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to transform image';
      toast.error(message);
      throw error;
    }
  },

  async getImage(publicId: string): Promise<any> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/images/get-image?publicId=${encodeURIComponent(publicId)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch image');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch image';
      toast.error(message);
      throw error;
    }
  },

  async getUploadStatus(id: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/images/${id}/status`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch status');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch status';
      toast.error(message);
      throw error;
    }
  },

  async getImages(page?: number, limit?: number): Promise<any> {
    try {
      const query = new URLSearchParams();
      if (page) query.append('page', String(page));
      if (limit) query.append('limit', String(limit));

      const response = await fetch(`${API_BASE_URL}/api/images?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch images');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch images';
      toast.error(message);
      throw error;
    }
  },
};

export default imageService;
