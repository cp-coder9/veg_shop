import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface UploadedImage {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
}

export interface ImageListItem {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
}

export function useUploadImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data as UploadedImage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploaded-images'] });
    },
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (filename: string) => {
      const response = await api.delete(`/upload/image/${filename}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploaded-images'] });
    },
  });
}

export function useUploadedImages() {
  return useQuery<ImageListItem[]>({
    queryKey: ['uploaded-images'],
    queryFn: async () => {
      const response = await api.get('/upload/images');
      return response.data;
    },
  });
}
