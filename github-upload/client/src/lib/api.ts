import { apiRequest } from "./queryClient";

export { apiRequest };

// Additional API utilities can be added here
export const uploadImage = async (file: File, tenantId: number, selectedStyles: any, maskData?: string) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('tenantId', tenantId.toString());
  
  // Format the selected styles to match backend expectations
  const curbingValue = selectedStyles.curbing.enabled && selectedStyles.curbing.type ? selectedStyles.curbing.type : '';
  const landscapeValue = selectedStyles.landscape.enabled && selectedStyles.landscape.type ? selectedStyles.landscape.type : '';
  const patioValue = selectedStyles.patio.enabled && selectedStyles.patio.type ? selectedStyles.patio.type : '';
  
  formData.append('selectedCurbing', curbingValue);
  formData.append('selectedLandscape', landscapeValue);
  formData.append('selectedPatio', patioValue);
  
  if (maskData) {
    formData.append('maskData', maskData);
  }

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Upload failed');
  }

  return response.json();
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
