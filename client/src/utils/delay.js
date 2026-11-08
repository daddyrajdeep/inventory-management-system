// Fake network delay so loading states can be tested with dummy data
export const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));
