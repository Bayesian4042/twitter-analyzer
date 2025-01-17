export class DateUtil {
  static dateOutput = (dateStr: string): string => {
    const date = new Date(dateStr); 
    // const localizedDate = new Date(date.toLocaleString('en-US'));

    return date.toDateString(); 
  };

  static getCurrentDate = (): string => {
    const date = new Date();

    const options = { timeZone: 'America/Los_Angeles' };
    const localizedDate = new Date(date.toLocaleString('en-US', options));

    return localizedDate.toDateString(); 
  };

  static getDatesForLastSevenDays = (): string[] => {
    const today = new Date();

    const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - index); 

     
      const options = { timeZone: 'America/Los_Angeles' };
      const localizedDate = new Date(date.toLocaleString('en-US', options));

      return localizedDate.toDateString(); 
    });

    return lastSevenDays; 
  };
}
