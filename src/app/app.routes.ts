import { Routes } from '@angular/router';
import { Home } from './main pages/home/home';
import { Rooms } from './main pages/rooms/rooms';
import { Hotels } from './main pages/hotels/hotels';
import { BookedRooms } from './main pages/booked-rooms/booked-rooms';
import { RoomBooking } from './main pages/room-booking/room-booking';
import { Signup } from './main pages/signup/signup';
import { Signin } from './main pages/signin/signin';
import { Profile } from './main pages/profile/profile';

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
    },
    {
        path: 'signup',
        component:Signup
    },
    {
        path: 'register',
        redirectTo: '/signup',
        pathMatch: 'full'
    },
    {
        path: 'signin',
        component:Signin
    },
    {
        path: 'login',
        redirectTo: '/signin',
        pathMatch: 'full'
    },
    {
        path: 'profile',
        component: Profile
    }
];
