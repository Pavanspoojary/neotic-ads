'use client';

/**
 * Creator Tool Onboarding Form Component
 * File path: src/components/ListingForm.tsx
 *
 * Implements Ponytail principles:
 *   - Native React state & controlled form inputs
 *   - Zero heavy form/validation libraries (no react-hook-form, formik, zod)
 *   - Real-time slug auto-generation with kebab-case normalization and manual edit override
 *   - Live VerificationBadge preview reflecting source, DAU, and identifier changes
 *   - Clean Tailwind CSS responsive layout
 */

import React, { useState, useCallback, useId } from 'react';
import {
  Listing,
  ListingCategory,
  AppType,
  VerificationSource,
  CreateListingInput,
} from '../lib/types';
import { VerificationBadge } from './VerificationBadge';
import {
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  RefreshCw,
  PlusCircle,
  Globe,
  Chrome,
  Terminal,
  ShieldCheck,
} from 'lucide-react';

export interface ListingFormProps {
  onSuccess?: (createdListing: Listing) => void;
  onCancel?: () => void;
  existingSlugs?: string[];
}

const CATEGORIES: { id: ListingCategory; label: string; description: string }[] = [
  { id: 'developer-tools', label: 'Developer Tools', description: 'Linters, formatters, debuggers, CLI utilities' },
  { id: 'productivity', label: 'Productivity', description: 'Tab managers, scratchpads, focus tools' },
  { id: 'design', label: 'Design', description: 'Color pickers, SVG tools, font inspectors' },
  { id: 'utilities', label: 'Utilities', description: 'Converters, regex analyzers, system monitors' },
];

const APP_TYPES: { id: AppType; label: string; icon: typeof Globe }[] = [
  { id: 'web_app', label: 'Web Application', icon: Globe },
  { id: 'chrome_extension', label: 'Chrome Extension', icon: Chrome },
  { id: 'desktop_app', label: 'Desktop / CLI App', icon: Terminal },
];

const VERIFICATION_SOURCES: {
  id: VerificationSource;
  label: string;
  placeholder: string;
  helperText: string;
}[] = [
  {
    id: 'chrome_web_store',
    label: 'Chrome Web Store',
    placeholder: 'e.g. nkbihfbeogaeaoehlefnkodbefgpgknn',
    helperText: 'Your 32-character Chrome Web Store extension ID',
  },
  {
    id: 'plausible',
    label: 'Plausible Analytics',
    placeholder: 'e.g. jsonhero.io',
    helperText: 'Configured Plausible tracking domain',
  },
  {
    id: 'posthog',
    label: 'PostHog Analytics',
    placeholder: 'e.g. ph_project_12345',
    helperText: 'PostHog project identifier or domain',
  },
  {
    id: 'ga4',
    label: 'Google Analytics 4',
    placeholder: 'e.g. G-ABC123XYZ',
    helperText: 'GA4 Measurement ID or property domain',
  },
  {
    id: 'manual',
    label: 'SponsorSlot Audited (Manual)',
    placeholder: 'e.g. https://stats.myapp.dev',
    helperText: 'Public dashboard or manual verification reference',
  },
];

const DAU_PRESET_BUTTONS = [1000, 2500, 5000, 12500, 20000];

/**
 * Pure kebab-case normalizer for tool slugs
 */
