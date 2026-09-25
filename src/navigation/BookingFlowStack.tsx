import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { BookingActivitySelectScreen } from '../screens/booking/BookingActivitySelectScreen';
import { BookingVenueSelectScreen } from '../screens/booking/BookingVenueSelectScreen';
import { BookingTimeSelectScreen } from '../screens/booking/BookingTimeSelectScreen';
import { BookingSummaryScreen } from '../screens/booking/BookingSummaryScreen';
import { BookingRequestSentScreen } from '../screens/booking/alerts/BookingRequestSentScreen';
import { BookingAcceptedScreen } from '../screens/booking/alerts/BookingAcceptedScreen';
import { BookingDeclinedScreen } from '../screens/booking/alerts/BookingDeclinedScreen';
import { BookingCounterOfferScreen } from '../screens/booking/alerts/BookingCounterOfferScreen';
import { BookingDetailScreen } from '../screens/bookings/BookingDetailScreen';
import { CompanionChatScreen } from '../screens/chat/CompanionChatScreen';

const Stack = createStackNavigator();

export const BookingFlowStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BookingActivitySelectScreen" component={BookingActivitySelectScreen} />
      <Stack.Screen name="BookingVenueSelectScreen" component={BookingVenueSelectScreen} />
      <Stack.Screen name="BookingTimeSelectScreen" component={BookingTimeSelectScreen} />
      <Stack.Screen name="BookingSummaryScreen" component={BookingSummaryScreen} />
      <Stack.Screen name="BookingRequestSentScreen" component={BookingRequestSentScreen} />
      <Stack.Screen name="BookingAcceptedScreen" component={BookingAcceptedScreen} />
      <Stack.Screen name="BookingDeclinedScreen" component={BookingDeclinedScreen} />
      <Stack.Screen name="BookingCounterOfferScreen" component={BookingCounterOfferScreen} />
      <Stack.Screen name="BookingDetailScreen" component={BookingDetailScreen} />
      <Stack.Screen name="CompanionChatScreen" component={CompanionChatScreen} />
    </Stack.Navigator>
  );
};
