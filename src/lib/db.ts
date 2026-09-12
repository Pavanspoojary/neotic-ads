/**
 * Seam Database Repository Architecture for SponsorSlot
 * File path: src/lib/db.ts
 *
 * Implements Matt Pocock's Deep Module Architecture and explicit seams.
 * Dual-backend repository:
 *   1. SupabaseDatabaseRepository (queries Supabase Cloud / PostgreSQL in production)
 *   2. InMemoryDatabaseRepository (deterministic in-memory fixture store for offline tests & CI)
 */

import {
  Listing,
  InventorySlot,
  Sponsorship,
  ImpressionTelemetry,
  ListingFilters,
  CreateListingInput,
  CreateSlotInput,
  CreateSponsorshipInput,
  SponsorshipStatus,
  SLOT_COPY_LIMITS,
} from './types';
import { calculateEscrowSplit, calculateTermDates, validateRentalRate } from './escrow';
import {
  SEED_LISTINGS,
  SEED_SLOTS,
  SEED_SPONSORSHIPS,
  generateSeedTelemetry,
} from './fixtures';

// ============================================================================
// The Seam Interface (Public Contract)
// ============================================================================

export interface IDatabaseRepository {
  // --- Listings ---
  getListings(filters?: ListingFilters): Promise<Listing[]>;
  getListingBySlug(slug: string): Promise<Listing | null>;
  getListingById(id: string): Promise<Listing | null>;
  createListing(input: CreateListingInput): Promise<Listing>;
  updateListing(id: string, updates: Partial<Listing>): Promise<Listing>;

  // --- Inventory Slots ---
  getSlotsByListingId(listingId: string): Promise<InventorySlot[]>;
  getSlotById(slotId: string): Promise<InventorySlot | null>;
  getAllSlots(): Promise<InventorySlot[]>;
  createSlot(input: CreateSlotInput): Promise<InventorySlot>;
  updateSlot(id: string, updates: Partial<InventorySlot>): Promise<InventorySlot>;

  // --- Sponsorships & Escrow ---
  getActiveSponsorship(slotId: string): Promise<Sponsorship | null>;
  getSponsorshipById(id: string): Promise<Sponsorship | null>;
  getSponsorshipsBySlotId(slotId: string): Promise<Sponsorship[]>;
  createSponsorship(input: CreateSponsorshipInput): Promise<Sponsorship>;
  updateSponsorshipStatus(id: string, status: SponsorshipStatus): Promise<Sponsorship>;

  // --- Telemetry ---
  getTelemetry(slotId: string, days?: number): Promise<ImpressionTelemetry[]>;
  incrementTelemetry(
    slotId: string,
    event: 'impression' | 'click'
  ): Promise<{ impressions_count: number; clicks_count: number }>;

  // --- Test & Seed Lifecycle ---
  reset(): Promise<void>;
}

// ============================================================================
// In-Memory Database Repository (Deterministic Test Store)
// ============================================================================

export class InMemoryDatabaseRepository implements IDatabaseRepository {
  private listings: Map<string, Listing> = new Map();
  private slots: Map<string, InventorySlot> = new Map();
  private sponsorships: Map<string, Sponsorship> = new Map();
  private telemetry: Map<string, ImpressionTelemetry> = new Map(); // key: `${slot_id}:${telemetry_date}`

  constructor() {
    this.seedBaseline();
  }

  private seedBaseline(): void {
    this.listings.clear();
    this.slots.clear();
    this.sponsorships.clear();
    this.telemetry.clear();

    for (const listing of SEED_LISTINGS) {
      this.listings.set(listing.id, { ...listing });
    }

    for (const slot of SEED_SLOTS) {
      this.slots.set(slot.id, { ...slot });
    }

    for (const sponsorship of SEED_SPONSORSHIPS) {
      this.sponsorships.set(sponsorship.id, { ...sponsorship });
    }

    const telemetryData = generateSeedTelemetry();
    for (const t of telemetryData) {
      const key = `${t.slot_id}:${t.telemetry_date}`;
      this.telemetry.set(key, { ...t });
    }
  }