export function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function ListingForm({ onSuccess, onCancel, existingSlugs = [] }: ListingFormProps) {
  // Controlled form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ListingCategory>('developer-tools');
  const [appType, setAppType] = useState<AppType>('web_app');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [verifiedDau, setVerifiedDau] = useState<number>(2500);
  const [verificationSource, setVerificationSource] = useState<VerificationSource>('chrome_web_store');
  const [verificationIdentifier, setVerificationIdentifier] = useState('');

  // UI status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Field IDs
  const titleId = useId();
  const slugId = useId();
  const descId = useId();
  const websiteId = useId();
  const dauId = useId();
  const idenfierId = useId();

  // Real-time title input handler with auto-slug generation
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      if (!isSlugManuallyEdited) {
        setSlug(normalizeSlug(newTitle));
      }
      if (errors.title) {
        setErrors((prev) => ({ ...prev, title: '' }));
      }
    },
    [isSlugManuallyEdited, errors.title]
  );

  // Manual slug input handler
  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsSlugManuallyEdited(true);
      const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setSlug(cleaned);
      if (errors.slug) {
        setErrors((prev) => ({ ...prev, slug: '' }));
      }
    },
    [errors.slug]
  );

  // Re-sync slug with title
  const handleResetSlugToAuto = useCallback(() => {
    setIsSlugManuallyEdited(false);
    setSlug(normalizeSlug(title));
  }, [title]);

  // Client-side form validation
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Tool title is required.';
    } else if (title.trim().length < 2) {
      newErrors.title = 'Title must be at least 2 characters.';
    }

    if (!slug.trim()) {
      newErrors.slug = 'Slug is required.';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens (no double or trailing hyphens).';
    } else if (existingSlugs.includes(slug)) {
      newErrors.slug = `The slug "${slug}" is already taken by another tool. Please customize it.`;
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required.';
    } else if (description.length > 500) {
      newErrors.description = `Description exceeds 500 characters (${description.length}/500).`;
    }

    if (!websiteUrl.trim()) {
      newErrors.websiteUrl = 'Website or store URL is required.';
    } else if (!websiteUrl.trim().startsWith('https://') && !websiteUrl.trim().startsWith('http://')) {
      newErrors.websiteUrl = 'Website URL must be valid and start with https:// or http://';
    }

    if (isNaN(verifiedDau) || verifiedDau < 0) {
      newErrors.verifiedDau = 'Verified DAU must be a positive number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, slug, description, websiteUrl, verifiedDau, existingSlugs]);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    const payload: CreateListingInput = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim(),
      category,
      app_type: appType,
      website_url: websiteUrl.trim(),
      verified_dau: Number(verifiedDau),
      verification_source: verificationSource,
      verification_identifier: verificationIdentifier.trim() || undefined,
      status: 'active',
    };

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409) {
          setErrors((prev) => ({
            ...prev,
            slug: `The slug "${slug}" is already taken. Please choose another unique slug.`,
          }));
          throw new Error(`The slug "${slug}" already exists.`);
        }
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const resData = await response.json();
      const createdListing: Listing = resData.listing || resData;
      setSuccessMessage(`Success! "${createdListing.title}" has been registered in the marketplace.`);

      if (onSuccess) {
        onSuccess(createdListing);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred while registering your tool.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSourceConfig =
    VERIFICATION_SOURCES.find((s) => s.id === verificationSource) || VERIFICATION_SOURCES[0];

  return (
    <div className="bg-white rounded-xl border border-black/[0.06] shadow-2xs overflow-hidden">
      {/* Form Header */}
      <div className="bg-white p-6 sm:p-8 border-b border-black/[0.05] text-zinc-950">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-500/20 text-emerald-800 text-xs font-medium uppercase tracking-wider mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
          <span>New Tool Onboarding Flow</span>
        </div>
        <h2 className="text-2xl font-display font-bold tracking-tight text-zinc-950">Register Your Micro-Tool</h2>
        <p className="mt-1 text-sm text-zinc-500 max-w-2xl">
          Publish your developer utility or Chrome extension to the marketplace and start
          accepting non-intrusive 30-day sponsorships.
        </p>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
        {/* Error Alert Banner */}
        {submitError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Submission failed: </span>
              {submitError}
            </div>
          </div>
        )}

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">{successMessage}</span>
            </div>
          </div>
        )}

        {/* SECTION 1: Identity & Routing */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-zinc-950 border-b border-black/[0.05] pb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 border border-black/[0.06] text-zinc-800 text-[11px] font-bold">
              1
            </span>
            <span>Tool Identity & Slug</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tool Title */}
            <div>
              <label htmlFor={titleId} className="block text-sm font-medium text-zinc-700 mb-1">
                Tool Title / Name <span className="text-rose-500">*</span>
              </label>
              <input
                id={titleId}
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. TabMaster Pro, RegexForge, JSONHero"
                maxLength={80}
                required
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  errors.title
                    ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/50 text-rose-900 placeholder-rose-400'
                    : 'bg-white border-black/[0.08] text-zinc-950 placeholder-zinc-400 focus:border-zinc-400 focus:ring-zinc-900/5'
                }`}
              />
              {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
            </div>

            {/* Tool Slug with Real-Time Auto Generation & Manual Override */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor={slugId} className="block text-sm font-medium text-zinc-700">
                  Tool Slug (URL Path) <span className="text-rose-500">*</span>
                </label>
                {isSlugManuallyEdited && (
                  <button
                    type="button"
                    onClick={handleResetSlugToAuto}
                    className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Auto-sync with title</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id={slugId}
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="e.g. tabmaster-pro"
                  maxLength={80}
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition-all focus:outline-none focus:ring-2 ${
                    errors.slug
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/50 text-rose-900 placeholder-rose-400'
                      : 'bg-white border-black/[0.08] text-zinc-950 placeholder-zinc-400 focus:border-zinc-400 focus:ring-zinc-900/5'
                  }`}
                />
              </div>
              {errors.slug ? (
                <p className="mt-1 text-xs text-rose-600">{errors.slug}</p>
              ) : (
                <p className="mt-1 text-xs text-zinc-500 flex items-center gap-1">
                  <LinkIcon className="h-3 w-3 opacity-70" />
                  <span>Public URL: </span>
                  <span className="font-mono text-zinc-800 font-medium">
                    neotic.app/tools/{slug || 'tool-slug'}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor={descId} className="block text-sm font-medium text-zinc-700">
                Description <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-xs ${
                  description.length > 450 ? 'text-amber-600 font-semibold' : 'text-zinc-400'
                }`}
              >
                {description.length} / 500
              </span>
            </div>
            <textarea
              id={descId}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
              rows={3}
              maxLength={500}
              placeholder="Describe your tool's functionality, primary user workflows, and target developer audience..."
              required
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.description
                  ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/50 text-rose-900 placeholder-rose-400'
                  : 'bg-white border-black/[0.08] text-zinc-950 placeholder-zinc-400 focus:border-zinc-400 focus:ring-zinc-900/5'
              }`}
            />
            {errors.description && <p className="mt-1 text-xs text-rose-600">{errors.description}</p>}
          </div>
        </div>

        {/* SECTION 2: Category & Architecture */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-zinc-950 border-b border-black/[0.05] pb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 border border-black/[0.06] text-zinc-800 text-[11px] font-bold">
              2
            </span>
            <span>Category & Architecture</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Marketplace Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      category === cat.id
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                        : 'border-black/[0.06] hover:border-black/[0.12] bg-white text-zinc-700'
                    }`}
                  >
                    <div className="text-sm font-semibold">{cat.label}</div>
                    <div className={`text-xs line-clamp-1 ${category === cat.id ? 'text-zinc-300' : 'text-zinc-500'}`}>{cat.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* App Architecture */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                App Architecture
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {APP_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setAppType(type.id)}
                      className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                        appType === type.id
                          ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                          : 'border-black/[0.06] hover:border-black/[0.12] bg-white text-zinc-700'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          appType === type.id ? 'text-emerald-400' : 'text-zinc-400'
                        }`}
                      />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Website / Store URL */}
          <div>
            <label htmlFor={websiteId} className="block text-sm font-medium text-zinc-700 mb-1">
              Website or Store URL <span className="text-rose-500">*</span>
            </label>
            <input
              id={websiteId}
              type="url"
              value={websiteUrl}
              onChange={(e) => {
                setWebsiteUrl(e.target.value);
                if (errors.websiteUrl) setErrors((prev) => ({ ...prev, websiteUrl: '' }));
              }}
              placeholder="https://mytool.dev or https://chromewebstore.google.com/detail/..."
              required
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.websiteUrl
                  ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/50 text-rose-900 placeholder-rose-400'
                  : 'bg-white border-black/[0.08] text-zinc-950 placeholder-zinc-400 focus:border-zinc-400 focus:ring-zinc-900/5'
              }`}
            />
            {errors.websiteUrl ? (
              <p className="mt-1 text-xs text-rose-600">{errors.websiteUrl}</p>
            ) : (
              <p className="mt-1 text-xs text-zinc-500">
                Must start with <code className="font-mono text-zinc-800 font-semibold">https://</code> or <code className="font-mono text-zinc-800 font-semibold">http://</code>
              </p>
            )}
          </div>
        </div>

        {/* SECTION 3: Traffic & Verification Badge */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-zinc-950 border-b border-black/[0.05] pb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 border border-black/[0.06] text-zinc-800 text-[11px] font-bold">
              3
            </span>
            <span>Audience Traffic & Verification Badge</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Verified DAU Input with Presets */}
            <div>
              <label htmlFor={dauId} className="block text-sm font-medium text-zinc-700 mb-1">
                Verified Daily Active Users (DAU) <span className="text-rose-500">*</span>
              </label>
              <input
                id={dauId}
                type="number"
                min={0}
                max={500000}
                value={verifiedDau || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setVerifiedDau(isNaN(val) ? 0 : val);
                  if (errors.verifiedDau) setErrors((prev) => ({ ...prev, verifiedDau: '' }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  errors.verifiedDau
                    ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/50 text-rose-900 placeholder-rose-400'
                    : 'bg-white border-black/[0.08] text-zinc-950 placeholder-zinc-400 focus:border-zinc-400 focus:ring-zinc-900/5'
                }`}
              />
              {errors.verifiedDau && <p className="mt-1 text-xs text-rose-600">{errors.verifiedDau}</p>}

              {/* Quick DAU Presets */}
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-zinc-400 mr-1">Presets:</span>
                {DAU_PRESET_BUTTONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setVerifiedDau(preset)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      verifiedDau === preset
                        ? 'bg-zinc-950 text-white font-medium border-zinc-950 shadow-2xs'
                        : 'bg-zinc-100 text-zinc-600 border border-black/[0.04] hover:bg-zinc-200/60'
                    }`}
                  >
                    {preset.toLocaleString('en-US')}
                  </button>
                ))}
              </div>
            </div>

            {/* Verification Source Selector */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Verification Source
              </label>
              <select
                value={verificationSource}
                onChange={(e) =>
                  setVerificationSource(e.target.value as VerificationSource)
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] text-sm bg-white text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400"
              >
                {VERIFICATION_SOURCES.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-zinc-500">
                Third-party telemetry engine used to audit active users.
              </p>
            </div>
          </div>

          {/* Verification Identifier (Extension ID / Domain) */}
          <div>
            <label htmlFor={idenfierId} className="block text-sm font-medium text-zinc-700 mb-1">
              Verification Identifier <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <input
              id={idenfierId}
              type="text"
              value={verificationIdentifier}
              onChange={(e) => setVerificationIdentifier(e.target.value)}
              placeholder={currentSourceConfig.placeholder}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] text-sm font-mono bg-white text-zinc-950 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400"
            />
            <p className="mt-1 text-xs text-zinc-500">{currentSourceConfig.helperText}</p>
          </div>

          {/* LIVE VERIFICATION BADGE PREVIEW */}
          <div className="mt-4 p-4 rounded-xl border border-black/[0.06] bg-[#fafafa]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Live Verification Badge Preview</span>
              </span>
              <span className="text-xs text-zinc-400">Interactive live preview</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-black/[0.06] shadow-2xs">
              <div className="flex items-center gap-3">
                <VerificationBadge
                  source={verificationSource}
                  dau={verifiedDau > 0 ? verifiedDau : undefined}
                  identifier={verificationIdentifier.trim() || undefined}
                  size="md"
                  showDetails={Boolean(verificationIdentifier.trim())}
                />
              </div>
              <span className="text-xs text-zinc-500">
                This trust badge is highlighted to prospective sponsors on your tool listing.
              </span>
            </div>
          </div>
        </div>

        {/* Submit and Action Buttons */}
        <div className="border-t border-black/[0.05] pt-6 flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-black/[0.06] hover:border-black/[0.12] text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 transition-colors shadow-2xs"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 px-6 py-2.5 text-sm font-medium text-white shadow-xs hover:shadow active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Registering Tool...</span>
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4" />
                <span>Publish Listing to Marketplace</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
