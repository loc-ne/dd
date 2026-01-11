import AmenityIcon from './AmenityIcon';

interface RoomAmenity {
  amenity: {
    id: number;
    name: string;
  };
}

export default function AmenityList({ amenities }: { amenities: RoomAmenity[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold mb-4">Tiện nghi</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {amenities.map((ra) => (
          <div 
            key={ra.amenity.id} 
            className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <AmenityIcon amenityName={ra.amenity.name} />
            <span className="text-gray-700 text-sm font-medium">{ra.amenity.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}