// Kept in memory so an address never goes in a route
let draft = "";

export const setEmailDraft = (email: string) => {
  draft = email;
};

export const emailDraft = () => draft;
