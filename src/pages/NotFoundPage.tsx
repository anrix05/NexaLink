import React from 'react';
import { motion } from 'framer-motion';
import { Ghost, Home } from 'lucide-react';
import { Button } from '../components/common/UIComponents';

interface NotFoundPageProps {
  setActiveTab?: (tab: string) => void;
  isAuthenticated?: boolean;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ setActiveTab, isAuthenticated }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full space-y-6"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl flex items-center justify-center">
            <Ghost className="w-8 h-8 text-[#6B7280]" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-display font-black text-2xl tracking-tight text-[#0A0A0A]">
            Page Not Found
          </h1>
          <p className="text-sm font-medium text-[#6B7280]">
            The route you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>

        <div className="pt-4 flex justify-center">
          <Button
            variant="primary"
            onClick={() => setActiveTab?.(isAuthenticated ? 'dashboard' : 'landing')}
            icon={<Home className="w-4 h-4" />}
          >
            {isAuthenticated ? 'Return to Dashboard' : 'Return to Home'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
