'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchResultCard from '@/components/SearchResultCard';
import PriceFilter from '@/components/Filters/PriceFilter';
import AmenitiesFilter from '@/components/Filters/AmenitiesFilter';
import SizeFilter from '@/components/Filters/SizeFilter';
import LocationFilter from '@/components/Filters/LocationFilter';
import RoomTypeFilter from '@/components/Filters/RoomTypeFilter';
import GenderFilter from '@/components/Filters/GenderFilter';
import SortDropdown from '@/components/Filters/SortDropdown';
import { SearchFilters, Room } from '@/types/search';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<SearchFilters>({
    priceRange: [0, 10000000],
    sizeRange: [0, 200],
    amenities: [],
    location: {
      city: searchParams.get('city') || '',
      district: searchParams.get('district') || '',
      ward: searchParams.get('ward') || '',
    },
    roomType: '',
    gender: 'ALL',
    sortBy: 'newest',
  });

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchRooms();
  }, [filters, page]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const sortMap: Record<string, string> = {
        'newest': 'createdAt:DESC',
        'price-asc': 'pricePerMonth:ASC',
        'price-desc': 'pricePerMonth:DESC',
        'size-asc': 'area:ASC',
        'size-desc': 'area:DESC',
      };

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort: sortMap[filters.sortBy] || 'createdAt:DESC',
        minPrice: filters.priceRange[0].toString(),
        maxPrice: filters.priceRange[1].toString(),
        minArea: filters.sizeRange[0].toString(),
        maxArea: filters.sizeRange[1].toString(),
      });

      if (filters.location.city) {
        queryParams.append('city', filters.location.city);
      }
      if (filters.location.district) {
        queryParams.append('district', filters.location.district);
      }
      if (filters.location.ward) {
        queryParams.append('ward', filters.location.ward);
      }

      if (filters.roomType) {
        queryParams.append('roomType', filters.roomType);
      }

      if (filters.gender && filters.gender !== 'ALL') {
        queryParams.append('gender', filters.gender);
      }

      if (filters.amenities.length > 0) {
        queryParams.append('amenities', filters.amenities.join(','));
      }

      console.log('🔍 Fetching rooms with params:', queryParams.toString());
      console.log('📍 Location filter:', {
        city: filters.location.city,
        district: filters.location.district,
        ward: filters.location.ward
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // console.log('✅ API Response:', result);

      // ✅ Map API response to Room type
      if (result.success && result.data) {
        const mappedRooms: Room[] = (result.data.data || []).map((apiRoom: any) => ({
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
        setTotal(result.data.total || 0);
      } else {
        setRooms([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('❌ Error fetching rooms:', error);
      setRooms([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const clearAllFilters = () => {
    setFilters({
      priceRange: [0, 10000000],
      sizeRange: [0, 200],
      amenities: [],
      location: { city: '', district: '', ward: '' },
      roomType: '',
      gender: 'ALL',
      sortBy: 'newest',
    });
    setPage(1);
  };

  const activeFiltersCount =
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000 ? 1 : 0) +
    (filters.sizeRange[0] > 0 || filters.sizeRange[1] < 200 ? 1 : 0) +
    (filters.amenities.length > 0 ? 1 : 0) +
    (filters.location.city || filters.location.district || filters.location.ward ? 1 : 0) +
    (filters.roomType ? 1 : 0) +
    (filters.gender !== 'ALL' ? 1 : 0);

  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.location.city) params.set('city', filters.location.city);
    if (filters.location.district) params.set('district', filters.location.district);
    if (filters.location.ward) params.set('ward', filters.location.ward);
    if (filters.roomType) params.set('roomType', filters.roomType);

    if (filters.gender !== 'ALL') params.set('gender', filters.gender);

    if (filters.priceRange[0] > 0) params.set('minPrice', filters.priceRange[0].toString());
    if (filters.priceRange[1] < 10000000) params.set('maxPrice', filters.priceRange[1].toString());

    if (filters.sizeRange[0] > 0) params.set('minArea', filters.sizeRange[0].toString());
    if (filters.sizeRange[1] < 200) params.set('maxArea', filters.sizeRange[1].toString());

    if (filters.sortBy !== 'newest') params.set('sort', filters.sortBy);
    if (filters.amenities.length > 0) params.set('amenities', filters.amenities.join(','));
    if (page > 1) params.set('page', page.toString());

    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : '/search', { scroll: false });

  }, [filters, page]); 

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mt-10 sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <RoomTypeFilter
              value={filters.roomType as any}
              onChange={(value) => setFilters({ ...filters, roomType: value })}
            />

            <LocationFilter
              value={filters.location}
              onChange={(value) => setFilters({ ...filters, location: value })}
            />

            <PriceFilter
              value={filters.priceRange}
              onChange={(value) => setFilters({ ...filters, priceRange: value })}
            />

            <SizeFilter
              value={filters.sizeRange}
              onChange={(value) => setFilters({ ...filters, sizeRange: value })}
            />

            <GenderFilter
              value={filters.gender as any}
              onChange={(value) => setFilters({ ...filters, gender: value })}
            />

            <AmenitiesFilter
              value={filters.amenities}
              onChange={(value) => setFilters({ ...filters, amenities: value })}
            />

            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Xóa bộ lọc ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* Results Info & Sort */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Tìm thấy <span className="font-semibold text-gray-900">{total}</span> kết quả
              {filters.location.city && (
                <span> tại <span className="font-semibold text-gray-900">
                  {filters.location.ward || filters.location.district || filters.location.city}
                </span></span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <SortDropdown
                value={filters.sortBy}
                onChange={(value) => setFilters({ ...filters, sortBy: value as any })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                <div className="h-64 bg-gray-300" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-300 rounded w-3/4" />
                  <div className="h-4 bg-gray-300 rounded w-1/2" />
                  <div className="h-8 bg-gray-300 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Không tìm thấy kết quả
            </h3>
            <p className="text-gray-600 mb-6">
              Thử điều chỉnh bộ lọc hoặc tìm kiếm ở khu vực khác
            </p>
            <button
              onClick={clearAllFilters}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        ) : (
          <>
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-6'
            }>
              {rooms.map((room) => (
                <SearchResultCard key={room.id} room={room} />
              ))}
            </div>

            {/* Pagination */}
            {total > 12 && (
              <div className="mb-50 flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Trước
                </button>

                {[...Array(Math.ceil(total / 12))].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`px-4 py-2 rounded-lg transition ${page === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setPage(Math.min(Math.ceil(total / 12), page + 1))}
                  disabled={page === Math.ceil(total / 12)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
