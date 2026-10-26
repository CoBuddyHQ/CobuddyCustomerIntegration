export const INTEREST_MAPPING: Record<string, { categoryId: string | null; activityLabels: string[] }> = {
  cafe: { categoryId: 'coffee', activityLabels: ['Coffee', 'Fine Dining'] },
  movie: { categoryId: 'movie', activityLabels: ['Art & Culture'] },
  tour: { categoryId: 'city', activityLabels: ['Architecture', 'Art & Culture'] },
  event: { categoryId: 'city', activityLabels: ['Networking'] },
  gym: { categoryId: null, activityLabels: ['Wellness'] },
  shopping: { categoryId: 'city', activityLabels: [] },
  dining: { categoryId: 'coffee', activityLabels: ['Fine Dining'] },
  art: { categoryId: 'study', activityLabels: ['Art & Culture', 'Architecture'] },
  network: { categoryId: 'study', activityLabels: ['Networking', 'Study Buddy'] },
  wellness: { categoryId: null, activityLabels: ['Wellness'] },
  language: { categoryId: 'study', activityLabels: ['Study Buddy', 'Networking'] },
  music: { categoryId: 'movie', activityLabels: ['Art & Culture'] },
  photography: { categoryId: 'city', activityLabels: ['Art & Culture'] },
  gaming: { categoryId: 'movie', activityLabels: [] },
};

export const LOCATION_BENEFITS = [
  {
    icon: 'shield-check-outline',
    titleKey: 'location.benefits.safety.title',
    defaultTitle: 'Safety Monitoring',
    subKey: 'location.benefits.safety.desc',
    defaultSub: 'Real-time location shared with trusted contacts during sessions',
  },
  {
    icon: 'map-marker-outline',
    titleKey: 'location.benefits.discovery.title',
    defaultTitle: 'Venue Discovery',
    subKey: 'location.benefits.discovery.desc',
    defaultSub: 'Find safe public places and popular venues near you',
  },
  {
    icon: 'navigation-variant-outline',
    titleKey: 'location.benefits.transit.title',
    defaultTitle: 'Protected Routes',
    subKey: 'location.benefits.transit.desc',
    defaultSub: 'Secure navigation and safe transit options',
  },
];

export const NOTIFICATION_BENEFITS = [
  {
    icon: 'bell-outline',
    titleKey: 'notification.benefits.updates.title',
    defaultTitle: 'Booking Updates',
    subKey: 'notification.benefits.updates.desc',
    defaultSub: 'Instant updates on your booking requests',
  },
  {
    icon: 'calendar-clock-outline',
    titleKey: 'notification.benefits.reminders.title',
    defaultTitle: 'Session Reminders',
    subKey: 'notification.benefits.reminders.desc',
    defaultSub: 'Never miss a booking or pre-session briefing',
  },
  {
    icon: 'shield-alert-outline',
    titleKey: 'notification.benefits.alerts.title',
    defaultTitle: 'Safety Pings',
    subKey: 'notification.benefits.alerts.desc',
    defaultSub: 'Emergency alerts and safety check-ins during sessions',
  },
];
