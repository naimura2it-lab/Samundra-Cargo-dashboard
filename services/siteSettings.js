
// services/siteSettings.js
import axiosInstance from '@/lib/axiosInstance';

export const getSiteSettings = async () => {
  try {
    const response = await axiosInstance.get('/site-settings');
    if (response.data.success) {
      return { success: true, data: response.data.data };
    }
    throw new Error(response.data.message || 'Failed to fetch site settings');
  } catch (error) {
    console.error('Get site settings error:', error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch site settings',
    };
  }
};

// payload can contain:
//   { companyName, phone, whatsapp, email, address, fax,
//     logo: File | null, favicon: File | null,
//     removeLogo: boolean, removeFavicon: boolean }
export const updateSiteSettings = async (payload) => {
  try {
    const fd = new FormData();

    // Text fields
    [
      'companyName',
      'phone',
      'whatsapp',
      'email',
      'address',
      'fax',
    ].forEach((k) => {
      if (payload[k] !== undefined) fd.append(k, payload[k] ?? '');
    });

    // Files (only append when a new file was picked)
    if (payload.logo instanceof File) fd.append('logo', payload.logo);
    if (payload.favicon instanceof File) fd.append('favicon', payload.favicon);

    // Flags for deletion
    if (payload.removeLogo) fd.append('removeLogo', 'true');
    if (payload.removeFavicon) fd.append('removeFavicon', 'true');

    const response = await axiosInstance.put('/site-settings', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Site settings updated successfully',
      };
    }
    throw new Error(response.data.message || 'Failed to update site settings');
  } catch (error) {
    console.error('Update site settings error:', error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Failed to update site settings',
    };
  }
};