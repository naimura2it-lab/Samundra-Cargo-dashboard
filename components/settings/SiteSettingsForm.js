

'use client';

import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { HiOutlineCog, HiOutlinePhotograph, HiOutlineTrash } from 'react-icons/hi';
import { getSiteSettings, updateSiteSettings } from '@/services/siteSettings';
import { getAuthToken } from '@/utils/SessionHelper';
import { useRouter } from 'next/navigation';

const EMPTY = {
  logo: '',
  favicon: '',
  companyName: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  fax: '',
};

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const MAX_FAVICON_BYTES = 5 * 1024 * 1024;

export default function SiteSettingsForm() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  const [form, setForm] = useState(EMPTY);

  // Newly picked files (kept as File objects until submit)
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);

  // Blob previews for newly picked files
  const [logoPreview, setLogoPreview] = useState('');
  const [faviconPreview, setFaviconPreview] = useState('');

  // Deletion flags
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeFavicon, setRemoveFavicon] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/');
      return;
    }
    (async () => {
      const res = await getSiteSettings();
      if (res.success && res.data) {
        setForm({ ...EMPTY, ...res.data });
      } else {
        toast.error(res.message || 'Failed to load settings');
      }
      setLoading(false);
    })();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ---- LOGO ----
  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error('Logo must be under 5MB');
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setRemoveLogo(false);
  };

  const removeLogoClick = () => {
    setLogoFile(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview('');
    setRemoveLogo(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---- FAVICON ----
  const handleFaviconSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isIco = file.type === 'image/x-icon' || file.name.endsWith('.ico');
    if (!file.type.startsWith('image/') && !isIco) {
      toast.error('Please select an image (PNG/SVG)');
      return;
    }
    // Cloudinary doesn't accept .ico in allowed_formats — ask for PNG/SVG instead.
    if (isIco) {
      toast.error('Please use a PNG or SVG favicon — .ico is not supported');
      return;
    }
    if (file.size > MAX_FAVICON_BYTES) {
      toast.error('Favicon must be under 5MB');
      return;
    }

    setFaviconFile(file);
    setFaviconPreview(URL.createObjectURL(file));
    setRemoveFavicon(false);
  };

  const removeFaviconClick = () => {
    setFaviconFile(null);
    if (faviconPreview) URL.revokeObjectURL(faviconPreview);
    setFaviconPreview('');
    setRemoveFavicon(true);
    if (faviconInputRef.current) faviconInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const t = toast.loading('Saving settings...');

    const res = await updateSiteSettings({
      companyName: form.companyName,
      phone: form.phone,
      whatsapp: form.whatsapp,
      email: form.email,
      address: form.address,
      fax: form.fax,
      logo: logoFile,
      favicon: faviconFile,
      removeLogo,
      removeFavicon,
    });

    toast.dismiss(t);
    if (res.success) {
      toast.success('Site settings updated successfully');
      if (res.data) {
        setForm({ ...EMPTY, ...res.data });
        if (logoPreview) URL.revokeObjectURL(logoPreview);
        if (faviconPreview) URL.revokeObjectURL(faviconPreview);
        setLogoPreview('');
        setFaviconPreview('');
        setLogoFile(null);
        setFaviconFile(null);
        setRemoveLogo(false);
        setRemoveFavicon(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (faviconInputRef.current) faviconInputRef.current.value = '';
      }
    } else {
      toast.error(res.message || 'Failed to save settings');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Prefer blob preview if a new file is picked; otherwise show stored URL.
  const logoPreviewSrc = logoPreview || (!removeLogo ? form.logo : '');
  const faviconPreviewSrc =
    faviconPreview || (!removeFavicon ? form.favicon : '');

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <HiOutlineCog className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Site Settings</h1>
          <p className="text-sm text-gray-500">
            Control the logo & contact info shown across the public website.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-6"
      >
        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-28 h-20 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
              {logoPreviewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreviewSrc} alt="Logo preview" className="max-w-full max-h-full object-contain" />
              ) : (
                <HiOutlinePhotograph className="w-8 h-8 text-gray-300" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="block text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
              {logoPreviewSrc && (
                <button
                  type="button"
                  onClick={removeLogoClick}
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                >
                  <HiOutlineTrash className="w-4 h-4" /> Remove logo
                </button>
              )}
              <p className="text-xs text-gray-400">
                PNG/JPG/SVG up to 5MB. Uploaded to Cloudinary (auto-resized to 400px).
              </p>
            </div>
          </div>
        </div>

        {/* Favicon */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Favicon (browser tab icon)
          </label>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-12 h-12 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
              {faviconPreviewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={faviconPreviewSrc} alt="Favicon preview" className="max-w-full max-h-full object-contain" />
              ) : (
                <HiOutlinePhotograph className="w-6 h-6 text-gray-300" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                onChange={handleFaviconSelect}
                className="block text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
              {faviconPreviewSrc && (
                <button
                  type="button"
                  onClick={removeFaviconClick}
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                >
                  <HiOutlineTrash className="w-4 h-4" /> Remove favicon
                </button>
              )}
              <p className="text-xs text-gray-400">
                Square PNG or SVG, 32×32 or 64×64. Auto-resized to 64px.
              </p>
            </div>
          </div>
        </div>

        <Field label="Company Name" name="companyName" value={form.companyName} onChange={handleChange} placeholder="Samudera Traffic Co., Ltd." />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+66977830395" />
          <Field label="WhatsApp Number" name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="66977830395" hint="Digits only, no +" />
          <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="info@example.com" />
          <Field label="Fax" name="fax" value={form.fax} onChange={handleChange} placeholder="Optional" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address / Head Office</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={3}
            placeholder="Full head office address"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition text-sm resize-none"
          />
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, type = 'text', hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition text-sm"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}