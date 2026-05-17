import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

interface UploadImageData {
  uploadId: string;
  status: string;
  message: string;
}

interface UploadStatusData {
  id: string;
  status: string;
  publicId?: string | null;
  url?: string | null;
}

interface UploadedImageResult {
  uploadId: string;
  publicId: string;
  url?: string | null;
}

export interface ImageRecord {
  id: string;
  publicId: string | null;
  url: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ImagesResponse {
  status: string;
  page: number;
  limit: number;
  count: number;
  data: ImageRecord[];
  message?: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

type TransformRequestBody = {
  transformations: {
    resize?: {
      width?: number;
      height?: number;
      crop?: 'fill' | 'fit' | 'limit' | 'pad' | 'scale' | 'thumb';
      gravity?:
        | 'auto'
        | 'face'
        | 'faces'
        | 'center'
        | 'north'
        | 'south'
        | 'east'
        | 'west'
        | 'north_east'
        | 'north_west'
        | 'south_east'
        | 'south_west';
      zoom?: number;
    };
    rotate?: number;
    flip?: 'horizontal' | 'vertical' | 'both';
    format?: 'jpg' | 'png' | 'webp' | 'avif' | 'gif' | 'auto';
    fetchFormat?: 'auto';
    quality?: number | 'auto';
    dpr?: number;
    adjustments?: {
      brightness?: number;
      contrast?: number;
      saturation?: number;
      hue?: number;
      vibrance?: number;
      gamma?: number;
      sharpen?: number;
      unsharpMask?: number;
    };
    filters?: {
      grayscale?: boolean;
      sepia?: boolean;
      negate?: boolean;
      blur?: number;
      pixelate?: number;
      vignette?: number;
      oilPaint?: number;
      cartoonify?: boolean | number;
      art?: string;
    };
    radius?: number | 'max';
    border?: {
      width: number;
      color: string;
    };
    background?: string;
    watermark?: {
      text: string;
      fontFamily?: string;
      fontSize?: number;
      fontColor?: string;
      gravity?:
        | 'center'
        | 'north'
        | 'south'
        | 'east'
        | 'west'
        | 'north_east'
        | 'north_west'
        | 'south_east'
        | 'south_west';
      opacity?: number;
      x?: number;
      y?: number;
    };
  };
};

type TransformResize = NonNullable<TransformRequestBody['transformations']['resize']>;
type TransformWatermark = NonNullable<TransformRequestBody['transformations']['watermark']>;

const DEFAULT_TRANSFORM_VALUES = {
  crop: 'fill',
  gravity: 'auto',
  flip: 'none',
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  vibrance: 0,
  gamma: 1,
  sharpen: 0,
  unsharpMask: 0,
  grayscale: false,
  sepia: false,
  negate: false,
  blur: 0,
  pixelate: 0,
  vignette: 0,
  oilPaint: 0,
  cartoonify: false,
  radius: '',
  watermarkFontFamily: 'Arial',
  watermarkFontSize: 40,
  watermarkFontColor: '#FFFFFF',
  watermarkGravity: 'south_east',
  watermarkX: 10,
  watermarkY: 10,
  watermarkOpacity: 60,
  quality: '',
  dpr: '',
  format: '',
  fetchFormat: '',
} as const;

export const imageService = {
  async uploadImage(file: File): Promise<UploadedImageResult> {
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

      const data: ApiResponse<UploadImageData> = await response.json();
      const uploadId = data?.data?.uploadId;

      if (!uploadId) {
        throw new Error('Upload started but no upload ID was returned');
      }

      const startedAt = Date.now();
      const timeoutMs = 30_000;
      const pollIntervalMs = 1_000;

      while (Date.now() - startedAt < timeoutMs) {
        const statusData = await imageService.getUploadStatus(uploadId);

        if (statusData.status === 'failed') {
          throw new Error('Image processing failed on server');
        }

        if (statusData.status === 'completed' && statusData.publicId) {
          toast.success('Image uploaded successfully!');
          return {
            uploadId,
            publicId: statusData.publicId,
            url: statusData.url,
          };
        }

        await delay(pollIntervalMs);
      }

      throw new Error('Upload is still processing. Try again in a moment.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      toast.error(message);
      throw error;
    }
  },

  async transformImage(params: TransformParams): Promise<{
    imageId: string;
    publicId: string;
    status: string;
    url?: string | null;
  }> {
    try {
      const loadingToast = toast.loading('Transforming image...');

      const imageId = params.publicId?.trim();
      if (!imageId) {
        throw new Error('Public ID is required');
      }

      const transformations: TransformRequestBody['transformations'] = {};

      const resize: NonNullable<TransformRequestBody['transformations']['resize']> = {};
      if (params.width) resize.width = Number(params.width);
      if (params.height) resize.height = Number(params.height);
      if (params.zoom !== undefined && params.zoom !== '') resize.zoom = Number(params.zoom);
      if (params.crop && params.crop !== DEFAULT_TRANSFORM_VALUES.crop) {
        resize.crop = params.crop as TransformResize['crop'];
      }
      if (params.gravity && params.gravity !== DEFAULT_TRANSFORM_VALUES.gravity) {
        resize.gravity = params.gravity as TransformResize['gravity'];
      }
      if (Object.keys(resize).length > 0) {
        transformations.resize = resize;
      }

      if (params.rotate !== undefined && params.rotate !== '') {
        transformations.rotate = Number(params.rotate);
      }

      if (params.flip && params.flip !== DEFAULT_TRANSFORM_VALUES.flip) {
        transformations.flip = params.flip as 'horizontal' | 'vertical' | 'both';
      }

      if (params.format && params.format !== DEFAULT_TRANSFORM_VALUES.format) {
        transformations.format = params.format as TransformRequestBody['transformations']['format'];
      }

      if (params.fetchFormat && params.fetchFormat !== DEFAULT_TRANSFORM_VALUES.fetchFormat) {
        transformations.fetchFormat = params.fetchFormat as 'auto';
      }

      if (params.quality !== undefined && params.quality !== '' && params.quality !== DEFAULT_TRANSFORM_VALUES.quality) {
        transformations.quality = params.quality === 'auto' ? 'auto' : Number(params.quality);
      }

      if (params.dpr !== undefined && params.dpr !== '' && params.dpr !== DEFAULT_TRANSFORM_VALUES.dpr) {
        transformations.dpr = Number(params.dpr);
      }

      const adjustments: NonNullable<TransformRequestBody['transformations']['adjustments']> = {};
      if (params.brightness !== undefined && params.brightness !== DEFAULT_TRANSFORM_VALUES.brightness) {
        adjustments.brightness = params.brightness;
      }
      if (params.contrast !== undefined && params.contrast !== DEFAULT_TRANSFORM_VALUES.contrast) {
        adjustments.contrast = params.contrast;
      }
      if (params.saturation !== undefined && params.saturation !== DEFAULT_TRANSFORM_VALUES.saturation) {
        adjustments.saturation = params.saturation;
      }
      if (params.hue !== undefined && params.hue !== DEFAULT_TRANSFORM_VALUES.hue) {
        adjustments.hue = params.hue;
      }
      if (params.vibrance !== undefined && params.vibrance !== DEFAULT_TRANSFORM_VALUES.vibrance) {
        adjustments.vibrance = params.vibrance;
      }
      if (params.gamma !== undefined && params.gamma !== DEFAULT_TRANSFORM_VALUES.gamma) {
        adjustments.gamma = params.gamma;
      }
      if (params.sharpen !== undefined && params.sharpen !== DEFAULT_TRANSFORM_VALUES.sharpen) {
        adjustments.sharpen = params.sharpen;
      }
      if (params.unsharpMask !== undefined && params.unsharpMask !== DEFAULT_TRANSFORM_VALUES.unsharpMask) {
        adjustments.unsharpMask = params.unsharpMask;
      }
      if (Object.keys(adjustments).length > 0) {
        transformations.adjustments = adjustments;
      }

      const filters: NonNullable<TransformRequestBody['transformations']['filters']> = {};
      if (params.grayscale === true) filters.grayscale = true;
      if (params.sepia === true) filters.sepia = true;
      if (params.negate === true) filters.negate = true;
      if (params.blur !== undefined && params.blur !== DEFAULT_TRANSFORM_VALUES.blur) {
        filters.blur = params.blur;
      }
      if (params.pixelate !== undefined && params.pixelate !== DEFAULT_TRANSFORM_VALUES.pixelate) {
        filters.pixelate = params.pixelate;
      }
      if (params.vignette !== undefined && params.vignette !== DEFAULT_TRANSFORM_VALUES.vignette) {
        filters.vignette = params.vignette;
      }
      if (params.oilPaint !== undefined && params.oilPaint !== DEFAULT_TRANSFORM_VALUES.oilPaint) {
        filters.oilPaint = params.oilPaint;
      }
      if (params.cartoonify === true) {
        filters.cartoonify =
          params.cartoonifyAmount !== '' && params.cartoonifyAmount !== undefined
            ? Number(params.cartoonifyAmount)
            : true;
      }
      if (params.art) filters.art = params.art;
      if (Object.keys(filters).length > 0) {
        transformations.filters = filters;
      }

      if (params.radius !== undefined && params.radius !== '' && params.radius !== DEFAULT_TRANSFORM_VALUES.radius) {
        transformations.radius = params.radius === 'max' ? 'max' : Number(params.radius);
      }

      if (params.borderWidth || params.borderColor) {
        transformations.border = {
          width: Number(params.borderWidth || 0),
          color: params.borderColor || '#000000',
        };
      }

      if (params.background) {
        transformations.background = params.background;
      }

      if (params.watermarkText) {
        const watermark: NonNullable<TransformRequestBody['transformations']['watermark']> = {
          text: params.watermarkText,
        };

        if (
          params.watermarkFontFamily &&
          params.watermarkFontFamily !== DEFAULT_TRANSFORM_VALUES.watermarkFontFamily
        ) {
          watermark.fontFamily = params.watermarkFontFamily;
        }
        if (
          params.watermarkFontSize !== undefined &&
          params.watermarkFontSize !== DEFAULT_TRANSFORM_VALUES.watermarkFontSize
        ) {
          watermark.fontSize = params.watermarkFontSize;
        }
        if (
          params.watermarkFontColor &&
          params.watermarkFontColor !== DEFAULT_TRANSFORM_VALUES.watermarkFontColor
        ) {
          watermark.fontColor = params.watermarkFontColor;
        }
        if (
          params.watermarkGravity &&
          params.watermarkGravity !== DEFAULT_TRANSFORM_VALUES.watermarkGravity
        ) {
          watermark.gravity = params.watermarkGravity as TransformWatermark['gravity'];
        }
        if (
          params.watermarkOpacity !== undefined &&
          params.watermarkOpacity !== DEFAULT_TRANSFORM_VALUES.watermarkOpacity
        ) {
          watermark.opacity = params.watermarkOpacity;
        }
        if (
          params.watermarkX !== undefined &&
          params.watermarkX !== DEFAULT_TRANSFORM_VALUES.watermarkX
        ) {
          watermark.x = params.watermarkX;
        }
        if (
          params.watermarkY !== undefined &&
          params.watermarkY !== DEFAULT_TRANSFORM_VALUES.watermarkY
        ) {
          watermark.y = params.watermarkY;
        }

        transformations.watermark = watermark;
      }

      const body: TransformRequestBody = { transformations };

      const response = await fetch(`${API_BASE_URL}/api/images/transform?id=${encodeURIComponent(imageId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });

      toast.dismiss(loadingToast);

      const result: ApiResponse<{ imageId: string; publicId: string; status: string; url?: string | null }> =
        await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Transform failed');
      }

      const data = result.data;
      const targetStatusId = data?.imageId || data?.publicId || imageId;

      const startedAt = Date.now();
      const timeoutMs = 30_000;
      const pollIntervalMs = 1_000;

      while (Date.now() - startedAt < timeoutMs) {
        const statusData = await imageService.getUploadStatus(targetStatusId);

        if (statusData.status === 'failed') {
          throw new Error('Image transformation failed on server');
        }

        if (statusData.status === 'completed' && statusData.url) {
          toast.success('Image transformed successfully!');
          return {
            imageId: statusData.id,
            publicId: statusData.publicId ?? imageId,
            status: statusData.status,
            url: statusData.url,
          };
        }

        await delay(pollIntervalMs);
      }

      throw new Error('Transformation is still processing. Try again in a moment.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to transform image';
      toast.error(message);
      throw error;
    }
  },

  async getImage(publicId: string): Promise<{ status: string; data: { url: string } }> {
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

      const data: { status: string; data: { url: string } } = await response.json();
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch image';
      toast.error(message);
      throw error;
    }
  },

  async getUploadStatus(id: string): Promise<UploadStatusData> {
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

      const data: ApiResponse<UploadStatusData> = await response.json();
      return data.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch status';
      toast.error(message);
      throw error;
    }
  },

  async getImages(page = 1, limit = 10): Promise<ImagesResponse> {
    try {
      const query = new URLSearchParams();
      query.append('page', String(page));
      query.append('limit', String(limit));

      const response = await fetch(`${API_BASE_URL}/api/images?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch images');
      }

      const data: ImagesResponse = await response.json();
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch images';
      toast.error(message);
      throw error;
    }
  },

  async getAllImages(limit = 24): Promise<ImageRecord[]> {
    const collectedImages: ImageRecord[] = [];
    let page = 1;

    while (true) {
      const response = await imageService.getImages(page, limit);
      const pageImages = response.data || [];

      collectedImages.push(...pageImages);

      if (pageImages.length < limit) {
        break;
      }

      page += 1;
    }

    return collectedImages;
  },

  async deleteImage(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/images/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete image');
      }

      toast.success('Image deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete image';
      toast.error(message);
      throw error;
    }
  },
};

export default imageService;
