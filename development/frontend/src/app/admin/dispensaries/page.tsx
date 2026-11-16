'use client';

import React, { useEffect, useState } from 'react';
import {
  Store,
  Plus,
  Edit2,
  Clock,
  MapPin,
  Truck,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AdminDispensaryDto } from '@/types/api.generated';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function AdminDispensariesPage() {
  const [dispensaries, setDispensaries] = useState<AdminDispensaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDispensary, setEditingDispensary] = useState<AdminDispensaryDto | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    licenseNumber: '',
    addressLine1: '',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    offersPickup: true,
    offersDelivery: true,
    coverageZips: ['10001', '10002', '10003'],
    handoffChannel: 'RETAILER_PAGE',
    handoffUrlTemplate: '',
    leaflyStoreId: '',
    isActive: true,
    hours: [] as any[],
  });

  const [newZipInput, setNewZipInput] = useState('');
  const [activeHoursTab, setActiveHoursTab] = useState<'STORE' | 'DELIVERY'>('STORE');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDispensaries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/dispensaries');
      const json = await res.json();
      if (json.success) {
        setDispensaries(json.data.items);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDispensaries();
  }, []);

  const openCreateModal = () => {
    setEditingDispensary(null);

    // Initial 7 days store & 7 days delivery hours
    const initialHours: any[] = [];
    for (let day = 0; day < 7; day++) {
      initialHours.push({
        kind: 'STORE',
        dayOfWeek: day,
        opensAt: '09:00',
        closesAt: '21:00',
        isClosed: false,
      });
      initialHours.push({
        kind: 'DELIVERY',
        dayOfWeek: day,
        opensAt: '10:00',
        closesAt: '20:00',
        isClosed: false,
      });
    }

    setFormData({
      name: '',
      slug: '',
      licenseNumber: 'OCM-CAURD-2024-001',
      addressLine1: '',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      offersPickup: true,
      offersDelivery: true,
      coverageZips: ['10001', '10002', '10003'],
      handoffChannel: 'RETAILER_PAGE',
      handoffUrlTemplate: 'https://store.example.com/checkout?ref={subOrderId}',
      leaflyStoreId: '',
      isActive: true,
      hours: initialHours,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (dispensary: AdminDispensaryDto) => {
    setEditingDispensary(dispensary);
    setIsSubmitting(true);
    try {
      // Fetch full details with hours
      const res = await fetch(`/api/admin/dispensaries/${dispensary.id}`);
      const json = await res.json();
      const d = json.data;

      // Populate hours or default
      const hoursMap = new Map();
      (d.hours || []).forEach((h: any) => {
        hoursMap.set(`${h.kind}_${h.dayOfWeek}`, h);
      });

      const populatedHours: any[] = [];
      for (const kind of ['STORE', 'DELIVERY']) {
        for (let day = 0; day < 7; day++) {
          const existing = hoursMap.get(`${kind}_${day}`);
          populatedHours.push(
            existing || {
              kind,
              dayOfWeek: day,
              opensAt: kind === 'STORE' ? '09:00' : '10:00',
              closesAt: kind === 'STORE' ? '21:00' : '20:00',
              isClosed: false,
            }
          );
        }
      }

      setFormData({
        name: d.name,
        slug: d.slug,
        licenseNumber: d.licenseNumber || '',
        addressLine1: d.addressLine1,
        city: d.city,
        state: d.state,
        zip: d.zip,
        offersPickup: d.offersPickup,
        offersDelivery: d.offersDelivery,
        coverageZips: d.coverageZips || [],
        handoffChannel: d.handoffChannel || 'RETAILER_PAGE',
        handoffUrlTemplate: d.handoffUrlTemplate || '',
        leaflyStoreId: d.leaflyStoreId || '',
        isActive: d.isActive,
        hours: populatedHours,
      });

      setFormError(null);
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddZip = () => {
    const trimmed = newZipInput.trim();
    if (!trimmed || !/^\d{5}$/.test(trimmed)) {
      setFormError('Please enter a valid 5-digit US postal ZIP code.');
      return;
    }
    if (formData.coverageZips.includes(trimmed)) {
      setNewZipInput('');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      coverageZips: [...prev.coverageZips, trimmed],
    }));
    setNewZipInput('');
    setFormError(null);
  };

  const handleRemoveZip = (zipToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      coverageZips: prev.coverageZips.filter((z) => z !== zipToRemove),
    }));
  };

  const handleHourFieldChange = (
    kind: 'STORE' | 'DELIVERY',
    dayOfWeek: number,
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      hours: prev.hours.map((h) => {
        if (h.kind === kind && h.dayOfWeek === dayOfWeek) {
          return { ...h, [field]: value };
        }
        return h;
      }),
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.addressLine1 || !formData.zip) {
      setFormError('Name, Address, and ZIP code are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const url = editingDispensary
        ? `/api/admin/dispensaries/${editingDispensary.id}`
        : '/api/admin/dispensaries';
      const method = editingDispensary ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setFormError(json.error?.message || 'Failed to save dispensary');
        setIsSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      fetchDispensaries();
    } catch {
      setFormError('Network communication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-['Dela_Gothic_One'] tracking-tight">
            LICENSED DISPENSARIES
          </h1>
          <p className="text-[#BBD7D1] text-sm mt-1">
            Configure partner dispensaries, delivery coverage ZIPs, and operating/delivery hours.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-[#70F1C7] hover:bg-[#85ffda] text-[#0D221E] font-bold h-11 px-5 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Licensed Dispensary
        </Button>
      </div>

      {/* Dispensaries Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-[#0D221E] border-[#1A3832]">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-40 bg-[#122A25]" />
                <Skeleton className="h-4 w-32 bg-[#122A25]" />
                <Skeleton className="h-8 w-24 bg-[#122A25]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : dispensaries.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title="No Dispensaries Configured"
            description="Add licensed partner dispensaries to enable fulfillment across New York regions."
            action={{
              label: 'Add Partner Dispensary',
              onClick: openCreateModal,
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dispensaries.map((d) => (
            <Card
              key={d.id}
              className="bg-[#0D221E] border-[#1A3832] hover:border-[#70F1C7]/30 transition-all flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white font-['Dela_Gothic_One']">
                      {d.name}
                    </h3>
                    <div className="text-xs text-[#BBD7D1]/70 font-mono mt-0.5">
                      {d.licenseNumber || 'Licensed Partner'}
                    </div>
                  </div>
                  {d.isActive ? (
                    <Badge className="bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-xs">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-800 text-gray-400 text-xs">Inactive</Badge>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-[#BBD7D1]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#70F1C7]" />
                    <span>
                      {d.addressLine1}, {d.city}, {d.state} {d.zip}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {d.offersPickup && (
                      <Badge className="bg-[#70F1C7]/10 text-[#70F1C7] border border-[#70F1C7]/30 text-[11px]">
                        <ShoppingBag className="w-3 h-3 mr-1" />
                        Dispensary Pickup
                      </Badge>
                    )}
                    {d.offersDelivery && (
                      <Badge className="bg-purple-950/60 text-purple-300 border border-purple-800 text-[11px]">
                        <Truck className="w-3 h-3 mr-1" />
                        Delivery ({d.coverageZips?.length || 0} ZIPs)
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1A3832] flex items-center justify-between text-xs text-[#BBD7D1]/60">
                  <span>Handoff: {d.handoffChannel}</span>
                  <span>{d.hoursCount} Hours Windows</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(d)}
                  className="w-full bg-[#122A25] border-[#1A3832] text-white hover:text-[#70F1C7] hover:border-[#70F1C7] h-9 mt-2"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                  Edit Configuration & Hours
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0D221E] border border-[#1A3832] rounded-2xl max-w-3xl w-full p-6 text-white space-y-6 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1A3832] pb-4">
              <h2 className="text-xl font-bold font-['Dela_Gothic_One']">
                {editingDispensary ? `Edit ${editingDispensary.name}` : 'Add Licensed Dispensary'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-red-950/60 border border-red-800 text-red-200 text-sm flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                    Dispensary Name *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Gotham Greenery"
                    className="bg-[#071311] border-[#1A3832] text-white h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                    NY OCM License Number
                  </label>
                  <Input
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    placeholder="OCM-CAURD-2024-xxx"
                    className="bg-[#071311] border-[#1A3832] text-white h-10"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                    Address Line 1 *
                  </label>
                  <Input
                    required
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    placeholder="123 Bowery"
                    className="bg-[#071311] border-[#1A3832] text-white h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                    City
                  </label>
                  <Input
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="bg-[#071311] border-[#1A3832] text-white h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                    ZIP Code *
                  </label>
                  <Input
                    required
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="bg-[#071311] border-[#1A3832] text-white h-10 font-mono"
                  />
                </div>
              </div>

              {/* Fulfillment Capabilities */}
              <div className="p-4 rounded-xl bg-[#071311] border border-[#1A3832] space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#70F1C7]">
                  Fulfillment Capabilities
                </div>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={formData.offersPickup}
                      onChange={(e) => setFormData({ ...formData, offersPickup: e.target.checked })}
                      className="w-4 h-4 rounded text-[#70F1C7]"
                    />
                    <span>Offers Dispensary Pickup</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={formData.offersDelivery}
                      onChange={(e) => setFormData({ ...formData, offersDelivery: e.target.checked })}
                      className="w-4 h-4 rounded text-[#70F1C7]"
                    />
                    <span>Offers Direct Delivery</span>
                  </label>
                </div>

                {/* CoverageZipPicker */}
                {formData.offersDelivery && (
                  <div className="space-y-2 pt-2 border-t border-[#1A3832]">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                      Delivery Coverage ZIP Codes ({formData.coverageZips.length} ZIPs configured)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={newZipInput}
                        onChange={(e) => setNewZipInput(e.target.value)}
                        placeholder="Add 5-digit ZIP (e.g. 10001)"
                        className="w-44 bg-[#0D221E] border-[#1A3832] text-white h-9 font-mono"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddZip();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleAddZip}
                        className="bg-[#122A25] border border-[#1A3832] text-[#70F1C7] hover:bg-[#70F1C7] hover:text-[#0D221E] h-9 px-3 text-xs"
                      >
                        Add ZIP
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                      {formData.coverageZips.map((zip) => (
                        <span
                          key={zip}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#122A25] border border-[#1A3832] text-white font-mono text-xs"
                        >
                          {zip}
                          <button
                            type="button"
                            onClick={() => handleRemoveZip(zip)}
                            className="text-gray-400 hover:text-red-400 ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* HoursEditor (Store and Delivery Tabs) */}
              <div className="p-4 rounded-xl bg-[#071311] border border-[#1A3832] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#70F1C7] flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Operating & Delivery Windows (America/New_York)
                  </div>
                  <div className="flex gap-1 bg-[#0D221E] p-1 rounded-lg border border-[#1A3832]">
                    <button
                      type="button"
                      onClick={() => setActiveHoursTab('STORE')}
                      className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                        activeHoursTab === 'STORE'
                          ? 'bg-[#70F1C7] text-[#0D221E] font-bold'
                          : 'text-[#BBD7D1] hover:text-white'
                      }`}
                    >
                      Store Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveHoursTab('DELIVERY')}
                      className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                        activeHoursTab === 'DELIVERY'
                          ? 'bg-[#70F1C7] text-[#0D221E] font-bold'
                          : 'text-[#BBD7D1] hover:text-white'
                      }`}
                    >
                      Delivery Hours
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {DAYS_OF_WEEK.map((dayName, dayIndex) => {
                    const hourRow =
                      formData.hours.find(
                        (h) => h.kind === activeHoursTab && h.dayOfWeek === dayIndex
                      ) || {
                        opensAt: '09:00',
                        closesAt: '21:00',
                        isClosed: false,
                      };

                    return (
                      <div
                        key={dayIndex}
                        className="flex items-center justify-between gap-3 py-1.5 border-b border-[#1A3832]/50 text-xs"
                      >
                        <span className="w-24 font-medium text-[#BBD7D1]">{dayName}</span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 cursor-pointer text-gray-400 text-xs mr-2">
                            <input
                              type="checkbox"
                              checked={hourRow.isClosed}
                              onChange={(e) =>
                                handleHourFieldChange(
                                  activeHoursTab,
                                  dayIndex,
                                  'isClosed',
                                  e.target.checked
                                )
                              }
                              className="w-3.5 h-3.5 rounded"
                            />
                            <span>Closed</span>
                          </label>

                          {!hourRow.isClosed ? (
                            <>
                              <Input
                                type="time"
                                value={hourRow.opensAt}
                                onChange={(e) =>
                                  handleHourFieldChange(
                                    activeHoursTab,
                                    dayIndex,
                                    'opensAt',
                                    e.target.value
                                  )
                                }
                                className="w-24 bg-[#0D221E] border-[#1A3832] text-white h-8 text-xs font-mono"
                              />
                              <span className="text-gray-400">to</span>
                              <Input
                                type="time"
                                value={hourRow.closesAt}
                                onChange={(e) =>
                                  handleHourFieldChange(
                                    activeHoursTab,
                                    dayIndex,
                                    'closesAt',
                                    e.target.value
                                  )
                                }
                                className="w-24 bg-[#0D221E] border-[#1A3832] text-white h-8 text-xs font-mono"
                              />
                            </>
                          ) : (
                            <span className="w-52 text-center text-red-400/80 italic text-xs">
                              Store Closed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Handoff Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                    Checkout Handoff Channel
                  </label>
                  <select
                    value={formData.handoffChannel}
                    onChange={(e) => setFormData({ ...formData, handoffChannel: e.target.value })}
                    className="w-full bg-[#071311] border border-[#1A3832] text-white rounded-md px-3 h-10 text-sm"
                  >
                    <option value="RETAILER_PAGE">Retailer Website (Direct Menu URL)</option>
                    <option value="LEAFLY">Leafly Integration (Pickup/Delivery Link)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#BBD7D1]">
                    {formData.handoffChannel === 'LEAFLY' ? 'Leafly Store ID' : 'Handoff URL Template'}
                  </label>
                  {formData.handoffChannel === 'LEAFLY' ? (
                    <Input
                      value={formData.leaflyStoreId}
                      onChange={(e) => setFormData({ ...formData, leaflyStoreId: e.target.value })}
                      placeholder="leafly-store-id-xxx"
                      className="bg-[#071311] border-[#1A3832] text-white h-10"
                    />
                  ) : (
                    <Input
                      value={formData.handoffUrlTemplate}
                      onChange={(e) => setFormData({ ...formData, handoffUrlTemplate: e.target.value })}
                      placeholder="https://retailer.com/order?ref={subOrderId}"
                      className="bg-[#071311] border-[#1A3832] text-white h-10"
                    />
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1A3832]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-[#1A3832] text-[#BBD7D1] hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#70F1C7] hover:bg-[#85ffda] text-[#0D221E] font-bold px-6 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Dispensary'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
