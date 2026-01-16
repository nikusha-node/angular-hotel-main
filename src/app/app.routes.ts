import { Routes } from '@angular/router';
import { Home } from './main pages/home/home';
import { Rooms } from './main pages/rooms/rooms';
import { Hotels } from './main pages/hotels/hotels';
import { BookedRooms } from './main pages/booked-rooms/booked-rooms';
import { RoomBooking } from './main pages/room-booking/room-booking';

export const routes: Routes = [
    {
        path: '',
        component:Home
    },
    {
        path: 'rooms',
        component:Rooms
    },
    {
        path: 'hotels',
        component:Hotels
    },
    {
        path: 'bookedrooms',
        component:BookedRooms
    },
    {
        path: 'room-booking/:id',
        component:RoomBooking
    }
];
