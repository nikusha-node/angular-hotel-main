export interface roomCard{
  id: number;
  name: string;
  pricePerNight: number;
  roomTypeId: number;
  maximumGuests: number;
  available: boolean;
  hotelId: number;
    bookedDates: {
    id: number;
    date: string;
    roomId: number;
  }[];
  images: {
    id: number;
    source: string;
  }[];
}

export interface RoomFilter {
  roomTypeId: number;
  priceFrom: number;
  priceTo: number;
  maximumGuests: number;
  checkIn?: string;
  checkOut?: string;
}

export interface hotelCard {
  id: number;
  name: string;
  featuredImage: string;
  city: string;
}

export interface bookingCard {
  id: number;
  roomID: number;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  isConfirmed: boolean;
  customerName: string;
  customerId: string;
  customerPhone: string;
}