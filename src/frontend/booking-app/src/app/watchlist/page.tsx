'use client';

import { useEffect, useState } from 'react';
import SearchResultCard from '@/components/SearchResultCard';
import { Room } from '@/types/search';


export default function WatchlistPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Rooms updated:', rooms);
    }, [rooms]);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms/watchlist`, {
          credentials: 'include',
        });

        const result = await res.json();
        console.log('res', result);

        if (result) {
            const mappedRooms: Room[] = (result.data || []).map((apiRoom: any) => ({
                id: apiRoom.id,
                title: apiRoom.title,
                description: apiRoom.description,
                price: apiRoom.price,
                size: apiRoom.size,
                location: apiRoom.location,
                address: apiRoom.address,
                status: apiRoom.status,
                roomType: apiRoom.roomType,
                amenities: apiRoom.amenities || [],
                images: apiRoom.images || [],
                rating: apiRoom.rating || 0,
                reviewCount: 0,
                available: apiRoom.available,
                }));
            
            setRooms(mappedRooms);
            console.log('rooms', rooms)

        } else {
          setRooms([]);
          console.log('no');
        }
      } catch (error) {
        console.error('❌ Error fetching wishlist:', error);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Yêu thích
          </h1>
          <p className="text-gray-600 mt-1">
            Những phòng/căn hộ bạn đã lưu để xem lại sau
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl h-80 animate-pulse"
              />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Bạn chưa lưu phòng nào
            </h3>
            <p className="text-gray-500">
              Hãy nhấn ❤️ ở các phòng bạn yêu thích để lưu lại nhé.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <SearchResultCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
