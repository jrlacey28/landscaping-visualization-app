import { apiRequest } from "./queryClient";

export { apiRequest };

// Additional API utilities can be added here
export const uploadImageWithFastSAM2 = async (file: File, tenantId: number, selectedStyles: any) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('tenantId', tenantId.toString());

  // Format the selected styles to match backend expectations
  const roofValue = selectedStyles.roof.enabled && selectedStyles.roof.type ? selectedStyles.roof.type : '';
  const sidingValue = selectedStyles.siding.enabled && selectedStyles.siding.type ? selectedStyles.siding.type : '';
  const surpriseMeValue = selectedStyles.surpriseMe.enabled && selectedStyles.surpriseMe.type ? selectedStyles.surpriseMe.type : '';

  formData.append('selectedRoof', roofValue);
  formData.append('selectedSiding', sidingValue);
  formData.append('selectedSurpriseMe', surpriseMeValue);

  const response = await fetch('/api/fast-edit', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Fast region detection failed');
  }

  return response.json();
};

export const checkFastEditStatus = async (segmentationId: string) => {
  const response = await fetch(`/api/fast-edit/${segmentationId}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to check edit status');
  }

  return response.json();
};

// Keep legacy upload for backward compatibility
export const uploadImage = async (file: File, tenantId: number, selectedStyles: any, maskData?: string) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('tenantId', tenantId.toString());

  // Format the selected styles to match backend expectations
  const roofValue = selectedStyles.roof.enabled && selectedStyles.roof.type ? selectedStyles.roof.type : '';
  const sidingValue = selectedStyles.siding.enabled && selectedStyles.siding.type ? selectedStyles.siding.type : '';
  const surpriseMeValue = selectedStyles.surpriseMe.enabled && selectedStyles.surpriseMe.type ? selectedStyles.surpriseMe.type : '';

  formData.append('selectedRoof', roofValue);
  formData.append('selectedSiding', sidingValue);
  formData.append('selectedSurpriseMe', surpriseMeValue);

  if (maskData) {
    formData.append('maskData', maskData);
  }

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

    // Clean up any Replicate-specific error messages
    let errorMessage = errorData.error || 'Unknown error';
    if (errorMessage.includes('Replicate') || errorMessage.includes('billing')) {
      errorMessage = 'AI processing failed. Please try again.';
    }

    throw new Error(`Upload failed: ${errorMessage}`);
  }

  const data = await response.json();
  return data;
};

export const checkVisualizationStatus = async (visualizationId: number) => {
  const response = await fetch(`/api/visualizations/${visualizationId}/status`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to check status');
  }

  return response.json();
};

export const uploadImageToPublic = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Image upload failed');
  }

  return response.json();
};

export const runSAM2Segmentation = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/segment', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'SAM-2 segmentation failed');
  }

  return response.json();
};

export const checkSAM2Status = async (predictionId: string) => {
  const response = await fetch(`/api/segment/${predictionId}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to check segmentation status');
  }

  return response.json();
};

export const getAllStyles = async () => {
  const response = await fetch('/api/styles', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch styles');
  }

  return response.json();
};

export const getStylesByCategory = async (category: string) => {
  const response = await fetch(`/api/styles/${category}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch styles by category');
  }

  return response.json();
};

export const analyzeLandscapeImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/analyze', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Image analysis failed');
  }

  return response.json();
};