export const getTimeGreetingKey = (date = new Date()) => {
  const hour = date.getHours();

  if (hour < 12) return "good_morning";
  if (hour < 17) return "good_afternoon";
  return "good_evening";
};
