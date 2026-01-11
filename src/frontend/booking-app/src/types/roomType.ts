export const ROOM_TYPES = {
  ROOM: 'Phòng trọ',
  STUDIO: 'Căn hộ / Studio',
  DORM: 'KTX / Ở ghép',
  HOUSE: 'Nhà nguyên căn',
} as const;

export type RoomType = keyof typeof ROOM_TYPES; // "ROOM" | "STUDIO" | "DORM" | "HOUSE"
