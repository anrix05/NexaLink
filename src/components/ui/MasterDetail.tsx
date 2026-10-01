import React from 'react';
import { X } from 'lucide-react';

export interface MasterDetailProps {
  master: React.ReactNode;
  detail: React.ReactNode;
  detailOpen?: boolean;
  onCloseDetail?: () => void;
  className?: string;
  masterWidthClass?: string;
}

export const MasterDetail: React.FC<MasterDetailProps> = ({
  master,
  detail,
  detailOpen = false,
  onCloseDetail,
  className = '',
  masterWidthClass = 'w-full lg:w-[380px] xl:w-[440px]',
}) => {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-12 min-h-[600px] border border-[#E5E7EB] rounded-xl overflow-hidden bg-white ${className}`}
    >
      {/* Master List Column */}
      <div
        className={`${
          detailOpen ? 'hidden lg:block lg:col-span-5' : 'col-span-12 lg:col-span-5'
        } border-b lg:border-b-0 lg:border-r border-[#E5E7EB] flex flex-col h-full overflow-y-auto custom-scrollbar`}
      >
        {master}
      </div>

      {/* Detail Inspector Column */}
      <div
        className={`${
          detailOpen ? 'col-span-12 lg:col-span-7' : 'hidden lg:block lg:col-span-7'
        } flex flex-col h-full bg-[#FAFAFA] relative overflow-y-auto custom-scrollbar`}
      >
        {detailOpen && onCloseDetail && (
          <div className="lg:hidden p-3 border-b border-[#E5E7EB] bg-white flex justify-end">
            <button
              onClick={onCloseDetail}
              className="text-xs text-[#6B7280] hover:text-[#0A0A0A] flex items-center gap-1 font-medium p-1"
            >
              <X className="w-4 h-4" />
              <span>Back to list</span>
            </button>
          </div>
        )}
        {detail}
      </div>
    </div>
  );
};
