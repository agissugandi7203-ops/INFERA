import React from 'react';

export const DashboardEmptyState: React.FC = () => {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 p-12 text-center">
      <h3 className="text-sm font-semibold text-neutral-800">
        Dashboard Kosong
      </h3>
      <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
        Halaman dashboard ini sengaja dibuat bersih dan minimalis sebagai fondasi fitur selanjutnya.
      </p>
    </div>
  );
};
