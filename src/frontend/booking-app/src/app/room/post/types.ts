
export type RoomType = 'SINGLE' | 'SHARED' | 'DORM' | 'APARTMENT' | '';
export type Gender = 'ALL' | 'MALE' | 'FEMALE';
export type UtilityUnit = 'KWH' | 'M3' | 'PERSON' | 'ROOM' | 'FREE';

export interface FormData {
    // 1. Basic Info
    title: string;
    description: string;
    roomType: RoomType;

    // 2. Location
    province: string;
    district: string;
    ward: string;
    address: string;
    latitude: number;
    longitude: number;
    // Store names for server submission
    cityName: string;
    districtName: string;
    wardName: string;

    // 3. Specs
    area: number;
    guestCapacity: number;

    // 4. Pricing & Utilities
    pricePerMonth: number;
    deposit: number;
    minLeaseTerm: number;

    electricityPrice: number;
    electricityUnit: UtilityUnit;

    waterPrice: number;
    waterUnit: UtilityUnit;

    wifiPrice: number;
    parkingFee: number;
    managementFee: number;
    miscNotes: string;

    // 5. Amenities & Rules
    amenities: string[];
    cookingAllowed: boolean;
    petAllowed: boolean;
    gender: Gender;
    curfew: boolean;
    curfewTime: string; // e.g., "23:00"

    // 6. Contact
    contactName: string;
    phone: string;

    // 7. Images
    images: File[];
    coverImageIndex: number;
}
