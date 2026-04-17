export const getWeekBounds = (date: Date, tz: string) => {
    const localDate = new Date(date.toLocaleString("en-US", { timeZone: tz }));
    const sun = new Date(localDate);
    sun.setDate(localDate.getDate() - localDate.getDay());
    const sat = new Date(localDate);
    sat.setDate(localDate.getDate() - localDate.getDay() + 6);
    return {
        start: sun.toLocaleDateString('en-CA'),
        end: sat.toLocaleDateString('en-CA')
    };
};
