export interface BookingActivity {
  id: string;
  titleKey: string;
  defaultTitle: string;
  icon: string;
  price: string;
  descKey: string;
  defaultDesc: string;
}

export interface BookingVenue {
  id?: string;
  name: string;
  address: string;
  icon?: string;
}

export interface BookingStackParamList {
  LocationSelectionScreen: undefined;
  BookingActivitySelectScreen: { companionId?: string; companionName?: string } | undefined;
  BookingVenueSelectScreen: { activity?: BookingActivity; companionId?: string; companionName?: string } | undefined;
  BookingTimeSelectScreen: { activity?: BookingActivity; venue?: BookingVenue; companionId?: string; companionName?: string } | undefined;
  BookingSummaryScreen: { activity?: BookingActivity; venue?: BookingVenue; date?: string; time?: string; duration?: number; bookingId?: string; companionId?: string; companionName?: string; } | undefined;
  BookingSuccessScreen: undefined;
  BookingRequestSentScreen: { bookingId?: string; companionName?: string; date?: string; time?: string; venue?: string; amount?: string; } | undefined;
  BookingAcceptedScreen: undefined;
  BookingDeclinedScreen: undefined;
  BookingCounterOfferScreen: { bookingId?: string; companionName?: string; companionId?: string } | undefined;
  BookingDetailScreen: { bookingId?: string; status?: string } | undefined;
  CancelBookingScreen: { bookingId?: string } | undefined;
  ModifyBookingScreen: { bookingId?: string } | undefined;
  DisputeRefundScreen: { bookingId?: string } | undefined;
};
