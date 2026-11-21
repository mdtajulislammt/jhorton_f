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
    platform: 'OTHER',
    cartBaseUrl: '',
    allowedHosts: '',
    handoffNotes: '',
    isActive: true,
    hours: [] as any[],
  });

  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false);

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
      platform: 'OTHER',
      cartBaseUrl: '',
      allowedHosts: '',
      handoffNotes: '',
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
        platform: (d as any).platform || 'OTHER',
        cartBaseUrl: (d as any).cartBaseUrl || '',
        allowedHosts: ((d as any).allowedHosts || []).join(', '),
        handoffNotes: (d as any).handoffNotes || '',
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

      const payload = {
        ...formData,
        allowedHosts: formData.allowedHosts
          ? formData.allowedHosts.split(',').map((h) => h.trim()).filter(Boolean)
          : [],
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const handleRunHealthCheck = async () => {
    setIsRunningHealthCheck(true);
    try {
      const res = await fetch('/api/admin/health-check/run', { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success) {
        alert('Vendor health check completed successfully');
        fetchDispensaries();
      } else {
        alert(json.error?.message || 'Health check failed');
      }
    } catch {
      alert('Network error running health check');
    } finally {
      setIsRunningHealthCheck(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-[clamp(24px,3vw,34px)] leading-[1.08] tracking-[-0.01em] text-foreground">
            LICENSED DISPENSARIES
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure partner dispensaries, delivery coverage ZIPs, and operating/delivery hours.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRunHealthCheck}
            disabled={isRunningHealthCheck}
            variant="outline"
            className="border-border text-foreground hover:bg-secondary h-11 px-4 active:scale-[0.98]"
          >
            {isRunningHealthCheck ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
            ) : (
              <Clock className="w-4 h-4 mr-2 text-primary" />
            )}
            Run Health Check
          </Button>
          <Button
            onClick={openCreateModal}
            className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold h-11 px-5 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Licensed Dispensary
          </Button>
        </div>
      </div>

      {/* Dispensaries Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-40 bg-surface-muted" />
                <Skeleton className="h-4 w-32 bg-surface-muted" />
                <Skeleton className="h-8 w-24 bg-surface-muted" />
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
              className="bg-card border-border hover:border-primary/50 transition-all flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold leading-tight text-foreground">
                      {d.name}
                    </h3>
                    <div className="text-xs text-muted font-mono mt-0.5">
                      {d.licenseNumber || 'Licensed Partner'}
                    </div>
                  </div>
                  {d.isActive ? (
                    <Badge className="bg-success/10 text-success border border-success/30 text-xs">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-surface-muted text-muted text-xs">Inactive</Badge>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-success" />
                    <span>
                      {d.addressLine1}, {d.city}, {d.state} {d.zip}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {d.offersPickup && (
                      <Badge className="bg-primary/15 text-success border border-primary/50 text-[11px]">
                        <ShoppingBag className="w-3 h-3 mr-1" />
                        Dispensary Pickup
                      </Badge>
                    )}
                    {d.offersDelivery && (
                      <Badge className="bg-info/10 text-info border border-info/30 text-[11px]">
                        <Truck className="w-3 h-3 mr-1" />
                        Delivery ({d.coverageZips?.length || 0} ZIPs)
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex flex-col gap-1 text-xs text-muted">
                  <div className="flex items-center justify-between">
                    <span>Platform: {(d as any).platform || d.handoffChannel}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${
                        (d as any).healthStatus === 'OK'
                          ? 'text-success border-success/30'
                          : (d as any).healthStatus === 'UNREACHABLE'
                          ? 'text-danger border-danger/30'
                          : 'text-warning border-warning/30'
                      }`}
                    >
                      {(d as any).healthStatus || 'HEALTH: OK'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Last checked: {(d as any).lastHealthCheckAt ? new Date((d as any).lastHealthCheckAt).toLocaleDateString() : 'Never'}</span>
                    <span>{d.hoursCount} Hours Windows</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(d)}
                  className="w-full bg-surface-muted border-border text-foreground hover:text-success hover:border-primary h-9 mt-2"
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
        <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-3xl w-full p-6 text-foreground space-y-6 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-xl font-heading">
                {editingDispensary ? `Edit ${editingDispensary.name}` : 'Add Licensed Dispensary'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-danger" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Dispensary Name *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Gotham Greenery"
                    className="bg-background border-border text-foreground h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    NY OCM License Number
                  </label>
                  <Input
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    placeholder="OCM-CAURD-2024-xxx"
                    className="bg-background border-border text-foreground h-10"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Address Line 1 *
                  </label>
                  <Input
                    required
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    placeholder="123 Bowery"
                    className="bg-background border-border text-foreground h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    City
                  </label>
                  <Input
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="bg-background border-border text-foreground h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    ZIP Code *
                  </label>
                  <Input
                    required
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="bg-background border-border text-foreground h-10 font-mono"
                  />
                </div>
              </div>

              {/* Fulfillment Capabilities */}
              <div className="p-4 rounded-xl bg-background border border-border space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-success">
                  Fulfillment Capabilities
                </div>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={formData.offersPickup}
                      onChange={(e) => setFormData({ ...formData, offersPickup: e.target.checked })}
                      className="w-4 h-4 rounded text-success"
                    />
                    <span>Offers Dispensary Pickup</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={formData.offersDelivery}
                      onChange={(e) => setFormData({ ...formData, offersDelivery: e.target.checked })}
                      className="w-4 h-4 rounded text-success"
                    />
                    <span>Offers Direct Delivery</span>
                  </label>
                </div>

                {/* CoverageZipPicker */}
                {formData.offersDelivery && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Delivery Coverage ZIP Codes ({formData.coverageZips.length} ZIPs configured)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={newZipInput}
                        onChange={(e) => setNewZipInput(e.target.value)}
                        placeholder="Add 5-digit ZIP (e.g. 10001)"
                        className="w-44 bg-card border-border text-foreground h-9 font-mono"
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
                        className="bg-surface-muted border border-border text-success hover:bg-primary hover:text-primary-foreground h-9 px-3 text-xs"
                      >
                        Add ZIP
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                      {formData.coverageZips.map((zip) => (
                        <span
                          key={zip}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-muted border border-border text-foreground font-mono text-xs"
                        >
                          {zip}
                          <button
                            type="button"
                            onClick={() => handleRemoveZip(zip)}
                            className="text-muted hover:text-danger ml-1"
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
              <div className="p-4 rounded-xl bg-background border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-success flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Operating & Delivery Windows (America/New_York)
                  </div>
                  <div className="flex gap-1 bg-card p-1 rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => setActiveHoursTab('STORE')}
                      className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                        activeHoursTab === 'STORE'
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Store Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveHoursTab('DELIVERY')}
                      className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                        activeHoursTab === 'DELIVERY'
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'text-muted-foreground hover:text-foreground'
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

                    const handleRunHealthCheck = async () => {
    setIsRunningHealthCheck(true);
    try {
      const res = await fetch('/api/admin/health-check/run', { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success) {
        alert('Vendor health check completed successfully');
        fetchDispensaries();
      } else {
        alert(json.error?.message || 'Health check failed');
      }
    } catch {
      alert('Network error running health check');
    } finally {
      setIsRunningHealthCheck(false);
    }
  };

  return (
                      <div
                        key={dayIndex}
                        className="flex items-center justify-between gap-3 py-1.5 border-b border-border text-xs"
                      >
                        <span className="w-24 font-medium text-muted-foreground">{dayName}</span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 cursor-pointer text-muted text-xs mr-2">
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
                                className="w-24 bg-card border-border text-foreground h-8 text-xs font-mono"
                              />
                              <span className="text-muted">to</span>
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
                                className="w-24 bg-card border-border text-foreground h-8 text-xs font-mono"
                              />
                            </>
                          ) : (
                            <span className="w-52 text-center text-danger italic text-xs">
                              Store Closed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Platform & Handoff Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-background border border-border">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Vendor Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full bg-card border border-border text-foreground rounded-md px-3 h-10 text-sm"
                  >
                    <option value="WOOCOMMERCE">WooCommerce (Multi Add-to-Cart)</option>
                    <option value="SHOPIFY">Shopify (Direct Cart Link)</option>
                    <option value="BIGCOMMERCE">BigCommerce (Signed Cart Payload)</option>
                    <option value="OTHER">Other / Deep Link (Default)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Cart Base URL (HTTPS)
                  </label>
                  <Input
                    value={formData.cartBaseUrl}
                    onChange={(e) => setFormData({ ...formData, cartBaseUrl: e.target.value })}
                    placeholder="https://shop.dispensary.com"
                    className="bg-card border-border text-foreground h-10"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Allowed Redirect Hosts (comma separated)
                  </label>
                  <Input
                    value={formData.allowedHosts}
                    onChange={(e) => setFormData({ ...formData, allowedHosts: e.target.value })}
                    placeholder="dispensary.com, www.dispensary.com, shop.dispensary.com"
                    className="bg-card border-border text-foreground h-10 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Handoff Notes
                  </label>
                  <Input
                    value={formData.handoffNotes}
                    onChange={(e) => setFormData({ ...formData, handoffNotes: e.target.value })}
                    placeholder="e.g. Requires WooCommerce multi add-to-cart plugin"
                    className="bg-card border-border text-foreground h-10 text-xs"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-border text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold px-6 active:scale-[0.98]"
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
