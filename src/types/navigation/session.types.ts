export interface SessionStackParamList {
  ActiveSessionScreen: { bookingId?: string; companionId?: string; companionName?: string; sessionId?: string } | undefined;
  ArrivalCheckInScreen: { companionId?: string; companionName?: string } | undefined;
  SessionReminderScreen: { bookingId?: string; companionName?: string; time?: string; venue?: string } | undefined;
  SessionCompleteScreen: { bookingId?: string; companionId?: string; companionName?: string; sessionId?: string; sessionStatus?: string } | undefined;
  PostSessionFeedbackScreen: { companionId?: string; companionName?: string; sessionId?: string } | undefined;
  TipGratuityScreen: { companionId?: string; companionName?: string } | undefined;
  CompanionReviewScreen: { bookingId?: string; companionId?: string; companionName?: string; sessionId?: string } | undefined;
};
