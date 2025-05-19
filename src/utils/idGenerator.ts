
/**
 * Simple utility to generate unique IDs without external dependencies
 * @returns A string ID that should be unique enough for our canvas application
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
};