  public async reset(): Promise<void> {
    this.seedBaseline();
  }

  // --- Listings ---

  public async getListings(filters?: ListingFilters): Promise<Listing[]> {
    let result = Array.from(this.listings.values());

    // Status filter (defaults to 'active')
    const targetStatus = filters?.status ?? 'active';
    if (targetStatus) {
      result = result.filter((l) => l.status === targetStatus);
    }

    // Category filter
    if (filters?.category) {
      result = result.filter((l) => l.category === filters.category);
    }

    // App type filter
    if (filters?.app_type) {
      result = result.filter((l) => l.app_type === filters.app_type);
    }

    // Keyword search (q)
    if (filters?.q && filters.q.trim().length > 0) {
      const query = filters.q.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          l.description.toLowerCase().includes(query) ||
          l.slug.toLowerCase().includes(query)
      );
    }

    // Minimum DAU
    if (filters?.min_dau !== undefined && filters.min_dau > 0) {
      result = result.filter((l) => l.verified_dau >= (filters.min_dau ?? 0));
    }

    // Maximum price filter
    if (filters?.max_price_cents !== undefined && filters.max_price_cents > 0) {
      result = result.filter((l) => {
        const toolSlots = Array.from(this.slots.values()).filter((s) => s.listing_id === l.id);
        return toolSlots.some((s) => s.monthly_price_cents <= (filters.max_price_cents ?? Infinity));
      });
    }

    // Available only filter
    if (filters?.available_only) {
      result = result.filter((l) => {
        const toolSlots = Array.from(this.slots.values()).filter((s) => s.listing_id === l.id);
        return toolSlots.some((s) => s.is_available);
      });
    }

    // Sorting
    const sort = filters?.sort ?? 'dau_desc';
    result.sort((a, b) => {
      switch (sort) {
        case 'dau_asc':
          return a.verified_dau - b.verified_dau;
        case 'dau_desc':
          return b.verified_dau - a.verified_dau;
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'price_asc': {
          const minPriceA = Math.min(
            ...Array.from(this.slots.values())
              .filter((s) => s.listing_id === a.id)
              .map((s) => s.monthly_price_cents),
            Infinity
          );
          const minPriceB = Math.min(
            ...Array.from(this.slots.values())
              .filter((s) => s.listing_id === b.id)
              .map((s) => s.monthly_price_cents),
            Infinity
          );
          return minPriceA - minPriceB;
        }
        case 'price_desc': {
          const maxPriceA = Math.max(
            ...Array.from(this.slots.values())
              .filter((s) => s.listing_id === a.id)
              .map((s) => s.monthly_price_cents),
            0
          );
          const maxPriceB = Math.max(
            ...Array.from(this.slots.values())
              .filter((s) => s.listing_id === b.id)
              .map((s) => s.monthly_price_cents),
            0
          );
          return maxPriceB - maxPriceA;
        }
        default:
          return b.verified_dau - a.verified_dau;
      }
    });

