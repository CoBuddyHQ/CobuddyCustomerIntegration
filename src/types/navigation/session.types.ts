export interface SessionStackParamList {
  ActiveSessionScreen: { companionId?: string; companionName?: string } | undefined;
  ArrivalCheckInScreen: { companionId?: string; companionName?: string } | undefined;
  SessionReminderScreen: { bookingId?: string; companionName?: string; time?: string; venue?: string } | undefined;
  SessionCompleteScreen: { companionId?: string; companionName?: string } | undefined;
  PostSessionFeedbackScreen: { companionId?: string; companionName?: string } | undefined;
  TipGratuityScreen: { companionId?: string; companionName?: string } | undefined;
  CompanionReviewScreen: { bookingId?: string; companionId?: string; companionName?: string } | undefined;
};
