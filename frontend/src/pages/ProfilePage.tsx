import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerProfile, useUpdateCustomer, useCustomerInvoices, useCustomerPayments, useRepeatInvoiceAsQuotation, useSendWhatsAppVerificationCode, useVerifyWhatsAppNumber } from '../hooks/useCustomer.js';
import { formatPrice } from '../lib/utils.js';
import { calculateDeliveryFee } from '../lib/deliveryFees.js';
import { toast } from 'react-hot-toast';
import { User, MapPin, CreditCard, Receipt, History, Edit3, Save, ChevronRight, AlertCircle } from 'lucide-react';
import { PhoneInput, type CountryCode } from '../components/ui/PhoneInput.js';
import { AddressFields, formatFullAddress, type AddressData } from '../components/ui/AddressFields.js';

export default function ProfilePage() {
  const { data: profile, isLoading } = useCustomerProfile();
  const { data: invoices } = useCustomerInvoices();
  const { data: payments } = useCustomerPayments();
  const updateCustomer = useUpdateCustomer();
  const repeatInvoice = useRepeatInvoiceAsQuotation();
  const sendWhatsAppCode = useSendWhatsAppVerificationCode();
  const verifyWhatsApp = useVerifyWhatsAppNumber();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [countryCode, setCountryCode] = useState<CountryCode>('ZA');
  const [addressData, setAddressData] = useState<AddressData>({
    streetName: '',
    area: '',
    province: '',
    postalCode: '',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    whatsappCode: '',
    countryCode: 'ZA',
    address: '',
    streetName: '',
    area: '',
    province: '',
    postalCode: '',
  });

  const handleEdit = () => {
    if (profile) {
      setEditForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        whatsappNumber: (profile as any).whatsappNumber || profile.phone || '',
        whatsappCode: '',
        countryCode: (profile as any).countryCode || 'ZA',
        address: profile.address || '',
        streetName: (profile as any).streetName || '',
        area: (profile as any).area || '',
        province: (profile as any).province || '',
        postalCode: (profile as any).postalCode || '',
      });
      setCountryCode(((profile as any).countryCode as CountryCode) || 'ZA');
      setAddressData({
        streetName: (profile as any).streetName || '',
        area: (profile as any).area || '',
        province: (profile as any).province || '',
        postalCode: (profile as any).postalCode || '',
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      // Build full address
      const fullAddress = formatFullAddress(addressData);
      
      await updateCustomer.mutateAsync({
        ...editForm,
        ...addressData,
        address: fullAddress || editForm.address,
        countryCode,
      });
      toast.success('Identity Refined');
      setIsEditing(false);
    } catch (error) {
      toast.error('Sync Failed');
    }
  };

  const currentDeliveryFee = calculateDeliveryFee(profile?.address || (profile as any)?.area, 'delivery');

  const handleRepeatInvoice = async (invoiceId: string) => {
    try {
      const result = await repeatInvoice.mutateAsync(invoiceId);
      const unavailable = result.unavailableItems?.length
        ? ` Unavailable this week: ${result.unavailableItems.join(', ')}.`
        : '';
      toast.success(`Repeat quotation issued.${unavailable}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'Could not issue repeat quotation');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-8">
        <div className="w-16 h-16 border-4 border-[var(--pigment-green)]/10 border-t-[var(--pigment-green)] rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-40">Authenticating identity...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-8">
        <div className="bg-[var(--pigment-oxide)]/10 border border-[var(--pigment-oxide)]/20 p-12 text-center">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--pigment-oxide)] mb-4">Signal Lost</h2>
          <p className="font-mono text-sm opacity-60 uppercase tracking-widest leading-relaxed">
            We couldn't retrieve your profile. <br /> Please attempt a reconnection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-20 pb-40">
      {/* Header */}
      <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <p className="font-mono text-[10px] uppercase font-bold tracking-[0.4em] text-[var(--pigment-ochre)] mb-4">
            Member Register
          </p>
          <h1 className="text-6xl font-[900] uppercase tracking-tighter text-[var(--pigment-green)]">
            Dashboard
          </h1>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="flex items-center gap-3 bg-white/50 border border-[var(--pigment-green)]/10 px-8 py-4 font-mono text-[10px] uppercase tracking-widest hover:bg-[var(--pigment-green)] hover:text-[var(--canvas)] transition-all"
          >
            <Edit3 size={14} />
            <span>Refine Identity</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Profile Info */}
        <div className="lg:col-span-8 space-y-12">
          <div className="bg-white/30 border border-[var(--pigment-ochre)]/10 p-10 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--pigment-green)]/5 -mr-16 -mt-16 rounded-full" />

            <div className="flex items-center gap-4 mb-12 opacity-40 font-mono text-[10px] uppercase tracking-[0.2em]">
              <User size={14} />
              <span>Authentication Details</span>
            </div>

            {isEditing ? (
              <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase tracking-widest opacity-40">Name</label>
                    <input
                      type="text"
                      className="w-full bg-[var(--canvas)]/50 border-b border-[var(--pigment-green)]/20 focus:border-[var(--pigment-green)] py-3 px-1 outline-none font-bold uppercase tracking-tighter transition-all"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase tracking-widest opacity-40">Email</label>
                    <input
                      type="email"
                      className="w-full bg-[var(--canvas)]/50 border-b border-[var(--pigment-green)]/20 focus:border-[var(--pigment-green)] py-3 px-1 outline-none font-bold uppercase tracking-tighter transition-all"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                </div>

            {/* Phone with Country Selector */}
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-widest opacity-40">Connection</label>
              <PhoneInput
                value={editForm.phone}
                onChange={(phone, code) => {
                  setEditForm({ ...editForm, phone, countryCode: code });
                  setCountryCode(code);
                }}
                countryCode={countryCode}
                onCountryChange={setCountryCode}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-3">
              <label className="font-mono text-[10px] uppercase tracking-widest opacity-40">WhatsApp Number</label>
              <input
                type="text"
                className="w-full bg-[var(--canvas)]/50 border-b border-[var(--pigment-green)]/20 focus:border-[var(--pigment-green)] py-3 px-1 outline-none font-bold uppercase tracking-tighter transition-all"
                value={editForm.whatsappNumber}
                onChange={(e) => setEditForm({ ...editForm, whatsappNumber: e.target.value, whatsappCode: '' })}
                placeholder="WhatsApp number"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await sendWhatsAppCode.mutateAsync(editForm.whatsappNumber);
                    toast.success('Verification code sent');
                  }}
                  className="px-4 py-2 bg-white/60 border border-[var(--pigment-green)]/10 font-mono text-[9px] uppercase tracking-widest"
                >
                  Send Code
                </button>
                <input
                  value={editForm.whatsappCode}
                  onChange={(e) => setEditForm({ ...editForm, whatsappCode: e.target.value })}
                  className="flex-1 bg-white/50 border border-[var(--pigment-green)]/10 px-3 py-2 font-mono text-xs"
                  placeholder="6-digit code"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await verifyWhatsApp.mutateAsync({ whatsappNumber: editForm.whatsappNumber, code: editForm.whatsappCode });
                    toast.success('WhatsApp verified');
                  }}
                  className="px-4 py-2 bg-[var(--pigment-green)] text-white font-mono text-[9px] uppercase tracking-widest"
                >
                  Verify
                </button>
              </div>
            </div>

            {/* Address Fields */}
            <div className="space-y-4">
              <label className="font-mono text-[10px] uppercase tracking-widest opacity-40">Delivery Address</label>
              <AddressFields
                data={addressData}
                onChange={(newData) => {
                  setAddressData(newData);
                  setEditForm({ ...editForm, ...newData });
                }}
                showLabels={true}
              />
            </div>

                <div className="flex gap-4 pt-6">
                  <button onClick={handleSave} className="bg-[var(--pigment-green)] text-[var(--canvas)] px-8 py-4 font-bold uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center gap-3">
                    <Save size={16} /> Save Changes
                  </button>
                  <button onClick={handleCancel} className="px-8 py-4 font-mono text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">
                    Discard
                  </button>
                </div>
              </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-40 block mb-1">Registered Entity</span>
                <span className="text-2xl font-black uppercase tracking-tighter text-[var(--pigment-green)]">{profile.name || 'ANONYMOUS'}</span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-40 block mb-1">Signal Channel</span>
                <span className="font-bold text-lg uppercase tracking-tight">{profile.email || 'N/A'}</span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-40 block mb-1">Connection Port</span>
                <span className="font-mono text-sm tracking-widest">{profile.phone || 'N/A'}</span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-40 block mb-1">WhatsApp Number</span>
                <span className="font-mono text-sm tracking-widest">
                  {(profile as any).whatsappNumber || 'N/A'} {(profile as any).whatsappVerified ? '✓ VERIFIED' : '— NOT VERIFIED'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-40 block mb-1">Logistic Node</span>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="mt-1 opacity-20" />
                  <span className="font-bold text-sm uppercase leading-relaxed">{(profile as any).streetName || 'UNDEFINED'}</span>
                </div>
                {(profile as any).area && (
                  <span className="font-mono text-[10px] opacity-40 uppercase tracking-widest">
                    {(profile as any).area}{(profile as any).province && `, ${(profile as any).province}`}{(profile as any).postalCode && ` ${(profile as any).postalCode}`}
                  </span>
                )}
                <div className="font-mono text-[10px] text-[var(--pigment-green)] uppercase tracking-widest mt-2">
                  Delivery Fee: R{currentDeliveryFee.fee} — {currentDeliveryFee.area}
                </div>
              </div>
            </div>
          )}
          </div>

          {/* History */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 opacity-40 font-mono text-[10px] uppercase tracking-[0.4em] px-4">
              <History size={14} />
              <span>Operational History</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Invoices */}
              <div className="bg-white/40 border border-[var(--pigment-ochre)]/10 p-8">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-[var(--pigment-ochre)]/10">
                  <h3 className="font-black uppercase tracking-tighter flex items-center gap-3">
                    <Receipt size={18} className="text-[var(--pigment-green)]" />
                    Invoices
                  </h3>
                </div>

                {!invoices || invoices.length === 0 ? (
                  <p className="font-mono text-[10px] opacity-40 uppercase tracking-widest py-10 text-center">No ledger entries detected</p>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {invoices.map((inv: any) => (
                      <div key={inv.id} className="p-4 bg-[var(--canvas)]/50 border border-[var(--pigment-ochre)]/5 hover:border-[var(--pigment-green)]/20 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono text-[10px] opacity-40 uppercase">#{inv.id.slice(0, 6)}</span>
                          <span className={`px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest border ${inv.status === 'paid' ? 'bg-[var(--pigment-green)]/10 text-[var(--pigment-green)] border-[var(--pigment-green)]/20' :
                            'bg-[var(--pigment-oxide)]/10 text-[var(--pigment-oxide)] border-[var(--pigment-oxide)]/20'
                            }`}>
                            {inv.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="font-mono text-[9px] opacity-40 uppercase">{new Date(inv.createdAt).toLocaleDateString('en-ZA')}</span>
                          <span className="text-xl font-black text-[var(--pigment-green)] group-hover:text-[var(--pigment-oxide)] transition-colors">R{formatPrice(inv.total)}</span>
                        </div>
                        <button
                          onClick={() => handleRepeatInvoice(inv.id)}
                          disabled={repeatInvoice.isPending}
                          className="mt-4 w-full border border-[var(--pigment-green)]/20 py-2 font-mono text-[9px] uppercase tracking-widest hover:bg-[var(--pigment-green)] hover:text-white transition-all disabled:opacity-50"
                        >
                          Repeat as Quotation
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payments */}
              <div className="bg-white/40 border border-[var(--pigment-ochre)]/10 p-8">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-[var(--pigment-ochre)]/10">
                  <h3 className="font-black uppercase tracking-tighter flex items-center gap-3">
                    <CreditCard size={18} className="text-[var(--pigment-green)]" />
                    Payments
                  </h3>
                </div>

                {!payments || payments.length === 0 ? (
                  <p className="font-mono text-[10px] opacity-40 uppercase tracking-widest py-10 text-center">No transactions registered</p>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {payments.map((p: any) => (
                      <div key={p.id} className="p-4 border-l-2 border-[var(--pigment-green)] bg-[var(--canvas)]/30">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-mono text-[10px] opacity-40 uppercase">{p.method}</span>
                          <span className="font-black">R{formatPrice(p.amount)}</span>
                        </div>
                        <p className="font-mono text-[8px] opacity-40 uppercase tracking-widest leading-none">
                          {new Date(p.paymentDate).toLocaleDateString('en-ZA')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar/Quick Stats */}
        <div className="lg:col-span-4 space-y-8">
          {/* Credit Card */}
          <div className="bg-[var(--pigment-green)] text-[var(--canvas)] p-10 relative overflow-hidden shadow-2xl">
            <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <p className="font-mono text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 mb-8">
              Available Credit
            </p>
            <div className="flex items-baseline gap-2 mb-10">
              <span className="font-mono text-xl opacity-40">R</span>
              <span className="text-6xl font-[900] tracking-tighter">{formatPrice(profile.creditBalance || 0)}</span>
            </div>
            <p className="font-mono text-[9px] uppercase tracking-widest leading-relaxed opacity-60">
              Allocated for future harvests. <br /> Applied automatically at checkout.
            </p>
          </div>

          {/* Outstanding Alert */}
          {invoices && invoices.some((inv: any) => inv.status !== 'paid') && (
            <div className="bg-[var(--pigment-oxide)] text-[var(--canvas)] p-10 shadow-xl animate-pulse">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle size={20} />
                <h3 className="font-black uppercase tracking-tighter">Settlement Required</h3>
              </div>
              <div className="space-y-6">
                {invoices.filter((inv: any) => inv.status !== 'paid').map((inv: any) => (
                  <button
                    key={inv.id}
                    onClick={() => navigate(`/payment/${inv.id}`)}
                    className="w-full group flex justify-between items-center border-b border-white/20 pb-4 hover:border-white transition-all"
                  >
                    <div className="text-left">
                      <div className="font-mono text-[9px] uppercase opacity-60">Invoice #{inv.id.slice(0, 6)}</div>
                      <div className="text-lg font-black italic">R{formatPrice(inv.total)}</div>
                    </div>
                    <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Account Status */}
          <div className="p-8 border border-[var(--pigment-ochre)]/20 bg-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-3 h-3 rounded-full bg-[var(--pigment-green)] shadow-[0_0_10px_var(--pigment-green)]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">Account Active</span>
            </div>
            <p className="font-mono text-[9px] opacity-40 uppercase tracking-widest leading-relaxed">
              Member of the harvest collective.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