    // Pagination & Structured Cloning to prevent external mutation
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? result.length;
    return result.slice(offset, offset + limit).map((l) => ({
      ...l,
      verification_data: l.verification_data ? { ...l.verification_data } : undefined,
    }));
  }

  public async getListingBySlug(slug: string): Promise<Listing | null> {
    const normalized = slug.toLowerCase().trim();
    for (const listing of this.listings.values()) {
      if (listing.slug.toLowerCase() === normalized) {
        return { ...listing };
      }
    }
    return null;
  }

  public async getListingById(id: string): Promise<Listing | null> {
    const listing = this.listings.get(id);
    return listing ? { ...listing } : null;
  }

  public async createListing(input: CreateListingInput): Promise<Listing> {
    if (!input.title || input.title.trim().length === 0) {
      throw new Error('Listing title cannot be empty or whitespace');
    }
    if (!input.website_url || !input.website_url.trim().startsWith('https://')) {
      throw new Error('Listing website_url must be a valid secure URL starting with https://');
    }
    if (input.verified_dau !== undefined && input.verified_dau < 0) {
      throw new Error('Listing verified_dau must be greater than or equal to 0');
    }

    const id = input.id || crypto.randomUUID();
    let slug = input.slug?.toLowerCase().trim();

    if (!slug) {
      slug = input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    if (!slug || slug.length === 0) {
      throw new Error('Generated listing slug cannot be empty');
    }

    // Ensure slug uniqueness
    let finalSlug = slug;
    let counter = 2;
    while (Array.from(this.listings.values()).some((l) => l.slug === finalSlug && l.id !== id)) {
      finalSlug = `${slug}-${counter++}`;
    }

    const now = new Date().toISOString();
    const newListing: Listing = {
      id,
      creator_id: input.creator_id,
      title: input.title.trim(),
      slug: finalSlug,
      description: input.description.trim(),
      category: input.category,
      app_type: input.app_type,
      website_url: input.website_url.trim(),
      verified_dau: input.verified_dau ?? 0,
      verification_source: input.verification_source ?? 'manual',
      verification_identifier: input.verification_identifier,
      verification_data: input.verification_data,
      status: input.status ?? 'active',
      created_at: now,
      updated_at: now,
    };

    this.listings.set(id, newListing);
    return { ...newListing };
  }

  public async updateListing(id: string, updates: Partial<Listing>): Promise<Listing> {
    const existing = this.listings.get(id);
    if (!existing) {
      throw new Error(`Listing not found with ID: ${id}`);
    }

    const updated: Listing = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.listings.set(id, updated);
    return { ...updated };
  }

  // --- Inventory Slots ---

  public async getSlotsByListingId(listingId: string): Promise<InventorySlot[]> {
    return Array.from(this.slots.values())
      .filter((s) => s.listing_id === listingId)
      .map((s) => ({ ...s }));
  }

  public async getSlotById(slotId: string): Promise<InventorySlot | null> {
    const slot = this.slots.get(slotId);
    return slot ? { ...slot } : null;
  }

  public async getAllSlots(): Promise<InventorySlot[]> {
    return Array.from(this.slots.values()).map((s) => ({ ...s }));
  }

  public async createSlot(input: CreateSlotInput): Promise<InventorySlot> {
    const validation = validateRentalRate(input.monthly_price_cents);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const listing = this.listings.get(input.listing_id);
    if (!listing) {
      throw new Error(`Listing not found with ID: ${input.listing_id}`);
    }

    const id = input.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const newSlot: InventorySlot = {
      id,
      listing_id: input.listing_id,
      slot_name: input.slot_name.trim(),
      slot_type: input.slot_type,
      monthly_price_cents: input.monthly_price_cents,
      is_available: input.is_available ?? true,
      max_sponsors: 1,
      guidelines: input.guidelines?.trim(),
      created_at: now,
      updated_at: now,
    };

    this.slots.set(id, newSlot);
    return { ...newSlot };
  }

  public async updateSlot(id: string, updates: Partial<InventorySlot>): Promise<InventorySlot> {
    const existing = this.slots.get(id);
    if (!existing) {
      throw new Error(`Inventory slot not found with ID: ${id}`);
    }

    if (updates.monthly_price_cents !== undefined) {
      const validation = validateRentalRate(updates.monthly_price_cents);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    const updated: InventorySlot = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.slots.set(id, updated);
    return { ...updated };
  }

  // --- Sponsorships & Escrow ---

  public async getActiveSponsorship(slotId: string): Promise<Sponsorship | null> {
    const today = new Date().toISOString().split('T')[0];

    for (const sp of this.sponsorships.values()) {
      if (
        sp.slot_id === slotId &&
        (sp.status === 'active' || sp.status === 'escrow_held') &&
        sp.start_date <= today &&
        sp.end_date >= today
      ) {
        return { ...sp };
      }
    }
    return null;
  }

  public async getSponsorshipById(id: string): Promise<Sponsorship | null> {
    const sp = this.sponsorships.get(id);
    return sp ? { ...sp } : null;
  }

  public async getSponsorshipsBySlotId(slotId: string): Promise<Sponsorship[]> {
    return Array.from(this.sponsorships.values())
      .filter((s) => s.slot_id === slotId)
      .map((s) => ({ ...s }));
  }

  public async createSponsorship(input: CreateSponsorshipInput): Promise<Sponsorship> {
    const slot = this.slots.get(input.slot_id);
    if (!slot) {
      throw new Error(`Slot not found with ID: ${input.slot_id}`);
    }

    if (!slot.is_available) {
      throw new Error(`Slot ${input.slot_id} is currently occupied and unavailable for booking`);
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!input.sponsor_email || !emailRegex.test(input.sponsor_email.trim())) {
      throw new Error('Sponsor email must be a valid email address');
    }

    if (!input.creative_target_url || !input.creative_target_url.trim().startsWith('https://')) {
      throw new Error('Creative target URL must start with https://');
    }

    const amount = input.monthly_amount_cents ?? slot.monthly_price_cents;
    const split = calculateEscrowSplit(amount);
    const term = calculateTermDates(input.start_date);
    const id = input.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const sponsorship: Sponsorship = {
      id,
      slot_id: input.slot_id,
      sponsor_name: input.sponsor_name.trim(),
      sponsor_email: input.sponsor_email.trim(),
      sponsor_id: input.sponsor_id,
      status: 'escrow_held',
      creative_text: input.creative_text.trim(),
      creative_target_url: input.creative_target_url.trim(),
      creative_image_url: input.creative_image_url?.trim(),
      start_date: term.startDate,
      end_date: term.endDate,
      monthly_amount_cents: split.monthly_amount_cents,
      platform_fee_cents: split.platform_fee_cents,
      creator_payout_cents: split.creator_payout_cents,
      created_at: now,
      updated_at: now,
    };

    // Lock the slot atomically in memory
    slot.is_available = false;
    slot.updated_at = now;
    this.slots.set(slot.id, slot);

    this.sponsorships.set(id, sponsorship);
    return { ...sponsorship };
  }

  public async bookSlot(params: {
    slot_id: string;
    sponsor_name: string;
    sponsor_email: string;
    creative_text: string;
    creative_target_url: string;
    creative_image_url?: string;
  }): Promise<{ success: boolean; sponsorship?: Sponsorship; error?: string }> {
    const slot = this.slots.get(params.slot_id);
    if (!slot) {
      return { success: false, error: 'SLOT_NOT_FOUND' };
    }
    if (!slot.is_available) {
      return { success: false, error: 'SLOT_ALREADY_BOOKED' };
    }

    const limit = SLOT_COPY_LIMITS[slot.slot_type] || 80;
    if (params.creative_text.length > limit) {
      return { success: false, error: `COPY_EXCEEDS_LIMIT_MAX_${limit}` };
    }

    if (!params.creative_target_url.startsWith('https://')) {
      return { success: false, error: 'INVALID_URL_MUST_BE_HTTPS' };
    }

    try {
      const sponsorship = await this.createSponsorship(params);
      return { success: true, sponsorship };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async updateSponsorshipStatus(id: string, status: SponsorshipStatus): Promise<Sponsorship> {
    const sp = this.sponsorships.get(id);
    if (!sp) {
      throw new Error(`Sponsorship not found with ID: ${id}`);
    }

    sp.status = status;
    sp.updated_at = new Date().toISOString();

    // If sponsorship is completed or cancelled, make the slot available again
    if (status === 'completed' || status === 'cancelled') {
      const slot = this.slots.get(sp.slot_id);
      if (slot) {
        slot.is_available = true;
        this.slots.set(slot.id, slot);
      }
    }

    this.sponsorships.set(id, sp);
    return { ...sp };
  }

  // --- Telemetry ---

  public async getTelemetry(slotId: string, days = 30): Promise<ImpressionTelemetry[]> {
    const today = new Date();
    const cutoff = new Date(today.getTime() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const results = Array.from(this.telemetry.values())
      .filter((t) => t.slot_id === slotId && t.telemetry_date >= cutoff)
      .sort((a, b) => a.telemetry_date.localeCompare(b.telemetry_date));

    return results.map((r) => ({ ...r }));
  }

  public async incrementTelemetry(
    slotId: string,
    event: 'impression' | 'click'
  ): Promise<{ impressions_count: number; clicks_count: number }> {
    const slot = this.slots.get(slotId);
    if (!slot) {
      throw new Error(`Slot not found: ${slotId}`);
    }

    const today = new Date().toISOString().split('T')[0];
    const key = `${slotId}:${today}`;
    const existing = this.telemetry.get(key);

    if (existing) {
      if (event === 'impression') {
        existing.impressions_count += 1;
      } else if (event === 'click') {
        if (existing.clicks_count + 1 > existing.impressions_count) {
          throw new Error('Clicks count cannot exceed impressions count (violates chk_clicks_leq_impressions)');
        }
        existing.clicks_count += 1;
      }
      this.telemetry.set(key, existing);
      return {
        impressions_count: existing.impressions_count,
        clicks_count: existing.clicks_count,
      };
    } else {
      if (event === 'click') {
        throw new Error('Clicks count cannot exceed impressions count (violates chk_clicks_leq_impressions)');
      }
      const newRecord: ImpressionTelemetry = {
        slot_id: slotId,
        telemetry_date: today,
        impressions_count: 1,
        clicks_count: 0,
      };
      this.telemetry.set(key, newRecord);
      return {
        impressions_count: newRecord.impressions_count,
        clicks_count: newRecord.clicks_count,
      };
    }
  }
}

// ============================================================================
// Supabase Cloud Database Repository (Production PostgreSQL)
// ============================================================================

export class SupabaseDatabaseRepository implements IDatabaseRepository {
  private supabaseUrl: string;
  private supabaseKey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }

  private async getClient() {
    if (!this.client) {
      const { createClient } = await import('@supabase/supabase-js');
      this.client = createClient(this.supabaseUrl, this.supabaseKey);
    }
    return this.client;
  }

  public async reset(): Promise<void> {
    console.warn('[SupabaseDatabaseRepository] reset() called in production mode. Operation ignored.');
  }

  public async getListings(filters?: ListingFilters): Promise<Listing[]> {
    const supabase = await this.getClient();
    let query = supabase.from('listings').select('*');

    const targetStatus = filters?.status ?? 'active';
    if (targetStatus) {
      query = query.eq('status', targetStatus);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.app_type) {
      query = query.eq('app_type', filters.app_type);
    }

    if (filters?.min_dau) {
      query = query.gte('verified_dau', filters.min_dau);
    }

    if (filters?.q && filters.q.trim().length > 0) {
      const search = `%${filters.q.trim()}%`;
      query = query.or(`title.ilike.${search},description.ilike.${search}`);
    }

    const sort = filters?.sort ?? 'dau_desc';
    if (sort === 'dau_desc') {
      query = query.order('verified_dau', { ascending: false });
    } else if (sort === 'dau_asc') {
      query = query.order('verified_dau', { ascending: true });
    } else if (sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    }

    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 20) - 1);
    } else if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Supabase getListings error: ${error.message}`);
    return data || [];
  }

  public async getListingBySlug(slug: string): Promise<Listing | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('slug', slug.toLowerCase().trim())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Supabase getListingBySlug error: ${error.message}`);
    }
    return data || null;
  }

  public async getListingById(id: string): Promise<Listing | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('listings').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Supabase getListingById error: ${error.message}`);
    }
    return data || null;
  }

  public async createListing(input: CreateListingInput): Promise<Listing> {
    const supabase = await this.getClient();
    let slug = input.slug?.toLowerCase().trim();
    if (!slug) {
      slug = input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const payload = {
      ...input,
      slug,
      status: input.status ?? 'active',
      verified_dau: input.verified_dau ?? 0,
    };

    const { data, error } = await supabase.from('listings').insert(payload).select().single();
    if (error) throw new Error(`Supabase createListing error: ${error.message}`);
    return data;
  }

  public async updateListing(id: string, updates: Partial<Listing>): Promise<Listing> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('listings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Supabase updateListing error: ${error.message}`);
    return data;
  }

  public async getSlotsByListingId(listingId: string): Promise<InventorySlot[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('inventory_slots')
      .select('*')
      .eq('listing_id', listingId);

    if (error) throw new Error(`Supabase getSlotsByListingId error: ${error.message}`);
    return data || [];
  }

  public async getSlotById(slotId: string): Promise<InventorySlot | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('inventory_slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Supabase getSlotById error: ${error.message}`);
    }
    return data || null;
  }

  public async getAllSlots(): Promise<InventorySlot[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('inventory_slots').select('*');
    if (error) throw new Error(`Supabase getAllSlots error: ${error.message}`);
    return data || [];
  }

  public async createSlot(input: CreateSlotInput): Promise<InventorySlot> {
    const validation = validateRentalRate(input.monthly_price_cents);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const supabase = await this.getClient();
    const payload = {
      ...input,
      is_available: input.is_available ?? true,
      max_sponsors: 1,
    };

    const { data, error } = await supabase.from('inventory_slots').insert(payload).select().single();
    if (error) throw new Error(`Supabase createSlot error: ${error.message}`);
    return data;
  }

  public async updateSlot(id: string, updates: Partial<InventorySlot>): Promise<InventorySlot> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('inventory_slots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Supabase updateSlot error: ${error.message}`);
    return data;
  }

  public async getActiveSponsorship(slotId: string): Promise<Sponsorship | null> {
    const supabase = await this.getClient();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('sponsorships')
      .select('*')
      .eq('slot_id', slotId)
      .in('status', ['active', 'escrow_held'])
      .lte('start_date', today)
      .gte('end_date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Supabase getActiveSponsorship error: ${error.message}`);
    return data || null;
  }

  public async getSponsorshipById(id: string): Promise<Sponsorship | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.from('sponsorships').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Supabase getSponsorshipById error: ${error.message}`);
    }
    return data || null;
  }

  public async getSponsorshipsBySlotId(slotId: string): Promise<Sponsorship[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('sponsorships')
      .select('*')
      .eq('slot_id', slotId);

    if (error) throw new Error(`Supabase getSponsorshipsBySlotId error: ${error.message}`);
    return data || [];
  }

  public async createSponsorship(input: CreateSponsorshipInput): Promise<Sponsorship> {
    const supabase = await this.getClient();

    // Atomic compare-and-swap update: marks slot unavailable ONLY if it is currently available
    const { data: updatedSlot, error: casError } = await supabase
      .from('inventory_slots')
      .update({ is_available: false, updated_at: new Date().toISOString() })
      .eq('id', input.slot_id)
      .eq('is_available', true)
      .select()
      .maybeSingle();

    if (casError) {
      throw new Error(`Failed to reserve slot via compare-and-swap: ${casError.message}`);
    }
    if (!updatedSlot) {
      throw new Error(`Slot ${input.slot_id} is currently unavailable or does not exist`);
    }

    const amount = input.monthly_amount_cents ?? updatedSlot.monthly_price_cents;
    const split = calculateEscrowSplit(amount);
    const term = calculateTermDates(input.start_date);

    const payload = {
      slot_id: input.slot_id,
      sponsor_name: input.sponsor_name,
      sponsor_email: input.sponsor_email,
      sponsor_id: input.sponsor_id,
      status: 'escrow_held',
      creative_text: input.creative_text,
      creative_target_url: input.creative_target_url,
      creative_image_url: input.creative_image_url,
      start_date: term.startDate,
      end_date: term.endDate,
      monthly_amount_cents: split.monthly_amount_cents,
      platform_fee_cents: split.platform_fee_cents,
      creator_payout_cents: split.creator_payout_cents,
    };

    const { data, error } = await supabase.from('sponsorships').insert(payload).select().single();
    if (error) {
      // Roll back slot reservation if sponsorship insert fails
      await supabase.from('inventory_slots').update({ is_available: true }).eq('id', input.slot_id);
      throw new Error(`Supabase createSponsorship error: ${error.message}`);
    }
    return data;
  }

  public async updateSponsorshipStatus(id: string, status: SponsorshipStatus): Promise<Sponsorship> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('sponsorships')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Supabase updateSponsorshipStatus error: ${error.message}`);

    if (status === 'completed' || status === 'cancelled') {
      if (data?.slot_id) {
        await this.updateSlot(data.slot_id, { is_available: true });
      }
    }

    return data;
  }

  public async getTelemetry(slotId: string, days = 30): Promise<ImpressionTelemetry[]> {
    const supabase = await this.getClient();
    const today = new Date();
    const cutoff = new Date(today.getTime() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabase
      .from('impression_telemetry')
      .select('*')
      .eq('slot_id', slotId)
      .gte('telemetry_date', cutoff)
      .order('telemetry_date', { ascending: true });

    if (error) throw new Error(`Supabase getTelemetry error: ${error.message}`);
    return data || [];
  }

  public async incrementTelemetry(
    slotId: string,
    event: 'impression' | 'click'
  ): Promise<{ impressions_count: number; clicks_count: number }> {
    const supabase = await this.getClient();
    const today = new Date().toISOString().split('T')[0];

    // Atomic PostgreSQL upsert
    const { data, error } = await supabase.rpc('increment_slot_telemetry', {
      p_slot_id: slotId,
      p_date: today,
      p_event: event,
    });

    if (error) {
      // Fallback to manual fetch-then-upsert if RPC not yet declared
      const { data: current } = await supabase
        .from('impression_telemetry')
        .select('*')
        .eq('slot_id', slotId)
        .eq('telemetry_date', today)
        .maybeSingle();

      const newImp = (current?.impressions_count || 0) + (event === 'impression' ? 1 : 0);
      const newClk = (current?.clicks_count || 0) + (event === 'click' ? 1 : 0);

      await supabase.from('impression_telemetry').upsert({
        slot_id: slotId,
        telemetry_date: today,
        impressions_count: newImp,
        clicks_count: newClk,
      });

      return { impressions_count: newImp, clicks_count: newClk };
    }

    return data || { impressions_count: 1, clicks_count: 0 };
  }
}

// ============================================================================
// Database Singleton Accessor & Factory
// ============================================================================

let globalDbInstance: IDatabaseRepository | null = null;

/**
 * Returns the active database repository instance.
 * Automatically switches to Supabase in production with valid credentials,
 * or InMemoryDatabaseRepository in development/test/offline mode.
 */
export function getDb(): IDatabaseRepository {
  if (globalDbInstance) {
    return globalDbInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const forceInMemory =
    process.env.USE_IN_MEMORY_DB === 'true' || process.env.NODE_ENV === 'test' || !supabaseUrl || !supabaseKey;

  if (!forceInMemory && supabaseUrl && supabaseKey) {
    globalDbInstance = new SupabaseDatabaseRepository(supabaseUrl, supabaseKey);
  } else {
    globalDbInstance = new InMemoryDatabaseRepository();
  }

  return globalDbInstance;
}

/**
 * Explicitly replaces the database repository instance (useful for test mocks or sandbox isolation).
 */
export function setDb(customDb: IDatabaseRepository): void {
  globalDbInstance = customDb;
}

/**
 * Resets the in-memory store to seed fixtures. Useful in `beforeEach` test blocks.
 */
export async function resetInMemoryDb(): Promise<void> {
  const db = getDb();
  await db.reset();
}
