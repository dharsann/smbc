'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApiService } from '@/services';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await ApiService.fetchUserProfile();
      if (user) {
        router.push('/chat');
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl">💬</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Blockchain Chat</h1>
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-600 mt-2">Loading...</p>
      </div>
    </div>
  );
}
