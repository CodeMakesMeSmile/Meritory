/** Sign in shows "Password saved" when it's opened with ?reset=done */
export const PASSWORD_SAVED_PARAM = "reset";
export const PASSWORD_SAVED_VALUE = "done";
export const PASSWORD_SAVED_URL = `/sign-in?${PASSWORD_SAVED_PARAM}=${PASSWORD_SAVED_VALUE}`;

/** Sign in says the account is gone when it's opened with ?deleted=1 */
export const ACCOUNT_DELETED_PARAM = "deleted";
export const ACCOUNT_DELETED_VALUE = "1";
export const ACCOUNT_DELETED_URL = `/sign-in?${ACCOUNT_DELETED_PARAM}=${ACCOUNT_DELETED_VALUE}`;
